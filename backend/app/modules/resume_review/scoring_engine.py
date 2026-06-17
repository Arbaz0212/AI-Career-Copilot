# scoring_engine.py
# Resume Review (no JD) — scores STRUCTURE, FORMATTING, and WRITING QUALITY only.
# All scores 0-100. Final score is a weighted average across 4 dimensions.
# Hard cap: no resume can exceed 95/100.

from __future__ import annotations
import re
from collections import Counter

# ── CONSTANTS ─────────────────────────────────────────────────────────────────

ACTION_VERBS_STRONG = {
    "architected", "engineered", "spearheaded", "launched", "founded",
    "transformed", "scaled", "drove", "overhauled", "pioneered",
    "established", "directed", "led", "generated", "delivered",
    "redesigned", "negotiated", "secured", "designed",
}

ACTION_VERBS_GOOD = {
    "built", "developed", "created", "automated", "optimized", "improved",
    "deployed", "integrated", "analyzed", "resolved", "migrated", "reduced",
    "increased", "managed", "researched", "implemented",
    "applied", "performed", "documented", "tested", "maintained",
    "refactored", "validated", "executed", "identified", "logged",
    "verified", "ensured", "followed", "supported", "wrote",
}

# Verbs that appear action-y but are actually passive filler
ACTION_VERBS_WEAK = {
    "contributed", "collaborated", "participated", "assisted",
    "helped", "involved",
}

WEAK_PHRASES = {
    "responsible for", "worked on", "helped with", "assisted in",
    "participated in", "involved in", "tasks included", "duties included",
    "was part of", "helped to", "contributed to", "collaborated with",
    "responsible to",
}
FILLER_WORDS = {
    "various", "multiple", "several", "many", "different",
    "effective", "efficient", "good", "great", "excellent",
}

QUANTITY_PATTERN = re.compile(
    r"\d+%|\d+x|\d+\+|\$[\d,]+|"
    r"\d+\s*(users|requests|ms|seconds|hours|days|engineers|"
    r"teams|services|apis|models|records|profiles|clients|"
    r"tickets|bugs|features|customers|transactions|queries|"
    r"datasets|endpoints|pipelines|reports|test cases|defects|"
    r"scripts|cases)",
    re.IGNORECASE,
)

IDEAL_MIN_WORDS = 400
IDEAL_MAX_WORDS = 800
FRESHER_MIN_WORDS = 300

STOPWORDS = {
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of",
    "with", "is", "are", "was", "were", "been", "be", "has", "have", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "can", "shall", "this", "that", "these", "those", "it", "its", "as",
    "by", "from", "into", "through", "during", "before", "after", "above",
    "below", "between", "out", "off", "over", "under", "again", "further",
    "then", "once", "here", "there", "when", "where", "why", "how", "all",
    "each", "every", "both", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "just", "about", "up", "if", "while", "because", "which", "who", "whom",
    "what", "but", "not", "per", "&", "and/or",
}


def _clean_bullet_text(text: str) -> str:
    text_clean = text.strip()
    for separator in [" - ", " — ", " – ", " | ", ": "]:
        if separator in text_clean:
            parts = text_clean.split(separator, 1)
            if len(parts[1].strip().split()) >= 3:
                return parts[1].strip()
    return text_clean


def _extract_bullets(lines: list[str]) -> list[str]:
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith(("•", "–", "-", "▪", "◦", "*", "·")):
            out.append(s.lstrip("•–-▪◦*· "))
        elif re.match(r"^\(cid:\d+\)", s):
            out.append(re.sub(r"^\(cid:\d+\)\s*", "", s))
        elif len(s) > 45 and not s.endswith((")", ":")):
            out.append(s)
    return [b for b in out if len(b.split()) >= 4]


# ── DIMENSION 1 — COMPLETENESS (25 pts) ─────────────────────────────────────

