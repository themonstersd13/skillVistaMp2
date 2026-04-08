from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..models import InterviewTurn, Student
from .content_library import get_year_pack
from .llm_orchestrator import LLMOrchestrator


def _flatten_topics(year_pack: dict[str, list[Any]]) -> list[str]:
    topics: list[str] = []
    for entries in year_pack.values():
        for entry in entries:
            topics.extend(entry.topics)
    return topics


def _heuristic_question(student: Student, year_pack: dict[str, list[Any]], question_index: int, interview_type: str) -> dict[str, Any]:
    tech_entries = year_pack.get("tech", [])
    non_tech_entries = year_pack.get("non_tech", [])
    tech_entry = tech_entries[question_index % max(len(tech_entries), 1)] if tech_entries else None
    soft_entry = non_tech_entries[question_index % max(len(non_tech_entries), 1)] if non_tech_entries else None

    focus = tech_entry.title if tech_entry else "core engineering concepts"
    soft_focus = soft_entry.title if soft_entry else "communication and ownership"
    if interview_type == "non_tech":
        question = (
            f"As a {student.academic_year} student targeting {student.target_role}, describe a real situation that shows "
            f"{soft_focus.lower()}, how you handled it, and what you learned from it."
        )
        rubric_focus = [soft_focus, student.target_role]
        expected = ["clear communication", "self-awareness", "structured answer"]
    else:
        question = (
            f"As a {student.academic_year} student targeting {student.target_role}, walk me through how you would apply "
            f"{focus.lower()} in a realistic project and justify the decisions you would make."
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
        for entry in active_entries:
            topics.extend(entry.topics)
        history = [
            {
                "question": turn.question_text,
                "answer": turn.transcript_text[:500],
            }
            for turn in prior_turns[-3:]
        ]

        narrowed_pack = {interview_type: active_entries, "non_tech": year_pack.get("non_tech", []), "tech": year_pack.get("tech", [])}
        fallback_payload = _heuristic_question(student, narrowed_pack, question_index, interview_type)
        prompt = f"""
You are SKILLVISTA's interview question planner.

Candidate profile:
- Name: {student.name}
- Academic year: {student.academic_year}
- Specialization: {student.specialization}
- Target role: {student.target_role}
- Interview type: {interview_type}
- Focus area: {focus_area}
- Known strengths: {", ".join(student.strengths)}
- Stretch goals: {", ".join(student.stretch_goals)}

Year-wise tech topics:
{topics}

Recent conversation:
{history}

Generate exactly one interview question that is strong enough for placement-readiness evaluation.
The question must:
- fit the candidate's academic year
- blend technical depth with professional communication
- feel adaptive based on previous responses
- avoid repeating prior questions

Return JSON with keys:
- question
- rubricFocus (array of short strings)
- expectedSignals (array of short strings)
"""
        return await self.llm.chat_json(prompt, fallback_payload)

    async def generate_swot(
        self,
        student: Student,
        session_summary: dict[str, Any],
        feature_summary: dict[str, Any],
    ) -> tuple[dict[str, Any], str]:
        fallback_payload = {
            "summary": f"{student.name} shows promising {student.academic_year}-level readiness with visible growth potential.",
            "strengths": [
                "Connects answers to project contexts instead of staying purely theoretical.",
                "Shows enough communication structure to support team collaboration.",
            ],
            "weaknesses": [
                "Needs sharper technical precision in follow-up depth.",
                "Could answer with stronger metrics, examples, and explicit tradeoffs.",
            ],
            "opportunities": [
                "Practice year-aligned mock interviews with more depth on core topics.",
                "Strengthen project storytelling with measurable outcomes.",
            ],
            "threats": [
                "Inconsistent clarity under pressure may reduce interview confidence.",
                "If fundamentals remain shallow, higher-stakes technical rounds may expose gaps.",
            ],
        }
        prompt = f"""
You are SKILLVISTA's qualitative evaluator.

Candidate:
- Name: {student.name}
- Academic year: {student.academic_year}
- Specialization: {student.specialization}
- Target role: {student.target_role}

Session summary:
{session_summary}

Feature summary:
{feature_summary}

Create a placement-oriented SWOT analysis grounded in the session evidence.
Return JSON with keys:
- summary
- strengths (array)
- weaknesses (array)
- opportunities (array)
- threats (array)
"""
        return await self.llm.chat_json(prompt, fallback_payload)
