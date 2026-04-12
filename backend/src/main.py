from __future__ import annotations

from contextlib import asynccontextmanager
from urllib.parse import parse_qs

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine, run_startup_migrations
from .models import InterviewSession
from .mongo import close_mongo, init_mongo
from .routers import auth, dev, interview, reports, faculty
from .security import decode_candidate_token
from .services.interview_runtime import InterviewRuntime
from .services.seeder import ensure_demo_data
from .workers.task_queue import task_queue

settings = get_settings()
runtime = InterviewRuntime()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=settings.cors_origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    settings.resolved_uploads_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    run_startup_migrations()

    # Seed demo data
    db = SessionLocal()
    try:
        ensure_demo_data(db)
    finally:
        db.close()

    # Initialize MongoDB (if configured)
    await init_mongo()

    # Register and start background workers
    from .workers.evaluation_worker import run_evaluation_task
    from .workers.analytics_worker import run_cohort_analytics
    task_queue.register("evaluate_session", run_evaluation_task)
    task_queue.register("cohort_analytics", run_cohort_analytics)
    
    await task_queue.start()

    yield

    # ── Shutdown ──
    await task_queue.stop()
    await close_mongo()


fastapi_app = FastAPI(title=settings.app_name, lifespan=lifespan)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.include_router(auth.router)
fastapi_app.include_router(interview.router)
fastapi_app.include_router(reports.router)
fastapi_app.include_router(faculty.router)
fastapi_app.include_router(dev.router)


@fastapi_app.get("/api/health")
def healthcheck():
    return {
        "status": "ok",
        "service": settings.app_name,
        "postgres": settings.is_postgres,
        "mongodb": settings.has_mongodb,
        "workers": "running",
    }


@sio.event
async def connect(sid, environ, auth):  # noqa: ANN001
    token = (auth or {}).get("token")
    parsed_query = parse_qs(environ.get("QUERY_STRING", ""))
    session_id = (auth or {}).get("sessionId") or parsed_query.get("session", [""])[0]
    if not token or not session_id:
        raise ConnectionRefusedError("Missing token or sessionId")

    claims = decode_candidate_token(token)
    db = SessionLocal()
    try:
        session = db.get(InterviewSession, session_id)
        if not session or session.student_id != claims.student_id:
            raise ConnectionRefusedError("Session not found")
        await sio.save_session(sid, {"session_id": session_id, "student_id": claims.student_id})
        await sio.enter_room(sid, session_id)
        await sio.emit(
            "session_resumed",
            {
                "startedAt": session.started_at.isoformat(),
                "currentQuestion": {
                    "id": f"{session.id}:{session.current_question_index}",
                    "question": session.current_question,
                },
            },
            room=sid,
        )
    finally:
        db.close()


@sio.event
async def disconnect(sid):  # noqa: ANN001
    return None


@sio.event
async def submit_audio(sid, data):  # noqa: ANN001
    saved = await sio.get_session(sid)
    session_id = data.get("sessionId") or saved.get("session_id")
    student_id = saved.get("student_id")
    blob = data.get("blob")
    mime_type = data.get("mimeType")
    duration_ms = float(data.get("durationMs", 0))

    if isinstance(blob, bytearray):
        audio_bytes = bytes(blob)
    elif isinstance(blob, bytes):
        audio_bytes = blob
    elif isinstance(blob, list):
        audio_bytes = bytes(blob)
    else:
        audio_bytes = b""

    db = SessionLocal()
    try:
        session = db.get(InterviewSession, session_id)
        if not session or session.student_id != student_id:
            return {"ok": False, "message": "Session not found"}

        student = session.student
        await sio.emit("ai_thinking", {"thinking": True}, room=session_id)
        payload = await runtime.process_audio(
            db=db,
            session=session,
            student=student,
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            duration_seconds=max(duration_ms / 1000.0, 1.0),
        )
        await sio.emit("answer_received", payload["ack"], room=session_id)
        if payload.get("finished"):
            await sio.emit("ai_thinking", {"thinking": False}, room=session_id)
            await sio.emit("interview_finished", {"sessionId": session_id}, room=session_id)
        else:
            next_question = payload["next_question"]
            await sio.emit("receive_question", next_question, room=session_id)
            await sio.emit("ai_thinking", {"thinking": False}, room=session_id)
        return {"ok": True, **payload["ack"]}
    except Exception as exc:  # noqa: BLE001
        await sio.emit("ai_thinking", {"thinking": False}, room=session_id)
        return {"ok": False, "message": str(exc)}
    finally:
        db.close()


app = socketio.ASGIApp(
    sio,
    other_asgi_app=fastapi_app,
    socketio_path=settings.socket_path.lstrip("/"),
)