def score_completeness(profile: dict, seniority: str) -> dict:
    pts = 0
    max_pts = 25
    breakdown = {}
    issues = []
    wins = []

    contact_pts = 0
    if profile.get("has_email"):    contact_pts += 2
    if profile.get("has_phone"):    contact_pts += 2
    if profile.get("has_linkedin"): contact_pts += 2
    if profile.get("has_github"):   contact_pts += 2
    pts += contact_pts
    breakdown["contact_info"] = contact_pts

    if not profile.get("has_linkedin"):
        issues.append("Missing LinkedIn URL — add it to your contact header")
    if not profile.get("has_github") and seniority in ("fresher", "mid"):
        issues.append("Missing GitHub URL — strengthens technical credibility")
    if contact_pts >= 7:
        wins.append("Complete contact information with professional links")

    summary = profile.get("summary", "")
    summary_len = len(summary.split())
    if summary_len >= 50:
        pts += 5; breakdown["summary"] = 5
        wins.append("Strong professional summary present")
    elif summary_len >= 20:
        pts += 3; breakdown["summary"] = 3
        issues.append("Summary is a bit short — expand to 4-5 lines")
    elif summary_len >= 8:
        pts += 1; breakdown["summary"] = 1
        issues.append("Summary is too short — write 3-5 substantive lines")
    else:
        breakdown["summary"] = 0
        issues.append("No professional summary — add 3-5 lines")

    section_pts = 0
    if profile.get("has_skills_section"): section_pts += 3
    else: issues.append("No Skills section found")

    if profile.get("has_experience"): section_pts += 2
    elif profile.get("has_projects"): section_pts += 1
    else: issues.append("Neither Experience nor Projects section found")

    if profile.get("has_education"): section_pts += 2
    else: issues.append("No Education section")

    if profile.get("has_projects"):       section_pts += 2
    if profile.get("has_certifications"): section_pts += 1

    pts += section_pts
    breakdown["sections"] = section_pts

    score = round((pts / max_pts) * 100)
    return {"score": min(score, 100), "raw": pts, "max": max_pts, "breakdown": breakdown, "issues": issues, "wins": wins}


# ── DIMENSION 2 — WRITING QUALITY (35 pts) ──────────────────────────────────

def score_writing_quality(experience: list[str], projects: list[str], seniority: str) -> dict:
    all_lines = experience + projects
    bullets = _extract_bullets(all_lines)
    total = max(len(bullets), 1)

    strong_verb_count = 0
    good_verb_count = 0
    weak_verb_count = 0
    quantified_count = 0
    weak_count = 0
    filler_count = 0

    for b in bullets:
        action_phrase = _clean_bullet_text(b)
        lower = action_phrase.lower()
        words = lower.split()
        if not words: continue
        # Check action verb in first 3 words
        verb_found = False
        for word in words[:3]:
            clean_word = re.sub(r"[^\w\s]", "", word)
            if clean_word in ACTION_VERBS_STRONG: strong_verb_count += 1; verb_found = True; break
            elif clean_word in ACTION_VERBS_GOOD: good_verb_count += 1; verb_found = True; break
            elif clean_word in ACTION_VERBS_WEAK: weak_verb_count += 1; verb_found = True; break
        # Even if no verb found in first 3 words, check full bullet for quant/metrics
        if QUANTITY_PATTERN.search(lower): quantified_count += 1
        if any(p in lower for p in WEAK_PHRASES): weak_count += 1
        if any(f in lower for f in FILLER_WORDS): filler_count += 1

    quant_rate = round((quantified_count / total) * 100)
    verb_rate  = round(((strong_verb_count + good_verb_count + weak_verb_count) / total) * 100)

    # Verb score: only strong and good count for points. Weak verbs give 0.
    verb_score = min(round((strong_verb_count * 2.5 + good_verb_count * 1.5) / total * 14), 14)

    if seniority == "fresher":
        quant_score = 8 if quant_rate >= 35 else 5 if quant_rate >= 20 else 3 if quant_rate >= 10 else 1 if quant_rate > 0 else 0
    else:
        quant_score = 12 if quant_rate >= 50 else 9 if quant_rate >= 30 else 5 if quant_rate >= 15 else 2 if quant_rate > 0 else 0

    avg_words = sum(len(b.split()) for b in bullets) / total
    structure_score = 8 if total >= 8 and avg_words >= 14 else 5 if total >= 5 and avg_words >= 10 else 3 if total >= 3 and avg_words >= 8 else 1 if total >= 2 else 0

    weak_penalty = min(weak_count * 3, 8)
    filler_penalty = min(filler_count, 4)
    # Penalty for having ZERO strong verbs in a resume that's meant for professional roles
    no_strong_penalty = 2 if strong_verb_count == 0 and seniority != "fresher" else 0

    raw = verb_score + quant_score + structure_score - weak_penalty - filler_penalty - no_strong_penalty
    score = max(0, min(round((raw / 35) * 100), 100))

    issues = []
    wins = []

    if strong_verb_count == 0 and good_verb_count < 3:
        issues.append("Bullets lack strong action verbs - start each with: Built, Developed, Architected")
    elif strong_verb_count >= 2 or good_verb_count >= 4:
        wins.append(f"{strong_verb_count + good_verb_count} bullets use strong action verbs")

    if quant_rate == 0:
        issues.append("No numbers or metrics anywhere — add % , counts, time saved")
    elif quant_rate >= 20:
        wins.append(f"{quant_rate}% of bullets include numbers/metrics")

    if weak_count > 0:
        issues.append(f"{weak_count} bullet(s) use passive language — replace with action verbs")
    if weak_verb_count > 0:
        issues.append("Bullets start with weak verbs (contributed, collaborated) — use direct action verbs instead")
    if total < 5:
        issues.append("Too few bullets — write at least 5 across experience and projects")

    return {"score": score, "metrics": {"total_bullets": total, "strong_verb_count": strong_verb_count, "good_verb_count": good_verb_count, "weak_verb_count": weak_verb_count, "quantified_count": quantified_count, "quantification_rate_pct": quant_rate, "weak_language_count": weak_count, "verb_rate_pct": verb_rate}, "breakdown": {"action_verbs": verb_score, "quantification": quant_score, "bullet_structure": structure_score, "weak_language_penalty": -weak_penalty, "filler_penalty": -filler_penalty, "no_strong_verb_penalty": -no_strong_penalty}, "issues": issues, "wins": wins}


