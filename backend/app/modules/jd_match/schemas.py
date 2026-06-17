# app/modules/jd_match/schemas.py
# Pydantic v2 data schemas for JD Matcher API contracts.

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# ── INPUT SCHEMAS ─────────────────────────────────────────────────────────────

class JDMatchRequestSchema(BaseModel):
    jd_text: str = Field(
        ...,
        description="Raw unstructured job description text",
        min_length=50,
    )
    parsed_resume: Dict[str, Any] = Field(
        ...,
        description="Complete parsed resume dict from resume_review module",
    )
    resume_full_text: str = Field(
        ...,
        description="Raw full text of the candidate resume (for LLM context)",
        min_length=10,
    )


# ── SUB-SCHEMAS ───────────────────────────────────────────────────────────────

class SeniorityAlignmentSchema(BaseModel):
    aligned: bool
    required_years: int
    candidate_years: int
    evaluation: str


class SemanticMatchItemSchema(BaseModel):
    required: str
    matched_with: str
    similarity: int = Field(description="Similarity percentage 0–100")


class SkillsMappingSchema(BaseModel):
    exact_matches: List[str]
    semantic_matches: List[SemanticMatchItemSchema]
    missing_skills: List[str]
    match_pct: int


class ResumeAdjustmentSchema(BaseModel):
    section: str
    original_bullet: str
    optimized_bullet: str
    reason_for_change: str


# ── RESPONSE SCHEMA ───────────────────────────────────────────────────────────

class JDMatchResponseSchema(BaseModel):
    match_percentage: int = Field(description="Overall compatibility score 0–100")
    verdict: str = Field(description="Recruiter screening verdict")
    seniority_alignment: SeniorityAlignmentSchema
    skills_mapping: SkillsMappingSchema
    resume_adjustments: List[ResumeAdjustmentSchema]
    interview_talking_points: List[str]
