# SKILLVISTA Remaining Work

The major demo-stack work is now done. What remains is mostly production hardening, deeper evaluation quality, and the faculty/mobile surfaces that will be built by the rest of the team.

## Still Pending

### 1. Production Auth And RBAC

- Replace demo-token workflows with real admin or faculty-issued JWTs
- Add RBAC for faculty, student, and admin roles
- Add faculty CRUD flows for student onboarding and interview assignment

### 2. Stronger Realtime Reliability

- Add explicit reconnect backoff and network-loss recovery UX
- Add device-disconnect handling during active interviews
- Add better socket integration tests beyond the current REST smoke coverage

### 3. Better Speech And Evaluation Quality

- Validate Gemini and Groq transcription with real audio samples
- Add chunked upload support for long answers
- Improve feature extraction with richer pause, sentiment, and fluency signals
- Replace heuristic scoring with a trained ML model when available

### 4. Better RAG And Academic Content Management

- Move year-wise content from seeded static data into faculty-manageable DB tables and admin tools
- Add resume upload, syllabus upload, and candidate-specific context retrieval
- Add embedding-based retrieval once pgvector or a vector store is introduced

### 5. Faculty And Mobile Consumption Surfaces

- Build the faculty dashboard for cohort views, student creation, and assessment management
- Build the mobile app screens that consume the stored analytics and SWOT reports
- Add aggregate analytics endpoints for branch-wise, year-wise, and cohort-wise summaries

### 6. Testing And Deployment

- Add backend unit and integration tests
- Add frontend component tests for the interview loop
- Add Docker or deployment scripts for local and cloud setup
- Add observability, structured logging, and error reporting

## Recommended Next Steps

1. Test the full web interview loop against real Ollama, Gemini, and Groq credentials.
2. Freeze the backend payload contract so your colleague can build the faculty/mobile apps safely.
3. Add RBAC and faculty content management next, because that unlocks the rest of the platform.
