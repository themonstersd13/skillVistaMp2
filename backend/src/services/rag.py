from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..models import InterviewTurn, Student
from .content_library import get_year_pack
from .llm_orchestrator import LLMOrchestrator


# ── Interviewer Persona ──
INTERVIEWER_PERSONA = """You are a senior technical interviewer at a product company conducting a real placement interview.

CRITICAL BEHAVIORAL RULES:
1. Ask questions the way a REAL person would — conversational, direct, and natural.
2. DO NOT sound like a textbook or a question bank. Sound like a person sitting across the table.
3. Use the candidate's previous answers to build follow-up questions. Reference their specific claims.
4. Escalate difficulty based on how well they answered the last question.
5. If their previous answer was vague, probe deeper into the SAME topic before moving on.
6. If their previous answer was strong, challenge them with a harder angle or edge case.
7. Keep questions concise — no more than 2-3 sentences.
8. Never repeat a question or topic that was already covered.
9. NEVER invent resume items, achievements, or tools the candidate did not provide.
10. Stay grounded ONLY in the supplied candidate profile and RAG context.

QUESTION STYLE EXAMPLES:
- Instead of: "Explain the concept of polymorphism in object-oriented programming."
  Say: "You mentioned you work with Python — can you walk me through a time you used inheritance or polymorphism in one of your projects and why you chose that approach?"

- Instead of: "Describe a situation where you showed leadership."
  Say: "You were VP of CodeChef club — tell me about a specific event or decision where things didn't go as planned. How did you handle it?"

- Instead of: "What are the advantages of using React?"
  Say: "You've built dashboard interfaces with React — if you had to rebuild one of them today, what would you do differently in terms of state management?"
"""


def _build_conversation_context(prior_turns: list[InterviewTurn]) -> list[dict[str, str]]:
    """Build a structured conversation history with quality signals."""
    history = []
    for turn in prior_turns[-3:]:
        answer_length = len(turn.transcript_text.split())
        quality = "strong" if turn.technical_signal > 70 and answer_length > 40 else "adequate" if answer_length > 20 else "thin"
        history.append({
            "question": turn.question_text,
            "answer_excerpt": turn.transcript_text[:400],
            "answer_quality": quality,
            "technical_signal": round(turn.technical_signal, 1),
            "behavioral_signal": round(turn.behavioral_signal, 1),
            "word_count": answer_length,
        })
    return history


def _determine_question_strategy(prior_turns: list[InterviewTurn], question_index: int, total_questions: int) -> str:
    """Determine the interview flow phase and question strategy."""
    progress = question_index / max(total_questions, 1)

    if progress <= 0.2:
        return "OPENING: Ask a warm-up question that builds rapport. Ask about their background, motivation, or a recent project. Keep it approachable."
    elif progress <= 0.6:
        if prior_turns:
            last_turn = prior_turns[-1]
            if last_turn.technical_signal < 50 or len(last_turn.transcript_text.split()) < 20:
                return "PROBE: Their last answer was thin or vague. Ask a follow-up on the SAME topic. Go deeper. Ask 'why' or 'how specifically' or ask for a concrete example."
            else:
                return "CORE: Ask a substantive question that tests depth. Move to a new topic within the focus area. Increase the difficulty."
        return "CORE: Ask a substantive question on the focus area topic."
    elif progress <= 0.85:
        return "DEEP DIVE: This is the hardest part. Ask about tradeoffs, edge cases, system design decisions, or challenge an assumption they made earlier."
    else:
        return "CLOSING: Ask a reflective question. What would they do differently? What's their biggest learning? How do they see themselves growing? Keep it forward-looking."


def _heuristic_question(student: Student, year_pack: dict[str, list[Any]], question_index: int, interview_type: str) -> dict[str, Any]:
    tech_entries = year_pack.get("tech", [])
    non_tech_entries = year_pack.get("non_tech", [])
    tech_entry = tech_entries[question_index % max(len(tech_entries), 1)] if tech_entries else None
    soft_entry = non_tech_entries[question_index % max(len(non_tech_entries), 1)] if non_tech_entries else None

    focus = tech_entry.title if tech_entry else "core engineering concepts"
    soft_focus = soft_entry.title if soft_entry else "communication and ownership"
    profile = student.profile_json or {}
    project_context = profile.get("project_context") or "recent coursework"
    preferred_languages = ", ".join(profile.get("preferred_languages", [])) or "their tools"

    if interview_type == "non_tech":
        question = (
            f"Tell me about a real situation from {project_context} that shows how you handle "
            f"{soft_focus.lower()}. What happened, what did you do, and what did you learn?"
        )
        rubric_focus = [soft_focus, student.target_role]
        expected = ["clear communication", "self-awareness", "structured answer"]
    else:
        question = (
            f"You work with {preferred_languages} — walk me through how you'd approach "
            f"{focus.lower()} in the context of {project_context}. What decisions would you make and why?"
        )
        rubric_focus = [focus, student.target_role]
        expected = ["structured reasoning", "applied fundamentals", "technical clarity"]

    return {
        "question": question,
        "rubricFocus": rubric_focus,
        "expectedSignals": expected,
    }