# ── DIMENSION 3 — ATS FORMAT (25 pts) ───────────────────────────────────────

ATS_BREAKING_PATTERNS = [
    (r"(\|.*\|.*\|\n){2,}", "Table-like structure detected - ATS may not parse this"),
    (r"█+|▓+|░+", "Graphic elements found - remove them"),
    (r"@{3,}|#{5,}", "Non-standard repeated characters detected"),
]
EXPECTED_SECTIONS = ["experience", "education", "skills"]


def score_ats_format(full_text: str, parsed: dict, profile: dict) -> dict:
    pts = 0
    max_pts = 25
    issues = []
    wins = []

    word_count = len(full_text.split())
    seniority = profile.get("seniority", "fresher")
    min_words = FRESHER_MIN_WORDS if seniority == "fresher" else IDEAL_MIN_WORDS

    if min_words <= word_count <= IDEAL_MAX_WORDS:
        pts += 5
        wins.append(f"Good resume length ({word_count} words)")
    elif word_count < min_words:
        pts += 2
        issues.append(f"Resume is short ({word_count} words) — aim for {min_words}–{IDEAL_MAX_WORDS} words")
    else:
        pts += 3
        issues.append(f"Resume is long ({word_count} words) — trim to under {IDEAL_MAX_WORDS} words")

    format_pts = 9
    cid_count = len(re.findall(r"\(cid:\d+\)", full_text))
    if cid_count > 5:
        format_pts -= 5
        issues.append(f"{cid_count} PDF encoding artifacts found — re-export as clean PDF")
    elif cid_count > 2:
        format_pts -= 3
        issues.append(f"{cid_count} PDF encoding artifacts found")
    elif cid_count > 0:
        format_pts -= 1

    for pattern, msg in ATS_BREAKING_PATTERNS:
        if re.search(pattern, full_text):
            format_pts -= 3
            issues.append(msg)

    pts += max(format_pts, 0)
    if format_pts == 9:
        wins.append("Clean formatting - no ATS-breaking elements detected")

    section_pts = 0
    sections_found = []
    if parsed.get("experience"): sections_found.append("experience"); section_pts += 2
    if parsed.get("education"):  sections_found.append("education");  section_pts += 2
    if parsed.get("skills"):     sections_found.append("skills");     section_pts += 2
    if parsed.get("summary"):    section_pts += 1
    pts += section_pts

    missing_sections = [s for s in EXPECTED_SECTIONS if s not in sections_found]
    if missing_sections:
        issues.append(f"Missing section(s): {', '.join(missing_sections)}")

    if parsed.get("email"): pts += 1
    if parsed.get("phone"): pts += 1

    # Penalty: thin/no experience section for non-fresher
    exp = parsed.get("experience", [])
    exp_full_lines = [l.strip() for l in exp if l.strip() and len(l.strip().split()) >= 3]
    if len(exp_full_lines) < 2 and seniority != "fresher":
        pts -= 2
        issues.append("Experience section is very thin for your seniority level")

    score = round((pts / max_pts) * 100)
    return {"score": min(score, 100), "word_count": word_count, "cid_artifacts": cid_count, "sections_found": sections_found, "issues": issues, "wins": wins}


