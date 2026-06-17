# app/modules/jd_match/keyword_match.py
# Exact and fuzzy keyword matching of raw resume text against JD requirements.
# Complements semantic_match.py — finds verbatim JD keywords present/absent in resume.
# No API calls — purely programmatic. Fast and deterministic.

from __future__ import annotations
import re
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


# ── KEYWORD EXTRACTION ────────────────────────────────────────────────────────

# Common filler words to exclude from keyword analysis
_STOPWORDS = {
    "and", "or", "the", "a", "an", "in", "on", "at", "to", "for",
    "of", "with", "is", "are", "be", "been", "has", "have", "will",
    "can", "should", "must", "we", "you", "our", "your", "their",
    "this", "that", "these", "those", "as", "by", "from", "into",
    "through", "during", "including", "within", "such", "more",
    "also", "both", "each", "than", "other", "some", "any", "all",
}


def _normalize(text: str) -> str:
    """Lowercases and strips punctuation for fair comparison."""
    return re.sub(r"[^\w\s\+\#\.]", " ", text.lower()).strip()


def _extract_ngrams(text: str, max_n: int = 3) -> set[str]:
    """
    Extracts unigrams, bigrams, and trigrams from text.
    Used to catch multi-word keywords like 'machine learning', 'ci/cd pipeline'.
    """
    tokens = [t for t in _normalize(text).split() if t not in _STOPWORDS and len(t) > 1]
    ngrams = set()
    for n in range(1, min(max_n + 1, len(tokens) + 1)):
        for i in range(len(tokens) - n + 1):
            ngram = " ".join(tokens[i:i + n])
            if len(ngram) > 2:
                ngrams.add(ngram)
    return ngrams


def _extract_jd_keywords(parsed_jd: dict) -> list[str]:
    """
    Pulls all meaningful keyword phrases from the parsed JD.
    Combines hard skills, soft skills, job title, and responsibility phrases.
    """
    keywords = []

    # Hard skills (highest priority)
    keywords.extend(parsed_jd.get("hard_skills", []))

    # Soft skills
    keywords.extend(parsed_jd.get("soft_skills", []))

    # Extract key noun phrases from responsibilities
    for resp in parsed_jd.get("responsibilities", [])[:8]:
        # Extract multi-word technical phrases (2-3 words)
        words = _normalize(resp).split()
        for i in range(len(words) - 1):
            if words[i] not in _STOPWORDS and words[i + 1] not in _STOPWORDS:
                bigram = f"{words[i]} {words[i+1]}"
                if len(bigram) > 5:
                    keywords.append(bigram)

    # Deduplicate and normalize
    seen = set()
    unique = []
    for kw in keywords:
        norm = _normalize(kw)
        if norm and norm not in seen and norm not in _STOPWORDS:
            seen.add(norm)
            unique.append(norm)

    return unique


# ── MAIN KEYWORD MATCHER ──────────────────────────────────────────────────────

def run_keyword_match(
    resume_full_text: str,
    parsed_jd: dict,
    parsed_resume: dict,
) -> dict:
    """
    Scans raw resume text for exact JD keyword occurrences.

    Two-pass approach:
        Pass 1 — Exact match: keyword appears verbatim in resume text
        Pass 2 — Token overlap: keyword tokens are all present in resume
                  (catches reordered phrases like "Python Flask" vs "Flask Python")

    Args:
        resume_full_text: Raw resume text (from PDF parser)
        parsed_jd:        Structured JD dict from jd_parser.py
        parsed_resume:    Parsed resume dict (for skills list supplement)

    Returns:
        {
            found_keywords:   list[str],   keywords present in resume
            missing_keywords: list[str],   keywords absent from resume
            keyword_density:  float,       found / total ratio
            keyword_score:    int,         0-100 score
            high_priority_missing: list[str],  missing hard skills only
            frequency_map:    dict[str, int]   how many times each found keyword appears
        }
    """
    if not resume_full_text or not resume_full_text.strip():
        logger.warning("Empty resume text passed to keyword_match.")
        return _empty_result()

    resume_normalized = _normalize(resume_full_text)
    resume_ngrams     = _extract_ngrams(resume_full_text, max_n=3)

    jd_keywords = _extract_jd_keywords(parsed_jd)
    if not jd_keywords:
        logger.warning("No keywords extracted from JD.")
        return _empty_result()

    found_keywords   = []
    missing_keywords = []
    frequency_map    = {}

    for keyword in jd_keywords:
        kw_norm = _normalize(keyword)

        # Pass 1: Exact substring match in normalized resume
        if kw_norm in resume_normalized:
            count = resume_normalized.count(kw_norm)
            found_keywords.append(keyword)
            frequency_map[keyword] = count
            continue

        # Pass 2: N-gram set membership
        if kw_norm in resume_ngrams:
            found_keywords.append(keyword)
            frequency_map[keyword] = 1
            continue

        # Pass 3: All individual tokens present (handles reordering)
        kw_tokens = [
            t for t in kw_norm.split()
            if t not in _STOPWORDS and len(t) > 2
        ]
        if kw_tokens and all(t in resume_normalized for t in kw_tokens):
            found_keywords.append(keyword)
            frequency_map[keyword] = 1
            continue

        missing_keywords.append(keyword)

    # High priority missing = only the hard skills that are missing
    hard_skills_norm = {_normalize(s) for s in parsed_jd.get("hard_skills", [])}
    high_priority_missing = [
        kw for kw in missing_keywords
        if _normalize(kw) in hard_skills_norm
    ]

    total = len(jd_keywords)
    found = len(found_keywords)
    density = round(found / total, 3) if total > 0 else 0.0

    # Score: keyword density mapped to 0-100 with booster for high match
    raw_score = int(density * 100)
    # Boost: if we have very few high-priority missing skills, add +15
    hp_missing = len(high_priority_missing)
    boost = 15 if hp_missing == 0 else 8 if hp_missing <= 2 else 0
    keyword_score = min(raw_score + boost, 100)

    logger.info(
        f"Keyword match: {found}/{total} found | "
        f"density: {density:.2%} | score: {keyword_score} | "
        f"{len(high_priority_missing)} high-priority missing"
    )

    return {
        "found_keywords":       found_keywords,
        "missing_keywords":     missing_keywords,
        "keyword_density":      density,
        "keyword_score":        keyword_score,
        "high_priority_missing": high_priority_missing,
        "frequency_map":        frequency_map,
        "total_jd_keywords":    total,
    }


def _empty_result() -> dict:
    return {
        "found_keywords":        [],
        "missing_keywords":      [],
        "keyword_density":       0.0,
        "keyword_score":         0,
        "high_priority_missing": [],
        "frequency_map":         {},
        "total_jd_keywords":     0,
    }


# ── KEYWORD DENSITY REPORT ────────────────────────────────────────────────────

def get_top_missing_keywords(keyword_result: dict, limit: int = 8) -> list[str]:
    """
    Returns the most impactful missing keywords to show the user.
    Prioritizes high-priority (hard skill) gaps first.
    """
    high_priority = keyword_result.get("high_priority_missing", [])
    all_missing   = keyword_result.get("missing_keywords", [])

    # High priority first, then remaining missing, deduped
    seen = set()
    result = []
    for kw in high_priority + all_missing:
        if kw not in seen:
            seen.add(kw)
            result.append(kw)
        if len(result) >= limit:
            break

    return result