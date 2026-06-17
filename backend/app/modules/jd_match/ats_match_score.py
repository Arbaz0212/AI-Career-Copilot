# app/modules/jd_match/ats_match_score.py
# Premium ATS scoring engine for JD vs Resume matching.
# Computes 5 section-level scores + a weighted composite match_score.
# Pure programmatic math — no LLM calls here.
# Each section score tells the user exactly where they stand.

from __future__ import annotations
import math
import logging
from app.database.vectordb import generate_single_embedding
from .semantic_match import cosine_similarity

logger = logging.getLogger(__name__)

# ── SECTION DIMENSIONS ─────────────────────────────────────────────────────────
# Five scoring dimensions with their weights in the composite score.
# Weights sum to 100% — the composite IS the match_percentage.
# Dynamic industry profiles: weights shift based on detected industry.
# Default weights are optimised for general/tech roles.

INDUSTRY_PROFILES = {
    "tech": {
        "keyword_match": {"weight": 0.30, "label": "Keyword Optimisation", "description": "How well your resume contains the exact terms and phrases the JD requires."},
        "skills_alignment": {"weight": 0.25, "label": "Skills Alignment", "description": "Depth of your technical and soft skill coverage against the JD requirements."},
        "experience_fit": {"weight": 0.20, "label": "Experience Fit", "description": "Alignment of your experience level, seniority, and background with the role."},
        "content_depth": {"weight": 0.15, "label": "Content Depth", "description": "Quality and completeness of your resume content — summary, achievements, context."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Resume structure, section coverage, and professional presentation signals."},
    },
    "healthcare": {
        "keyword_match": {"weight": 0.25, "label": "Keyword Optimisation", "description": "Presence of healthcare-specific terminology, certifications, and required skills."},
        "skills_alignment": {"weight": 0.25, "label": "Skills Alignment", "description": "Coverage of clinical, technical, and regulatory skill requirements."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Relevance of clinical hours, patient care, and hands-on medical experience."},
        "content_depth": {"weight": 0.15, "label": "Content Depth", "description": "Detail on patient outcomes, procedures, certifications, and casework."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Professional presentation — license numbers, certifications, clear contact info."},
    },
    "sales": {
        "keyword_match": {"weight": 0.25, "label": "Keyword Optimisation", "description": "Use of sales, CRM, and market-specific terminology in your resume."},
        "skills_alignment": {"weight": 0.20, "label": "Skills Alignment", "description": "Coverage of sales methodologies, tools, and soft skills required."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Quota attainment, territory size, deal sizes, and industry tenure."},
        "content_depth": {"weight": 0.20, "label": "Content Depth", "description": "Quantified achievements — revenue targets, conversion rates, pipeline size."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Professional layout, LinkedIn presence, and section completeness."},
    },
    "creative": {
        "keyword_match": {"weight": 0.15, "label": "Keyword Optimisation", "description": "Relevant design tools, methodologies, and creative terminology."},
        "skills_alignment": {"weight": 0.20, "label": "Skills Alignment", "description": "Coverage of design, software, and creative skill requirements."},
        "experience_fit": {"weight": 0.20, "label": "Experience Fit", "description": "Portfolio strength, project complexity, and creative experience depth."},
        "content_depth": {"weight": 0.30, "label": "Portfolio & Impact", "description": "Portfolio quality, case studies, creative process, and measurable outcomes."},
        "format_quality": {"weight": 0.15, "label": "Format & Quality", "description": "Visual presentation, design of resume itself, and professional layout."},
    },
    "finance": {
        "keyword_match": {"weight": 0.25, "label": "Keyword Optimisation", "description": "Use of financial terminology, regulations, and quantitative language."},
        "skills_alignment": {"weight": 0.25, "label": "Skills Alignment", "description": "Coverage of financial analysis, modeling, compliance, and tool proficiency."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Relevance of deal size, portfolio value, audit scope, and years in finance."},
        "content_depth": {"weight": 0.15, "label": "Content Depth", "description": "Quantified financial outcomes — AUM, budgets managed, savings achieved."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Precision, certifications (CFA, CPA), and error-free presentation."},
    },
    "legal": {
        "keyword_match": {"weight": 0.20, "label": "Keyword Optimisation", "description": "Presence of legal terminology, statutes, and practice area keywords."},
        "skills_alignment": {"weight": 0.25, "label": "Skills Alignment", "description": "Coverage of legal skills — research, writing, litigation, compliance."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Years of practice, case complexity, court experience, and firm reputation."},
        "content_depth": {"weight": 0.20, "label": "Content Depth", "description": "Case outcomes, brief quality, settlements, and precedent-setting work."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Precision of language, bar numbers, education credentials, and clean formatting."},
    },
    "education": {
        "keyword_match": {"weight": 0.20, "label": "Keyword Optimisation", "description": "Use of pedagogical terminology, subject expertise, and education keywords."},
        "skills_alignment": {"weight": 0.20, "label": "Skills Alignment", "description": "Coverage of teaching, curriculum design, assessment, and student support skills."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Years of teaching, grade levels, subject breadth, and institutional experience."},
        "content_depth": {"weight": 0.25, "label": "Content Depth", "description": "Student outcomes, curriculum innovations, mentoring results, and research."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Credentials, publications, certifications, and professional affiliations."},
    },
    "hr": {
        "keyword_match": {"weight": 0.20, "label": "Keyword Optimisation", "description": "Use of HR, recruiting, and people-operations terminology."},
        "skills_alignment": {"weight": 0.25, "label": "Skills Alignment", "description": "Coverage of HR skills — recruitment, employee relations, compliance, payroll."},
        "experience_fit": {"weight": 0.25, "label": "Experience Fit", "description": "Scale of organisations, headcount managed, and HR functional breadth."},
        "content_depth": {"weight": 0.20, "label": "Content Depth", "description": "Quantified HR outcomes — retention rates, hire quality, time-to-fill."},
        "format_quality": {"weight": 0.10, "label": "Format & Quality", "description": "Professional presentation, HRIS proficiency mentions, and certifications."},
    },
}

# Default to tech profile
DIMENSIONS = dict(INDUSTRY_PROFILES["tech"])


# ── INDUSTRY CLASSIFIER ────────────────────────────────────────────────────────
# Detects the industry from raw JD text using keyword signatures.

INDUSTRY_SIGNATURES: dict[str, set[str]] = {
    "tech": {
        "software", "engineering", "developer", "code", "api", "algorithm",
        "agile", "sprint", "backend", "frontend", "full-stack", "full stack",
        "devops", "deploy", "kubernetes", "docker", "microservice",
        "programming", "python", "java", "javascript", "sql", "database",
        "cloud", "aws", "azure", "gcp", "ci/cd", "machine learning",
        "llm", "ai", "neural", "data pipeline", "test automation",
        "sdlc", "version control", "git", "rest api", "scrum",
        "software development", "technical", "system design", "architecture",
        "cyber", "security", "penetration", "vulnerability",
    },
    "healthcare": {
        "patient", "clinical", "hospital", "medical", "nurse", "doctor",
        "physician", "diagnosis", "treatment", "surgery", "pharmacy",
        "ehr", "emr", "hipaa", "cpt", "icd-10", "medication",
        "therapeutic", "radiology", "pathology", "cardiology",
        "pediatric", "oncology", "neurology", "inpatient", "outpatient",
        "telemedicine", "triage", "hospice", "rehabilitation",
        "healthcare", "anatomy", "physiology", "certification",
        "cerner", "epic", "meditech", "billing", "coding",
    },
    "sales": {
        "sales", "revenue", "quota", "pipeline", "prospect", "lead generation",
        "cold call", "outreach", "negotiation", "account management",
        "territory", "crm", "salesforce", "hubspot", "sales navigator",
        "upsell", "cross-sell", "roi", "conversion", "closing",
        "b2b", "b2c", "enterprise sales", "saas", "demo",
        "sales cycle", "forecast", "deal size", "contract value",
        "sales process", "customer acquisition", "retention",
        "sales strategy", "business development", "partnership",
    },
    "creative": {
        "design", "creative", "art", "visual", "brand", "typography",
        "illustration", "animation", "motion", "photoshop", "illustrator",
        "figma", "sketch", "adobe", "ui", "ux", "user experience",
        "user interface", "wireframe", "prototype", "mockup",
        "portfolio", "photography", "videography", "editing",
        "graphic design", "layout", "color theory", "composition",
        "creative direction", "art direction", "storyboard",
        "blender", "cinema 4d", "maya", "3d", "rendering",
        "creative suite", "indesign", "after effects",
    },
    "finance": {
        "financial", "finance", "accounting", "audit", "tax", "budget",
        "forecast", "revenue", "profit", "loss", "balance sheet",
        "p&l", "income statement", "equity", "debt", "portfolio",
        "investment", "trading", "risk", "compliance", "regulatory",
        "gaap", "ifrs", "sox", "internal control", "treasury",
        "valuation", "m&a", "merger", "acquisition", "underwriting",
        "credit", "loan", "mortgage", "asset", "liability",
        "cfa", "cpa", "cma", "financial modeling", "due diligence",
        "quickbooks", "xero", "sage", "oracle financial", "sap",
    },
    "legal": {
        "legal", "law", "attorney", "lawyer", "litigation", "trial",
        "court", "judge", "plaintiff", "defendant", "deposition",
        "discovery", "brief", "motion", "appeal", "verdict",
        "contract", "agreement", "statute", "regulation", "compliance",
        "intellectual property", "patent", "trademark", "copyright",
        "corporate law", "criminal", "civil", "estate", "trust",
        "bar admission", "juris doctor", "legal research", "legal writing",
        "negotiation", "mediation", "arbitration", "settlement",
        "llm degree", "legal counsel", "paralegal", "case management",
    },
    "education": {
        "teacher", "teaching", "education", "curriculum", "classroom",
        "student", "lesson", "pedagogy", "instruction", "assessment",
        "grading", "syllabus", "lecture", "tutorial", "seminar",
        "professor", "instructor", "faculty", "academic", "school",
        "college", "university", "k-12", "elementary", "secondary",
        "special education", "esl", "ell", "differentiated",
        "learning objective", "educational technology", "edtech",
        "phd", "master degree", "thesis", "research", "publication",
        "accreditation", "standardized test", "student outcome",
    },
    "hr": {
        "human resources", "hr", "recruiting", "recruiter", "talent",
        "hiring", "onboarding", "offboarding", "employee relations",
        "compensation", "benefits", "payroll", "performance management",
        "succession planning", "org development", "training",
        "diversity", "inclusion", "eeo", "labor law", "compliance",
        "workday", "bamboo", "greenhouse", "lever", "hris",
        "people operations", "people ops", "culture", "engagement",
        "retention", "turnover", "workforce planning", "headcount",
        "linkedin recruiter", "screening", "interviewing", "offer",
    },
}


def _detect_industry(jd_text: str) -> str:
    """
    Detects industry from raw JD text using keyword signatures.
    Returns industry key (tech, healthcare, sales, etc.) or 'tech' as default.
    """
    if not jd_text:
        return "tech"

    lower = jd_text.lower()
    scores = {}

    for industry, keywords in INDUSTRY_SIGNATURES.items():
        score = sum(1 for kw in keywords if kw in lower)
        scores[industry] = score

    # Find industry with highest match count
    best = max(scores, key=scores.get)
    best_score = scores[best]

    # Also count "other" — if no strong industry signal, use weights from
    # the JD content: look at what kind of skills/responsibilities dominate
    total_matches = sum(scores.values())

    # If very weak signals across all industries, classify as "general"
    if best_score < 2 and total_matches < 5:
        # Generic professional role — use balanced weights
        return "general"

    return best


def _get_dimensions_for_industry(industry: str) -> dict:
    """Returns the appropriate dimension weights for a given industry."""
    profile = INDUSTRY_PROFILES.get(industry)
    if profile:
        return dict(profile)
    # Fallback: use tech weights
    return dict(INDUSTRY_PROFILES["tech"])


# Same as before but in a function that accepts jd_text
def get_scoring_dimensions(jd_text: str = "") -> dict:
    """Detects industry and returns the appropriate dimension weights."""
    industry = _detect_industry(jd_text)
    dims = _get_dimensions_for_industry(industry)
    logger.info(f"Detected industry: '{industry}' — using custom weight profile")
    return dims


# ── DIMENSION 1: KEYWORD MATCH ────────────────────────────────────────────────

def _score_keyword_match(
    parsed_jd: dict,
    parsed_resume: dict,
    resume_full_text: str,
) -> int:
    """
    Scores keyword density based on JD hard skills + responsibility phrases
    found verbatim in the resume text.
    """
    from .keyword_match import run_keyword_match

    kw_result = run_keyword_match(resume_full_text, parsed_jd, parsed_resume)
    score = kw_result.get("keyword_score", 0)

    logger.info(f"  Keyword match score: {score}")
    return min(score, 100)


# ── DIMENSION 2: SKILLS ALIGNMENT ────────────────────────────────────────────

def _score_skills_alignment(
    skills_gap_report: dict,
) -> int:
    """
    Scores how well the candidate's technical and soft skills match the JD.
    Uses the match_pct from skill_gap.py directly with calibration.
    """
    raw = skills_gap_report.get("match_pct", 0)

    # Soft skill bonus: if candidate has all soft skills, add 5 points
    soft_gaps = skills_gap_report.get("soft_skill_gaps", [])
    soft_bonus = 5 if len(soft_gaps) == 0 else 0

    score = min(raw + soft_bonus, 100)
    logger.info(f"  Skills alignment score: {score} (raw: {raw}, soft_bonus: {soft_bonus})")
    return score


# ── DIMENSION 3: EXPERIENCE FIT ──────────────────────────────────────────────

def _score_experience_fit(
    parsed_resume: dict,
    parsed_jd: dict,
) -> int:
    """
    Scores experience fit based on years of experience alignment,
    seniority match, and education relevance.
    """
    from .keyword_match import _extract_jd_keywords

    required_years  = int(parsed_jd.get("required_experience_years", 0) or 0)
    candidate_years = float(parsed_resume.get("estimated_years", 0) or 0)

    if required_years == 0:
        # No explicit requirement — assume 2 years default
        required_years = 2

    if candidate_years == 0:
        # No experience detected — assume entry level
        candidate_years = 0.5

    gap = required_years - candidate_years

    if gap <= 0:
        # Meets or exceeds
        score = min(100, int(95 + (abs(gap) * 2)))
    elif gap <= 1:
        score = 82
    elif gap <= 2:
        score = 65
    elif gap <= 3:
        score = 50
    elif gap <= 5:
        score = 35
    else:
        score = max(20, int((candidate_years / max(required_years, 1)) * 100))

    score = max(15, min(score, 100))
    logger.info(f"  Experience fit score: {score} (required: {required_years}, candidate: {candidate_years})")
    return score


# ── DIMENSION 4: CONTENT DEPTH ───────────────────────────────────────────────

def _score_content_depth(
    parsed_resume: dict,
    resume_full_text: str,
    parsed_jd: dict,
) -> int:
    """
    Scores the depth of resume content:
    - Summary quality (length, relevance)
    - Experience bullet quantity and detail
    - Achievement signals (numbers, metrics)
    """
    score = 50  # neutral baseline

    # Summary quality
    summary = parsed_resume.get("summary", "") or ""
    summary_len = len(summary.split())
    if summary_len >= 15:
        score += 15
    elif summary_len >= 8:
        score += 8
    elif summary_len >= 3:
        score += 3
    else:
        score -= 10

    # Experience bullets quantity and quality
    experience = parsed_resume.get("experience", [])
    if isinstance(experience, list) and len(experience) >= 3:
        score += 10
    elif isinstance(experience, list) and len(experience) >= 1:
        score += 5

    # Achievement signals: numbers, percentages, metrics
    numbers = len(re.findall(r'\d+', resume_full_text or ""))
    if numbers >= 20:
        score += 10
    elif numbers >= 10:
        score += 5

    # Percentage signals
    percentages = len(re.findall(r'\d+%', resume_full_text or ""))
    if percentages >= 3:
        score += 5
    elif percentages >= 1:
        score += 2

    # Project mentions
    projects = parsed_resume.get("projects", [])
    if isinstance(projects, list) and len(projects) >= 2:
        score += 5

    # Education listed
    education = parsed_resume.get("education", [])
    if isinstance(education, list) and len(education) >= 1:
        score += 5

    score = max(15, min(score, 100))
    logger.info(f"  Content depth score: {score}")
    return score


# ── DIMENSION 5: FORMAT QUALITY ──────────────────────────────────────────────

def _score_format_quality(
    parsed_resume: dict,
) -> int:
    """
    Scores resume format and professionalism:
    - Contact info presence
    - LinkedIn/GitHub links
    - Section coverage
    - Skills section
    """
    score = 50  # neutral baseline

    # Contact info
    if parsed_resume.get("email"):
        score += 8
    if parsed_resume.get("phone"):
        score += 5
    if parsed_resume.get("linkedin"):
        score += 7
    if parsed_resume.get("github"):
        score += 5

    # Section coverage
    experience = parsed_resume.get("experience", [])
    if isinstance(experience, list) and len(experience) > 0:
        score += 8

    education = parsed_resume.get("education", [])
    if isinstance(education, list) and len(education) > 0:
        score += 7

    skills = parsed_resume.get("skills", [])
    if isinstance(skills, list) and len(skills) >= 5:
        score += 5
    elif isinstance(skills, list) and len(skills) > 0:
        score += 2

    # Name present
    if parsed_resume.get("name"):
        score += 5

    score = max(20, min(score, 100))
    logger.info(f"  Format quality score: {score}")
    return score


# ── SENIORITY FIT (kept for embedded use) ─────────────────────────────────────

def calculate_seniority_fit(required_years: int, candidate_years: int) -> dict:
    """
    Computes experience alignment score and human-readable evaluation.
    """
    required_years  = max(0, int(required_years))
    candidate_years = max(0, int(candidate_years))
    gap = required_years - candidate_years

    if gap <= 0:
        score      = 100
        aligned    = True
        evaluation = (
            f"Candidate's {candidate_years} years of experience meets or exceeds "
            f"the {required_years} years required. Strong seniority alignment."
        )
    elif gap <= 1:
        score      = 82
        aligned    = True
        evaluation = (
            f"Candidate has {candidate_years} years vs the required {required_years}. "
            "Minor gap — within competitive hiring parameters for most recruiters."
        )
    elif gap <= 2:
        score      = 65
        aligned    = False
        evaluation = (
            f"Candidate has {candidate_years} years vs the required {required_years}. "
            "Moderate experience gap. Strong portfolio or projects can compensate."
        )
    else:
        score      = max(25, int((candidate_years / max(required_years, 1)) * 100))
        aligned    = False
        evaluation = (
            f"Significant experience gap: {candidate_years} years vs required {required_years}. "
            "Candidate should highlight project depth and measurable impact to offset this."
        )

    return {
        "aligned":       aligned,
        "score":         score,
        "required_years": required_years,
        "candidate_years": candidate_years,
        "evaluation":    evaluation,
    }


# ── CONTEXT SIMILARITY (kept, now used in content_depth if needed) ────────────

def _compute_context_score(parsed_resume: dict, parsed_jd: dict) -> int:
    """Computes semantic similarity between resume context and JD responsibilities."""
    resume_context = (
        (parsed_resume.get("summary", "") or "")
        + " "
        + " ".join((parsed_resume.get("skills", []) or [])[:15])
    ).strip()
    jd_context = " ".join(parsed_jd.get("responsibilities", []) or [])

    if not resume_context or not jd_context:
        return 50

    try:
        resume_vec = generate_single_embedding(resume_context)
        jd_vec     = generate_single_embedding(jd_context)
        similarity = cosine_similarity(resume_vec, jd_vec)
        context_score = min(int(similarity * 100) + 10, 96)
        logger.info(f"Context similarity: {similarity:.3f} → score: {context_score}")
        return context_score
    except Exception as e:
        logger.warning(f"Context score embedding failed — using neutral 50: {e}")
        return 50


# ── VERDICT GENERATOR ─────────────────────────────────────────────────────────

def _generate_verdict(match_pct: int) -> str:
    if match_pct >= 85:
        return "Strong Match — Highly Recommended for Recruiter Screening"
    elif match_pct >= 70:
        return "Good Match — Suitable for Application with Minor Gaps"
    elif match_pct >= 55:
        return "Moderate Match — Targeted Resume Improvements Recommended"
    else:
        return "Low Alignment — Significant Skill or Seniority Gaps Identified"


# ── COMPOSITE SCORE ───────────────────────────────────────────────────────────

def _build_section_scores(
    kw_score: int,
    skills_score: int,
    exp_score: int,
    content_score: int,
    format_score: int,
    dimensions: dict | None = None,  # industry-specific dimensions
) -> dict:
    """Builds the section_scores dict with weight info."""
    dims = dimensions or DIMENSIONS

    def _weight_label(w: float) -> str:
        if w >= 0.25:
            return "high"
        elif w >= 0.18:
            return "medium"
        return "low"

    return {
        "keyword_match": {
            "score": kw_score,
            "weight": _weight_label(dims["keyword_match"]["weight"]),
            "label": dims["keyword_match"]["label"],
            "description": dims["keyword_match"]["description"],
            "max": 100,
        },
        "skills_alignment": {
            "score": skills_score,
            "weight": _weight_label(dims["skills_alignment"]["weight"]),
            "label": dims["skills_alignment"]["label"],
            "description": dims["skills_alignment"]["description"],
            "max": 100,
        },
        "experience_fit": {
            "score": exp_score,
            "weight": _weight_label(dims["experience_fit"]["weight"]),
            "label": dims["experience_fit"]["label"],
            "description": dims["experience_fit"]["description"],
            "max": 100,
        },
        "content_depth": {
            "score": content_score,
            "weight": _weight_label(dims["content_depth"]["weight"]),
            "label": dims["content_depth"]["label"],
            "description": dims["content_depth"]["description"],
            "max": 100,
        },
        "format_quality": {
            "score": format_score,
            "weight": _weight_label(dims["format_quality"]["weight"]),
            "label": dims["format_quality"]["label"],
            "description": dims["format_quality"]["description"],
            "max": 100,
        },
    }


def _compute_weighted_composite(section_scores: dict, dimensions: dict | None = None) -> int:
    """Weighted sum of all 5 section scores. Uses industry-specific dimensions."""
    dims = dimensions or DIMENSIONS
    composite = 0
    for dim_key, dim_info in dims.items():
        score = section_scores[dim_key]["score"]
        composite += score * dim_info["weight"]
    return int(composite)


# ── MAIN SCORER ───────────────────────────────────────────────────────────────

def compute_comprehensive_match_score(
    skills_gap_report: dict,
    parsed_resume: dict,
    parsed_jd: dict,
    resume_full_text: str = "",
    jd_text: str = "",  # raw JD text for industry detection
) -> dict:
    """
    Computes 5 section-level scores and a weighted composite match_percentage.
    Uses industry-aware scoring dimensions based on JD content.

    Dimensions (weights vary by industry):
        1. Keyword Match       — Exact + fuzzy keyword density
        2. Skills Alignment    — Hard + soft skill coverage
        3. Experience Fit      — Seniority + years alignment
        4. Content Depth       — Bullet quality, metrics, achievements
        5. Format Quality      — Contact info, sections, structure

    Returns:
        {
            match_percentage: int  (weighted composite, clamped 8-97)
            verdict: str
            seniority_fit: dict
            dimension_breakdown: { skills_score, seniority_score, context_score }
            section_scores: { [5 dimensions with score, weight, label, max] }
            industry_detected: str  # industry that was detected
        }
    """
    # Detect industry and get dynamic dimensions
    industry = _detect_industry(jd_text or resume_full_text)
    dimensions = _get_dimensions_for_industry(industry)

    # 1. Keyword match score
    kw_score = _score_keyword_match(parsed_jd, parsed_resume, resume_full_text)

    # 2. Skills alignment score
    skills_score = _score_skills_alignment(skills_gap_report)

    # 3. Experience fit score
    exp_score = _score_experience_fit(parsed_resume, parsed_jd)

    # 4. Content depth score
    content_score = _score_content_depth(parsed_resume, resume_full_text, parsed_jd)

    # 5. Format quality score
    format_score = _score_format_quality(parsed_resume)

    # Build section scores with dynamic dimensions
    section_scores = _build_section_scores(
        kw_score, skills_score, exp_score, content_score, format_score,
        dimensions=dimensions,
    )

    # Weighted composite with dynamic dimensions
    match_percentage = _compute_weighted_composite(section_scores, dimensions=dimensions)
    match_percentage = max(8, min(match_percentage, 97))

    # Seniority detail (kept for backward compat + premium response)
    required_years  = int(parsed_jd.get("required_experience_years", 0) or 0)
    candidate_years = int(parsed_resume.get("estimated_years", 0) or 0)
    seniority_fit   = calculate_seniority_fit(required_years, candidate_years)

    verdict = _generate_verdict(match_percentage)

    logger.info(
        f"Match score: {match_percentage}% ({industry}) | "
        f"KW:{kw_score} Skills:{skills_score} Exp:{exp_score} "
        f"Content:{content_score} Format:{format_score}"
    )

    return {
        "match_percentage":   match_percentage,
        "verdict":            verdict,
        "seniority_fit":      seniority_fit,
        "section_scores":     section_scores,
        "industry_detected":  industry,
        "dimension_breakdown": {
            "skills_score":    skills_score,
            "seniority_score": seniority_fit["score"],
            "context_score":   content_score,
        },
    }


import re  # noqa: E402 (used in _score_content_depth)
