YEAR_WISE_TRACKS = {
    "FY": {
        "tech": [
            {
                "title": "Python and Computational Thinking",
                "summary": "Strengthen Python fluency through variables, functions, loops, debugging, and small automation-style problems.",
                "topics": ["Python syntax", "Conditionals", "Loops", "Functions", "Lists and strings", "Input/output", "Debugging discipline"],
                "prompts": [
                    "Walk through a beginner Python problem before writing code.",
                    "Explain how you would break a practical task into small Python functions.",
                ],
            },
            {
                "title": "Programming Logic and Problem Solving",
                "summary": "Build algorithmic thinking with step-by-step reasoning, dry runs, patterns, and edge-case awareness.",
                "topics": ["Pseudo code", "Dry runs", "Pattern recognition", "Basic complexity intuition", "Test cases", "Problem decomposition"],
                "prompts": [
                    "How do you reason through a problem when you do not know the final code immediately?",
                    "Describe how you validate a simple solution with inputs, outputs, and edge cases.",
                ],
            },
            {
                "title": "Developer Foundations",
                "summary": "Introduce Git, terminal usage, web basics, and how software pieces fit together in real projects.",
                "topics": ["Git basics", "Command line", "Files and folders", "HTTP basics", "Frontend versus backend", "IDE workflow"],
                "prompts": [
                    "Explain how you would manage a small student project with Git.",
                    "What is the role of the backend in a beginner full-stack application?",
                ],
            },
        ],
        "non_tech": [
            {
                "title": "Learning Systems and Communication",
                "summary": "Develop disciplined study habits, peer communication, reflective learning, and confidence while speaking about technical work.",
                "topics": ["Learning routines", "Active listening", "Peer explanation", "Presentation confidence", "Growth mindset", "Feedback habits"],
                "prompts": [
                    "How do you recover when you get stuck on a topic or coding bug?",
                    "How would you explain a programming concept to a classmate who is new to it?",
                ],
            },
            {
                "title": "Team Readiness",
                "summary": "Practice reliability, collaboration, and professional behavior in labs, mini-projects, and beginner team settings.",
                "topics": ["Responsibility", "Time management", "Peer coordination", "Clarity in updates", "Asking for help early"],
                "prompts": [
                    "Describe how you contribute when a team assignment is moving slowly.",
                    "How do you communicate that you need help without losing ownership?",
                ],
            },
        ],
    },
    "SY": {
        "tech": [
            {
                "title": "Data Structures and Engineering Core",
                "summary": "Deepen understanding of linear data structures, OOP thinking, DBMS basics, and implementation tradeoffs.",
                "topics": ["Stacks and queues", "Linked structures", "Recursion basics", "OOP design", "SQL joins", "Normalization"],
                "prompts": [
                    "Compare two data structures and justify which one fits a real use case better.",
                    "Explain how object-oriented design improves a medium-size student project.",
                ],
            },
            {
                "title": "Web and API Systems",
                "summary": "Introduce modular web architecture, authentication, API contracts, and frontend-backend coordination.",
                "topics": ["REST APIs", "Authentication basics", "HTTP methods", "React fundamentals", "State management", "Form handling"],
                "prompts": [
                    "How would you structure a small full-stack student project from UI to API?",
                    "What is the difference between authentication and authorization in a real app?",
                ],
            },
            {
                "title": "Practical Project Delivery",
                "summary": "Translate classroom concepts into buildable features with cleaner implementation, testing, and iteration.",
                "topics": ["Feature planning", "Debugging workflow", "Code organization", "Version control teamwork", "Bug fixing"],
                "prompts": [
                    "Describe how you would take a project idea from rough concept to demo-ready build.",
                    "How do you debug a feature that works for you but breaks for someone else?",
                ],
            },
        ],
        "non_tech": [
            {
                "title": "Collaboration and Ownership",
                "summary": "Strengthen teamwork, meeting communication, written updates, and accountable execution.",
                "topics": ["Conflict resolution", "Peer accountability", "Written updates", "Initiative", "Professional etiquette"],
                "prompts": [
                    "Describe a situation where teamwork mattered more than individual speed.",
                    "How do you raise a risk early without sounding negative?",
                ],
            },
            {
                "title": "Presentation and Influence",
                "summary": "Build confidence while presenting technical ideas, demos, and decisions to classmates and mentors.",
                "topics": ["Demo storytelling", "Audience awareness", "Clarity", "Confidence", "Handling questions"],
                "prompts": [
                    "How do you present a technical feature to someone who only cares about outcomes?",
                    "What do you do when a presentation question catches you off guard?",
                ],
            },
        ],
    },
    "TY": {
        "tech": [
            {
                "title": "Placement-Critical Engineering Depth",
                "summary": "Focus on DSA, OS, DBMS, computer networks, system tradeoffs, and project articulation for placement rounds.",
                "topics": ["Trees and graphs", "Concurrency basics", "Transactions", "Indexing", "API scalability", "Caching", "Time-space tradeoffs"],
                "prompts": [
                    "Walk through a project decision and the tradeoff behind it.",
                    "How would you improve the performance of a slow API or query path?",
                ],
            },
            {
                "title": "AI and Applied Product Thinking",
                "summary": "Connect backend services, ML-assisted workflows, evaluation design, and measurable product outcomes.",
                "topics": ["Model serving basics", "Prompt design", "Evaluation loops", "Data pipelines", "Observability", "Product metrics"],
                "prompts": [
                    "What would you measure in an AI-assisted interview platform and why?",
                    "How do you validate whether an intelligent feature is actually helping users?",
                ],
            },
            {
                "title": "Advanced Project Communication",
                "summary": "Turn projects into hiring signal with cleaner architecture stories, metrics, and debugging narratives.",
                "topics": ["Architecture explanation", "Impact metrics", "Tradeoff justification", "Debugging stories", "Code quality decisions"],
                "prompts": [
                    "Which project best demonstrates your readiness and what specific engineering choices prove it?",
                    "How do you explain technical debt or a failed implementation choice in an interview?",
                ],
            },
        ],
        "non_tech": [
            {
                "title": "Interview Presence",
                "summary": "Build concise storytelling, confidence under pressure, and structured behavioral responses.",
                "topics": ["STAR method", "Project storytelling", "Decision framing", "Ownership language", "Feedback handling"],
                "prompts": [
                    "Tell me about a difficult engineering problem and how you handled ambiguity.",
                    "How do you respond when your initial solution does not work?",
                ],
            },
            {
                "title": "Professional Decision Making",
                "summary": "Practice judgment, prioritization, and communication that feel stronger than a classroom-only mindset.",
                "topics": ["Prioritization", "Risk communication", "Tradeoff clarity", "Escalation", "Stakeholder thinking"],
                "prompts": [
                    "How do you decide what to do first when several things are broken or delayed?",
                    "How do you explain a technical compromise to a non-technical stakeholder?",
                ],
            },
        ],
    },
    "LY": {
        "tech": [
            {
                "title": "Industry Transition Readiness",
                "summary": "Operate at placement-readiness level across system design, reliability, code quality, and product impact.",
                "topics": ["Distributed systems basics", "API reliability", "Security posture", "CI/CD", "Architecture tradeoffs", "Incident reduction"],
                "prompts": [
                    "Design a scalable interview evaluation platform at a high level.",
                    "How would you reduce production incidents in a growing service?",
                ],
            },
            {
                "title": "Portfolio and Domain Specialization",
                "summary": "Translate project depth into hiring signal with measurable outcomes and sharper engineering judgment.",
                "topics": ["Impact metrics", "Architecture rationale", "Tech debt choices", "Mentoring", "Launch readiness", "Ownership"],
                "prompts": [
                    "What project of yours best proves readiness for an engineering role, and why?",
                    "Where would you invest if you had one month to improve your resume impact?",
                ],
            },
            {
                "title": "Backend and Platform Judgment",
                "summary": "Strengthen production-minded thinking around performance, reliability, security, and maintainability.",
                "topics": ["Database performance", "Service boundaries", "Operational maturity", "Security basics", "Observability", "Release safety"],
                "prompts": [
                    "How do you make a backend system easier to operate as complexity grows?",
                    "What signals tell you a service is not production-ready yet?",
                ],
            },
        ],
        "non_tech": [
            {
                "title": "Professional Maturity",
                "summary": "Demonstrate collaboration, leadership potential, stakeholder communication, and execution reliability.",
                "topics": ["Leadership without authority", "Stakeholder updates", "Escalation judgment", "Prioritization", "Learning velocity"],
                "prompts": [
                    "How do you balance speed, quality, and communication under a real deadline?",
                    "Describe how you influence a team decision when you are not the most senior person.",
                ],
            },
            {
                "title": "Transition to Workplace Impact",
                "summary": "Move from student execution to workplace-ready communication, ownership, and context awareness.",
                "topics": ["Business context", "Cross-functional clarity", "Expectation setting", "Decision ownership", "Feedback loops"],
                "prompts": [
                    "How do you keep stakeholders informed without overwhelming them with details?",
                    "How do you recover trust after a mistake in a live project or delivery cycle?",
                ],
            },
        ],
    },
}
