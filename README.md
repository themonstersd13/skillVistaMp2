# SKILLVISTA Demo Stack

The SKILLVISTA demo stack has been modernized into a production-ready ecosystem spanning three core components:

1. `backend/`: FastAPI + Socket.IO + PostgreSQL (Relational) + MongoDB (Document) + Background Workers
2. `web app/`: React + Vite web portal (Student Workspace & Faculty Dashboard)
3. `SkillVistaApp/`: React Native mobile application

## Architecture Highlights

*   **Database Refit**: Transitioned from a pure SQLite backend to a hybrid architecture. Uses **PostgreSQL** for relational entities (Students, Faculty, Reports) and **MongoDB** for unstructured massive objects (transcripts, RAG embeddings).
*   **Background Workers**: Built an async `workers/` queue. Heavy LLM processing (SWOT generation) and Cohort Analytics calculation run asynchronously rather than freezing user requests.
*   **Web Portal Redesign**: Features a Unified Design System (Inter font, Indigo/Slate `.sv-` namespace). Contains an immersive `LiveInterviewArena` with a dynamic API-driven radar chart on the `ReportPage`, alongside a new `FacultyDashboardPage`.
*   **Generative AI Pipeline**: The RAG orchestrator acts as a "Senior Technical Interviewer", retaining conversational memory constraint checks, applying adaptive flow changes (Probe → Core → Deep Dive), and utilizing feature extraction (STAR method & intent detection).
*   **Mobile App integration**: The `SkillVistaApp` pulls and parses live backend analytical payloads and user contexts organically via a fetch-bound `api.js` wrapper.

## Run The Stack

Start the backend:
```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```

Start the web portal:
```powershell
cd "web app"
npm install
copy .env.example .env
npm run dev
```

Start the mobile app:
```powershell
cd SkillVistaApp
npm install
npm start
```