# ── DIMENSION 4 — CONTENT DEPTH (15 pts) ─────────────────────────────────────

def score_content_depth(experience: list[str], projects: list[str], seniority: str) -> dict:
    pts = 0
    max_pts = 15
    issues = []
    wins = []

    exp_bullets = _extract_bullets(experience)
    exp_target = 3 if seniority == "fresher" else 6

    if len(exp_bullets) >= exp_target * 2:
        pts += 7
        wins.append("Strong experience descriptions with multiple detail bullets")
    elif len(exp_bullets) >= exp_target:
        pts += 5
    elif len(exp_bullets) >= 2:
        pts += 2; issues.append("Experience bullets are thin — add more detail")
    elif len(exp_bullets) >= 1:
        pts += 1; issues.append("Only 1 experience bullet — add more depth")
    else:
        issues.append("No substantive experience descriptions found")

    project_entries = [p.strip() for p in projects if len(p.strip().split()) >= 5 and not p.strip().startswith(("(cid:", "•", "-"))]
    # Cap project entries so college projects don't inflate score
    capped_projects = project_entries[:4]

    if len(capped_projects) >= 5: pts += 6; wins.append("Strong project portfolio with detailed descriptions")
    elif len(capped_projects) >= 3: pts += 4; wins.append(f"{len(capped_projects)} project entries with good descriptions")
    elif len(capped_projects) >= 1: pts += 2
    elif seniority == "fresher": issues.append("No projects section")

    all_desc = exp_bullets + capped_projects
    if all_desc:
        avg_len = sum(len(b.split()) for b in all_desc) / len(all_desc)
        if avg_len >= 15: wins.append("Descriptions are detailed and substantive")
        elif avg_len < 10: issues.append("Descriptions are too short — aim for 12-20 words")

    score = round((pts / max_pts) * 100)
    return {"score": min(score, 100), "exp_bullet_count": len(exp_bullets), "project_entry_count": len(project_entries), "issues": issues, "wins": wins}


# ── SECTION BREAKDOWN ─────────────────────────────────────────────────────────

def _section_breakdown(parsed: dict, profile: dict) -> dict:
    skills_count = len(parsed.get("skills", []))
    summary = profile.get("summary", "")

    exp_bullets = _extract_bullets(parsed.get("experience", []))
    exp_quantified = sum(1 for b in exp_bullets if QUANTITY_PATTERN.search(b.lower()))

    proj_entries = [p.strip() for p in parsed.get("projects", []) if len(p.strip().split()) >= 5 and not p.strip().startswith(("(cid:", "•", "-"))]

    return {
        "summary": {"score": min(len(summary.split()) * 2, 20), "max": 20, "feedback": "Well-written summary" if len(summary.split()) >= 15 else "Consider expanding your summary"},
        "experience": {"score": min(len(exp_bullets) * 5 + exp_quantified * 3, 30), "max": 30, "feedback": f"{len(exp_bullets)} bullet{'s' if len(exp_bullets) != 1 else ''}" + (f", {exp_quantified} quantified" if exp_quantified >= 2 else "") if exp_bullets else "No experience bullets found"},
        "education": {"score": 10 if parsed.get("education") else 0, "max": 10, "feedback": "Education listed" if parsed.get("education") else "Education missing"},
        "skills": {"score": min(skills_count * 2, 20), "max": 20, "feedback": f"{skills_count} skills detected" if skills_count >= 12 else "Add more relevant skills"},
        "projects": {"score": min(len(proj_entries) * 4, 20), "max": 20, "feedback": f"{len(proj_entries)} project{'s' if len(proj_entries) != 1 else ''}" if proj_entries else "Add projects"},
    }


