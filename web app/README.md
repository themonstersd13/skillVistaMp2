# SKILLVISTA Demo Stack

This repository now contains a working SKILLVISTA demo stack with both the candidate web portal and a FastAPI-based core engine. The system is designed around a realtime interview loop: the frontend acts as a thin terminal, the backend generates adaptive prompts, transcription and evaluation providers are orchestrated behind the scenes, and the final report is stored in the database for downstream apps.

## What Is Implemented

### Frontend

- Backend-driven candidate login with browser-session persistence
- Manual JWT fallback for existing signed tokens
- Protected routing into the interview arena
- Mandatory camera and microphone pre-check
- Live Socket.IO interview session management
- Dynamic question board fed only by backend events
- MediaRecorder answer capture with manual start and stop
- Socket-first audio upload with HTTP fallback
- Session ID recovery through `sessionStorage`
- Dark-mode interview UI with timer, AI state, mic state, webcam PiP, and event telemetry

### Backend

- FastAPI REST API on port `4000`
- Auth endpoints that issue candidate JWTs from seeded SQLite records
- Python Socket.IO server compatible with the current React client
- SQLite persistence for:
  - students
  - faculties
  - year-wise content
  - interview sessions
  - interview turns
  - final evaluation reports
- Seeded demo data for FY, SY, TY, and LY students plus faculty records
- Seeded starter sessions and reports so every demo candidate has backend data immediately
- Year-wise tech and non-tech content packs for prompt grounding
- RAG-style adaptive question generation using:
  - Ollama `llama3.1` as primary
  - Groq as LLM fallback
  - heuristic fallback if no model provider is configured
- Transcription orchestration using:
  - Gemini as primary
  - Groq as fallback
  - synthetic transcript fallback for local demo continuity
- Quantitative evaluation pipeline with feature extraction for:
  - speaking rate
  - filler usage
  - technical signal
  - behavioral signal
  - confidence signal
- Qualitative SWOT generation and merged final report storage
- Analytics endpoints that a future mobile or faculty app can consume

## Repository Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- config.py
|   |   |-- db.py
|   |   |-- dependencies.py
|   |   |-- main.py
|   |   |-- models.py
|   |   |-- schemas.py
|   |   |-- security.py
|   |   |-- data/
|   |   |   `-- year_tracks.py
|   |   |-- routers/
|   |   |   |-- dev.py
|   |   |   |-- interview.py
|   |   |   `-- reports.py
|   |   `-- services/
|   |       |-- content_library.py
|   |       |-- evaluation.py
|   |       |-- feature_extractor.py
|   |       |-- interview_runtime.py
|   |       |-- llm_orchestrator.py
|   |       |-- rag.py
|   |       |-- seeder.py
|   |       `-- transcription.py
|   |-- uploads/
|   |-- .env.example
|   |-- README.md
|   |-- requirements.txt
|   `-- skillvista_demo.db
`-- web app/
    |-- src/
    |-- public/
    |-- .env.example
    |-- package.json
    `-- REMAINING_WORK.md
```

## Frontend Environment

Create a local `.env` file in `web app/` from `web app/.env.example`.

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_SOCKET_PATH=/socket.io
```

## Backend Environment

Create a local `.env` file inside `backend/` from `backend/.env.example`.

```bash
SKILLVISTA_ENV=development
SKILLVISTA_DB_URL=sqlite:///./skillvista_demo.db
SKILLVISTA_JWT_SECRET=skillvista-dev-secret
SKILLVISTA_ALLOWED_ORIGINS=http://localhost:5173
SKILLVISTA_SOCKET_PATH=/socket.io
SKILLVISTA_UPLOADS_DIR=./uploads

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

GEMINI_API_KEY=
GEMINI_TRANSCRIBE_MODEL=gemini-2.5-flash-lite

GROQ_API_KEY=
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_TRANSCRIBE_MODEL=whisper-large-v3
```

## How To Start Frontend And Backend

Use two terminals.

### Terminal 1: Start the backend

From the project root:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```

The backend will run at:

```text
http://localhost:4000
```

### Terminal 2: Start the frontend

From the project root:

```powershell
cd "web app"
npm install
copy .env.example .env
npm run dev
```

The frontend will run at the Vite URL, usually:

```text
http://localhost:5173
```

### After both are running

1. Open the frontend in the browser
2. Choose one seeded candidate from the login screen
3. Run the hardware check
4. Start the interview
5. Answer prompts and finish the session
6. Open the report screen to review the stored evaluation

## Quick Restart

If dependencies and `.env` files are already set up, you only need:

### Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```

### Frontend

```powershell
cd "web app"
npm run dev
```

## Key API Endpoints

- `GET /api/auth/candidates`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/health`
- `POST /api/dev/seed`
- `GET /api/dev/tokens`
- `GET /api/dev/sessions`
- `POST /api/interview/start`
- `POST /api/interview/{sessionId}/audio`
- `POST /api/interview/{sessionId}/complete`
- `GET /api/analytics/student/{studentId}`
- `GET /api/analytics/cohort/{academicYear}`

## Socket Events

- Client to server:
  - `submit_audio`
- Server to client:
  - `session_resumed`
  - `receive_question`
  - `ai_thinking`
  - `answer_received`
  - `interview_finished`

## Verification

### Frontend

```powershell
npm run lint
npm run build
```

### Backend

The backend has been smoke-tested locally with:

- seeded data creation
- demo token generation
- interview start
- HTTP audio upload fallback
- session completion
- analytics report retrieval

## Notes

- The backend is structured so your colleague can later add RBAC, faculty authoring flows, and a separate app for report consumption without changing the core evaluation storage shape.
- When Gemini or Groq keys are not configured, the demo still works using deterministic fallback behavior so development is not blocked.
- See `web app/REMAINING_WORK.md` for the smaller set of production-oriented items still open.
