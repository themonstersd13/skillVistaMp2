# SKILLVISTA Backend

FastAPI + Socket.IO backend for the SKILLVISTA demo stack.

## Structure

```text
backend/
|-- src/
|   |-- data/
|   |-- routers/
|   |-- services/
|   |-- config.py
|   |-- db.py
|   `-- main.py
|-- uploads/
|-- .env.example
|-- requirements.txt
`-- skillvista_demo.db
```

## What it includes

- FastAPI REST API for interview lifecycle and analytics
- FastAPI auth endpoints backed by the student database
- Python Socket.IO server compatible with the current React frontend
- SQLite persistence for students, sessions, turns, year-wise content, and evaluation reports
- Seeded demo data for FY, SY, TY, and LY candidate journeys
- Ollama Llama 3.1 as the primary question/evaluation model
- Gemini transcription as the primary speech-to-text path, using `gemini-2.5-flash-lite` by default
- Groq fallback for chat and transcription
- Heuristic fallback behavior so the demo still works without external model keys
- Raw interview audio persisted under `backend/uploads/interviews/`

## Database

SQLite is the default database and is managed through SQLAlchemy models in `src/models.py`.

The backend seeds:

- student records
- faculty records
- year-wise RAG content
- starter sessions and evaluation reports for each demo candidate

## Run

1. Create `.env` from `.env.example`
2. Create a virtual environment and install dependencies

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Start the API

```powershell
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```

Using `python -m uvicorn` is recommended here because it avoids stale Windows launcher paths after project folder moves.

## Frontend Contract

The React frontend uses these backend paths directly:

- `GET /api/auth/candidates`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/interview/dashboard`
- `GET /api/interview/history`
- `POST /api/interview/start`
- `POST /api/interview/{session_id}/audio`
- `POST /api/interview/{session_id}/complete`
- `GET /api/analytics/me/latest`

## Useful Dev Endpoints

- `POST /api/dev/seed`
- `GET /api/dev/tokens`
- `GET /api/dev/sessions`
- `GET /api/analytics/student/{student_id}`