# ── KEYWORD DENSITY ───────────────────────────────────────────────────────────

def _keyword_density(full_text: str) -> dict:
    words = re.findall(r"[A-Za-z][A-Za-z\-]+", full_text.lower())
    words = [w for w in words if len(w) > 2 and w not in STOPWORDS]
    counter = Counter(words)
    return {
        "most_used": [{"word": w, "count": c} for w, c in counter.most_common(10)],
        "overused_words": [{"word": w, "count": c} for w, c in counter.most_common(15) if c >= 5][:5],
        "total_unique_keywords": len(counter),
    }


# ── PEER COMPARISON ────────────────────────────────────────────────────────────

def _peer_comparison(final_score: int, seniority: str) -> dict:
    avg_by_seniority = {"fresher": 58, "mid": 65, "senior": 72}
    average = avg_by_seniority.get(seniority, 62)
    diff = final_score - average
    return {
        "percentile": "Top 15%" if final_score >= 80 else "Top 30%" if final_score >= 70 else "Top 50%" if final_score >= 60 else "Bottom 50%",
        "peer_group": f"{seniority.title()} candidates",
        "average_score": average,
        "your_score": final_score,
        "above_average_by": max(diff, 0),
        "summary": f"You scored {diff} points above average" if diff > 0 else f"You scored {abs(diff)} points below average",
    }


# ── FALLBACK ISSUES (never return empty) ────────────────────────────────────

_FALLBACK_ISSUES = [
    "Add a key achievement line in each role - recruiters scan for impact first",
    "Reorder sections: Summary > Skills > Experience > Education > Projects",
    "Add 1-2 more varied action verbs to keep bullet openings interesting",
    "Use consistent formatting - same bullet style and date format throughout",
    "Add skills proficiency indicators (Python - Expert, AWS - Intermediate)",
    "Use reverse-chronological order for experience and education",
    "Rename file professionally (FirstName_LastName_Resume.pdf)",
    "Remove qualifiers like '(Basic)' from skills - only list confident skills",
]

def _generate_fallback_issues(profile: dict) -> list[str]:
    issues = []
    if not profile.get("has_github"):
        issues.append("Adding a GitHub profile link strengthens technical credibility")
    issues.extend(_FALLBACK_ISSUES[:3])
    import random
    while len(issues) < 3:
        i = random.choice(_FALLBACK_ISSUES)
        if i not in issues: issues.append(i)
    return issues[:4]


# ── FINAL AGGREGATOR ──────────────────────────────────────────────────────────

WEIGHTS = {"completeness": 0.25, "writing_quality": 0.35, "ats_format": 0.25, "content_depth": 0.15}
GRADE_TABLE = [(95, "A+", "Exceptional"), (84, "A", "Strong"), (72, "B+", "Good"), (60, "B", "Average"), (48, "C", "Below Average"), (35, "D", "Weak"), (0, "F", "Needs Overhaul")]


def _grade(score: int) -> tuple:
    for threshold, grade, verdict in GRADE_TABLE:
        if score >= threshold: return grade, verdict
    return "F", "Needs Overhaul"

def _percentile(score: int) -> str:
    if score >= 90: return "Top 5%"
    if score >= 80: return "Top 15%"
    if score >= 70: return "Top 30%"
    if score >= 60: return "Top 50%"
    return "Bottom 50%"


