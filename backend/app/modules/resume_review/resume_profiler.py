# resume_profiler.py
# Detects target role from the resume's OWN words — works for ANY role on earth.
# Zero AI calls. Zero hardcoded role lists. Zero vector DB.
#
# Strategy: the candidate already TELLS us their target role —
# in the title line right under their name, or in their summary's first sentence.
# We extract THAT, verbatim. "QA Engineer Intern" stays "QA Engineer Intern".
# "AI/ML Engineer" stays "AI/ML Engineer". Works for roles that don't exist yet.

from __future__ import annotations
import re
import datetime

FRESHER_SIGNALS = {
    "intern", "internship", "trainee", "student", "fresher",
    "virtual intern", "job simulation", "forage", "entry level",
    "currently pursuing", "expected graduation", "pursuing",
    "b.tech", "btech", "bachelor", "final year", "third year",
    "second year", "hackathon", "academic project", "college project",
    "bootcamp", "undergraduate", "(pursuing)",
}

SENIOR_SIGNALS = {
    "led", "managed", "architected", "principal", "senior", "staff",
    "head of", "director", "vp ", "chief", "founded", "spearheaded",
    "team of", "mentored", "roadmap", "strategy", "ownership",
    "7+ years", "8+ years", "9+ years", "10+ years",
}

# Common job-title words — used to detect a "title line" near the top of resume
TITLE_KEYWORDS = {
    "engineer", "developer", "analyst", "scientist", "manager", "designer",
    "architect", "specialist", "consultant", "intern", "associate",
    "administrator", "lead", "director", "officer", "coordinator",
    "tester", "researcher", "strategist", "executive", "technician",
    "qa", "devops", "sde", "programmer", "writer", "marketer",
}

# Words that indicate a line is NOT a job title (contact info, headers, etc.)
NOT_TITLE_PATTERNS = re.compile(
    r"@|http|www\.|linkedin|github|\d{5,}|^\+?\d|"
    r"^(SUMMARY|PROFESSIONAL|OBJECTIVE|EXPERIENCE|EDUCATION|SKILLS|"
    r"PROJECTS|CERTIFICATIONS|CORE|TECHNICAL)",
    re.IGNORECASE,
)


def _estimate_years(text: str) -> float:
    year_ranges = re.findall(
        r"(20\d{2})\s*[-–—to]+\s*(20\d{2}|present|current)",
        text.lower(),
    )
    if not year_ranges:
        return 0.0
    current_year = datetime.datetime.now().year
    total_months = 0
    for start, end in year_ranges:
        s = int(start)
        e = current_year if end in ("present", "current") else int(end)
        total_months += max(0, (e - s) * 12)
    return round(total_months / 12, 1)


def detect_target_role(text: str, name: str) -> dict:
    """
    Find the role the candidate is presenting themselves as.

    Priority order:
    1. A short title line near the top (e.g. "QA ENGINEER INTERN", "AI/ML Engineer")
       — usually right after the name/contact block, often ALL CAPS or Title Case,
       contains a known title keyword, and is NOT a section header.
    2. First sentence of the professional summary
       (e.g. "Early-career Software Engineer with hands-on experience...")
    3. Fallback: "Professional" with low confidence

    Works for ANY role because it extracts the candidate's own words —
    no predefined role list needed.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # ── Strategy 1: title line in first 8 lines ─────────────────────────────
    for line in lines[:8]:
        if NOT_TITLE_PATTERNS.search(line):
            continue
        if name and name.lower() in line.lower():
            continue

        words = line.split()
        if not (1 <= len(words) <= 6):
            continue

        lower_line = line.lower()
        if any(kw in lower_line for kw in TITLE_KEYWORDS):
            # Found a title-like line
            role = line.strip()
            # Normalise ALL CAPS to Title Case
            if role.isupper():
                role = role.title()
            return {"role": role, "confidence": 90, "source": "title_line"}

    # ── Strategy 2: first sentence of summary ───────────────────────────────
    # Look for patterns like "<Adjective> <Role Title> with/who/focused..."
    summary_match = re.search(
        r"([A-Z][a-zA-Z\-]*(?:\s+[A-Z][a-zA-Z\-/]*){0,4}\s+"
        r"(?:Engineer|Developer|Analyst|Scientist|Manager|Designer|"
        r"Architect|Specialist|Consultant|Intern|Associate|Administrator))"
        r"\s+(?:with|who|focused|specializ|passionate|eager)",
        text,
    )
    if summary_match:
        role = summary_match.group(1).strip()
        return {"role": role, "confidence": 75, "source": "summary"}

    # ── Strategy 3: fallback ─────────────────────────────────────────────────
    return {"role": "Professional", "confidence": 30, "source": "fallback"}


def detect_seniority(text: str) -> dict:
    lower = text.lower()
    fresher_hits = sum(1 for s in FRESHER_SIGNALS if s in lower)
    senior_hits  = sum(1 for s in SENIOR_SIGNALS  if s in lower)
    years = _estimate_years(text)

    if years >= 5 and senior_hits >= 2:
        level = "senior"
    elif years >= 2 and senior_hits >= 1:
        level = "mid"
    elif years >= 2:
        level = "mid"
    elif fresher_hits >= 1 or years == 0:
        level = "fresher"
    else:
        level = "mid"

    return {"level": level, "estimated_years": years}


def build_profile(parsed: dict, full_text: str) -> dict:
    """
    Build candidate profile — role + seniority + completeness flags.
    NO skill matching, NO gap analysis, NO AI calls, NO vector DB.
    Pure structural analysis of the resume itself.
    """
    role_info = detect_target_role(full_text, parsed.get("name", ""))
    senior    = detect_seniority(full_text)

    return {
        # Role (extracted from resume's own words — works for any role)
        "detected_role":    role_info["role"],
        "role_confidence":  role_info["confidence"],
        "role_source":      role_info["source"],

        # Seniority
        "seniority":        senior["level"],
        "estimated_years":  senior["estimated_years"],

        # Contact completeness
        "has_email":        bool(parsed.get("email")),
        "has_phone":        bool(parsed.get("phone")),
        "has_linkedin":     bool(parsed.get("linkedin")),
        "has_github":       bool(parsed.get("github")),

        # Section presence
        "has_summary":        bool(str(parsed.get("summary", "")).strip()),
        "has_experience":     bool(parsed.get("experience")),
        "has_projects":       bool(parsed.get("projects")),
        "has_education":      bool(parsed.get("education")),
        "has_skills_section": bool(parsed.get("skills")),
        "has_certifications": bool(parsed.get("certifications")),

        # Portfolio / website (optional but valuable)
        "has_portfolio": bool(
            re.search(r"(?:portfolio|vercel\.com|netlify\.app|github\.io|dev\.to|medium\.com)", full_text, re.IGNORECASE)
        ) if parsed.get("github") else False,

        # Raw data for downstream use
        "skills":   parsed.get("skills", []),
        "name":     parsed.get("name", ""),
        "summary":  parsed.get("summary", ""),
    }