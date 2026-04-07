# SKILLVISTA Backend

FastAPI + Socket.IO backend for the SKILLVISTA demo stack.

## What it includes

- FastAPI REST API for interview lifecycle and analytics
- Python Socket.IO server compatible with the current React frontend
- SQLite persistence for students, sessions, turns, year-wise content, and evaluation reports
- Seeded demo data for FY, SY, TY, and LY candidate journeys
- Ollama Llama 3.1 as the primary question/evaluation model
- Gemini transcription as the primary speech-to-text path
- Groq fallback for chat and transcription
- Heuristic fallback behavior so the demo still works without external model keys

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
uvicorn app.main:app --reload --port 4000
```

## Useful Dev Endpoints

- `POST /api/dev/seed`
- `GET /api/dev/tokens`
- `GET /api/dev/sessions`
- `GET /api/analytics/student/{student_id}`