def _score_boosts(dim_scores: dict, profile: dict) -> list[dict]:
    boosts = []
    seniority = profile.get("seniority", "fresher")
    wq = dim_scores["writing_quality"]

    if wq["metrics"]["quantification_rate_pct"] < 25:
        gain = 4 if seniority == "fresher" else 6
        boosts.append({"action": "Add numbers to at least 3 bullets", "score_boost": f"+{gain} points", "effort": "30 minutes", "priority": 1})
    if not profile.get("has_linkedin"):
        boosts.append({"action": "Add your LinkedIn URL", "score_boost": "+2 points", "effort": "2 minutes", "priority": 1})
    if not profile.get("has_github") and seniority in ("fresher", "mid"):
        boosts.append({"action": "Add your GitHub profile URL", "score_boost": "+2 points", "effort": "2 minutes", "priority": 1})
    summary_len = len(profile.get("summary", "").split())
    if summary_len < 20:
        boosts.append({"action": "Expand your professional summary to 3-5 lines", "score_boost": "+3 points", "effort": "15 minutes", "priority": 1})
    if wq["metrics"]["weak_language_count"] > 0 or wq["metrics"]["weak_verb_count"] > 0:
        boosts.append({"action": "Replace passive language with direct action verbs", "score_boost": "+3 points", "effort": "15 minutes", "priority": 2})
    if not profile.get("has_portfolio") and profile.get("has_github"):
        boosts.append({"action": "Deploy your projects and add the live link to your resume", "score_boost": "+3 points", "effort": "2 hours", "priority": 2})
    if wq["metrics"]["strong_verb_count"] == 0 and wq["metrics"]["good_verb_count"] < 4:
        boosts.append({"action": "Start each bullet with a powerful action verb (Architected, Built, Designed)", "score_boost": "+4 points", "effort": "20 minutes", "priority": 1})

    boosts.sort(key=lambda x: x["priority"])
    return boosts[:5]


def calculate_score(profile: dict, parsed: dict, full_text: str) -> dict:
    seniority = profile.get("seniority", "fresher")

    d1 = score_completeness(profile, seniority)
    d2 = score_writing_quality(parsed.get("experience", []), parsed.get("projects", []), seniority)
    d3 = score_ats_format(full_text, parsed, profile)
    d4 = score_content_depth(parsed.get("experience", []), parsed.get("projects", []), seniority)

    final = round(d1["score"] * WEIGHTS["completeness"] + d2["score"] * WEIGHTS["writing_quality"] + d3["score"] * WEIGHTS["ats_format"] + d4["score"] * WEIGHTS["content_depth"])
    final = max(0, min(final, 95))  # Hard cap: no resume exceeds 95
    grade, verdict = _grade(final)

    dim_scores = {"completeness": d1, "writing_quality": d2, "ats_format": d3, "content_depth": d4}
    all_issues = d1["issues"] + d2["issues"] + d3["issues"] + d4["issues"]
    all_wins = d1["wins"] + d2["wins"] + d3["wins"] + d4["wins"]

    if not all_issues:
        all_issues = _generate_fallback_issues(profile)

    boosts = _score_boosts(dim_scores, profile)

    return {
        "final_score": final,
        "grade": grade,
        "verdict": verdict,
        "description": {"A+": "Exceptional - stands out to recruiters", "A": "Strong - competitive resume", "B+": "Good - minor improvements needed", "B": "Average - needs targeted upgrades", "C": "Below Average - significant work needed", "D": "Weak - major gaps", "F": "Needs Overhaul"}.get(grade, ""),
        "percentile": _percentile(final),
        "seniority_mode": seniority,
        "dimension_scores": {
            "completeness": {"score": d1["score"], "weight": "25%"},
            "writing_quality": {"score": d2["score"], "weight": "35%"},
            "ats_format": {"score": d3["score"], "weight": "25%"},
            "content_depth": {"score": d4["score"], "weight": "15%"},
        },
        "section_breakdown": _section_breakdown(parsed, profile),
        "keyword_density": _keyword_density(full_text),
        "peer_comparison": _peer_comparison(final, seniority),
        "issues": all_issues,
        "wins": all_wins,
        "score_boosts": boosts,
        "_dim_detail": dim_scores,
    }
