# SKILLVISTA Backend

FastAPI + Socket.IO intelligence core for the SKILLVISTA ecosystem.

## Structure

```text
backend/
|-- src/
|   |-- data/
|   |-- routers/     # API routes (Auth, Interview, Faculty, Reports)
|   |-- services/    # Live orchestration (RAG, LLMs, Voice, Analytics)
|   |-- workers/     # Async queue evaluating models and rolling analytics
|   |-- config.py
|   |-- db.py        # SQLAlchemy / PostgreSQL hookup
|   |-- mongo.py     # Motor / MongoDB Hookup for huge docs
|   `-- main.py
|-- uploads/
|-- .env.example
|-- requirements.txt
`-- skillvista_demo.db
```

## Architecture Upgrades

*   **Hybrid Database**: Connects to `PostgreSQL` through `SQLAlchemy` (with dynamic connection pooling enabled). Defaults back to SQLite if not provided. Unstructured context blocks and RAG embeddings route dynamically to a `MongoDB` instance if configured.
*   **Asynchronous Service Layer**: Implemented `asyncio.Queue` workers (`evaluation_worker.py` and `analytics_worker.py`). The notoriously heavy language-model generation for SWOT analysis no longer hangs active API HTTP requests.
*   **Human-Like RAG Orchestrator**: The interview `rag.py` has been explicitly tuned as a conversational persona. It possesses short-term conversation memory and grades prior sentences manually with `feature_extractor.py` (which detects the STAR behavioral method) to challenge candidates dynamically rather than feeding static questions.

## Run

1. Create `.env` from `.env.example`
2. Create tightly scoped virtual environment:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Start the API cluster:

```powershell
.\.venv\Scripts\python.exe -m uvicorn src.main:app --reload --port 4000
```
