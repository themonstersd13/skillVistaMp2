# SKILLVISTA Demo Stack

This repository now has one active backend and one frontend:

- `backend/`: FastAPI + Socket.IO + SQLAlchemy + SQLite + RAG/evaluation services
- `web app/`: React + Vite candidate portal

The old Node/Express backend has been removed so the project is fully Python-first.

## Architecture

- Login, dashboard, history, interview, and report screens are all backed by FastAPI routes.
- Candidate records, interview sessions, turns, and evaluation reports are stored in SQLite.
- Interview prompts and SWOT-style evaluation are generated through the RAG/evaluation services in `backend/src/services/`.
- Audio uploads are saved under `backend/uploads/`.

## Run

Backend:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```

Frontend:

```powershell
cd "web app"
npm install
copy .env.example .env
npm run dev
```

## Demo Login

Once both services are running:

1. Open the frontend in the browser.
2. Pick a seeded candidate from the login screen.
3. Start an interview, upload answers, and view the generated report.

Manual JWT login still works, but the primary flow now comes from the FastAPI database.

## app 