class RAGService:
    def __init__(self) -> None:
        self.llm = LLMOrchestrator()

    async def generate_question(
        self,
        db: Session,
        student: Student,
        prior_turns: list[InterviewTurn],
        question_index: int,
        interview_type: str,
        focus_area: str,
    ) -> tuple[dict[str, Any], str]:
        year_pack = get_year_pack(db, student.academic_year)
        selected_entries = year_pack.get(interview_type, [])
        matching_entry = next((entry for entry in selected_entries if entry.title == focus_area), None)
        active_entries = [matching_entry] if matching_entry else selected_entries
        topics = []
        reference_prompts = []
        for entry in active_entries:
            topics.extend(entry.topics)
            reference_prompts.extend(entry.prompts)

        # Build conversation context with quality signals
        conversation_history = _build_conversation_context(prior_turns)

        # Determine interview strategy
        total_q = 5  # default
        strategy = _determine_question_strategy(prior_turns, question_index, total_q)

        profile = student.profile_json or {}
        evidence = profile.get("evidence", [])
        evidence_text = "\n".join(f"- {e}" for e in evidence) if evidence else "No specific evidence provided."

        narrowed_pack = {interview_type: active_entries, "non_tech": year_pack.get("non_tech", []), "tech": year_pack.get("tech", [])}
        fallback_payload = _heuristic_question(student, narrowed_pack, question_index, interview_type)

        prompt = f"""{INTERVIEWER_PERSONA}

── CANDIDATE PROFILE ──
Name: {student.name}
Academic Year: {student.academic_year}
Specialization: {student.specialization}
Target Role: {student.target_role}
Interview Type: {interview_type}
Focus Area: {focus_area}
Known Strengths: {", ".join(student.strengths)}
Growth Areas: {", ".join(student.stretch_goals)}
Project Context: {profile.get("project_context", "Not specified")}
Preferred Languages/Tools: {", ".join(profile.get("preferred_languages", []))}
Candidate Evidence:
{evidence_text}

── RAG CONTEXT (Topics from academic content) ──
{topics[:10]}

── REFERENCE PROMPTS (from content pack) ──
{reference_prompts[:5]}

── CONVERSATION SO FAR ──
{conversation_history}

── STRATEGY FOR THIS QUESTION ──
Question {question_index + 1}: {strategy}

── INSTRUCTIONS ──
Generate exactly ONE interview question following the strategy above.
The question must:
- Sound like a real person asking (conversational, direct)
- If there's conversation history, reference or build on specific points from their previous answers
- Match the academic year level of the candidate
- Stay grounded only in the supplied profile — never invent facts about the candidate
- Be 1-3 sentences max

Return JSON:
{{"question": "...", "rubricFocus": ["...", "..."], "expectedSignals": ["...", "..."]}}
"""
        return await self.llm.chat_json(prompt, fallback_payload)

    async def generate_swot(
        self,
        student: Student,
        session_summary: dict[str, Any],
        feature_summary: dict[str, Any],
    ) -> tuple[dict[str, Any], str]:
        profile = student.profile_json or {}
        fallback_payload = {
            "summary": f"{student.name} shows promising {student.academic_year}-level readiness with visible growth potential.",
            "technical_analysis": {
                "summary": f"Technical performance is strongest when {student.name} anchors answers in {profile.get('project_context', 'real examples')}.",
                "strengths": [
                    "Connects technical answers to practical implementation context.",
                    "Shows an emerging ability to reason through engineering tradeoffs.",
                ],
                "weaknesses": [
                    "Needs sharper technical precision in follow-up depth.",
                    "Could support answers with more concrete metrics.",
                ],
                "opportunities": [
                    "Practice mock interviews with deeper fundamentals.",
                    "Expand examples around tools, architecture, and debugging.",
                ],
                "threats": [
                    "Shallow depth in follow-up rounds may reduce interviewer confidence.",
                ],
            },
            "non_technical_analysis": {
                "summary": f"Professional communication is developing well, especially when {student.name} reflects on ownership.",
                "strengths": [
                    "Shows enough communication structure to support team collaboration.",
                    "Explains intent and learning mindset with clarity.",
                ],
                "weaknesses": [
                    "Could answer with stronger storytelling and sharper impact framing.",
                    "Needs more explicit structure under pressure.",
                ],
                "opportunities": [
                    "Strengthen project storytelling with measurable outcomes.",
                    "Practice behavioral responses with clearer decision framing.",
                ],
                "threats": [
                    "Inconsistent clarity under pressure may reduce interview confidence.",
                ],
            },
            "recommended_focus": [
                "Use project evidence instead of generic claims in every answer.",
                "Connect fundamentals to the exact role being targeted.",
                "Make communication more structured with outcomes and tradeoffs.",
            ],
        }

        prompt = f"""You are SKILLVISTA's qualitative evaluator — an expert at placement readiness analysis.

── CANDIDATE ──
Name: {student.name}
Academic Year: {student.academic_year}
Specialization: {student.specialization}
Target Role: {student.target_role}
Candidate Context: {profile}

── SESSION EVIDENCE ──
Questions asked: {session_summary.get("questions", [])}
Answers given: {session_summary.get("answers", [])}
Total questions: {session_summary.get("question_count", 0)}

── QUANTITATIVE SIGNALS ──
{feature_summary}

── INSTRUCTIONS ──
Create a placement-oriented SWOT analysis grounded in the session evidence.
Be SPECIFIC — reference exact moments from their answers, not generic statements.
For each recommended action, include what specifically to practice and why.

Return JSON:
{{
  "summary": "1-2 sentence overall assessment",
  "technical_analysis": {{
    "summary": "...",
    "strengths": ["specific evidence-based strength"],
    "weaknesses": ["specific area with evidence"],
    "opportunities": ["actionable improvement with details"],
    "threats": ["specific risk"]
  }},
  "non_technical_analysis": {{
    "summary": "...",
    "strengths": [...],
    "weaknesses": [...],
    "opportunities": [...],
    "threats": [...]
  }},
  "recommended_focus": [
    "Specific, actionable item with clear next step"
  ]
}}
"""
        return await self.llm.chat_json(prompt, fallback_payload)
