# schemas.py
# Pydantic response schema for Resume Review (no JD).

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class CandidateSchema(BaseModel):
    name: Optional[str] = Field(default="Candidate")
    email: Optional[str] = Field(default="")
    phone: Optional[str] = Field(default="")
    linkedin: Optional[str] = Field(default="")
    github: Optional[str] = Field(default="")


class DetectedRoleSchema(BaseModel):
    role: str
    confidence_pct: int
    seniority: str
    years_estimated: float


class DimensionScoreItem(BaseModel):
    score: int
    weight: str


class ATSScoreSchema(BaseModel):
    final_score: int
    grade: str
    verdict: str
    description: str
    percentile: str
    seniority_mode: str


class BulletRewriteItem(BaseModel):
    original: str
    rewritten: str
    why: str


class SkillSuggestionItem(BaseModel):
    skill: str
    reason: str


class AIReviewSchema(BaseModel):
    executive_summary: str
    top_strengths: List[str]
    critical_issues: List[str]
    bullet_rewrites: List[BulletRewriteItem]
    skill_suggestions: List[SkillSuggestionItem]
    interview_readiness: str
    week_1_action: str
    used_fallback: bool


class ScoreBoostItem(BaseModel):
    action: str
    score_boost: str
    effort: str
    priority: int


class ResumeReviewResponseSchema(BaseModel):
    candidate: CandidateSchema
    detected_role: DetectedRoleSchema
    ats_score: ATSScoreSchema
    dimension_scores: Dict[str, DimensionScoreItem]
    what_you_did_well: List[str]
    issues_to_fix: List[str]
    score_boosts: List[ScoreBoostItem]
    ai_review: AIReviewSchema
    skills_found: List[str]