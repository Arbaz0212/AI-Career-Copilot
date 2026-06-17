# app/modules/jd_match/semantic_match.py
# Semantic skill alignment using ChromaDB vector search.
# Falls back to pure cosine similarity math if ChromaDB is unavailable.

from __future__ import annotations
import math
import uuid
import time
import logging
import concurrent.futures
from app.database import vectordb as vectordb_module
from app.database.vectordb import (
    get_jd_match_collection,
    generate_single_embedding,
    generate_embeddings_batch,
    EMBEDDING_DIM,
)

logger = logging.getLogger(__name__)

# Similarity threshold — skills below this are treated as missing
SEMANTIC_THRESHOLD = 0.68

# ChromaDB timeout (seconds) — if the call takes longer, fall back to local cosine
_CHROMADB_TIMEOUT = 1.5


# ── PURE MATH COSINE ─────────────────────────────────────────────────────────

def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Computes exact cosine similarity between two equal-length vectors.
    Returns 0.0 on zero vectors or dimension mismatch.
    """
    if len(vec_a) != len(vec_b) or len(vec_a) == 0:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── CHROMADB SEMANTIC SEARCH ──────────────────────────────────────────────────

def _chromadb_semantic_match(
    remaining_reqs: list[str],
    remaining_candidates: list[str],
) -> tuple[list[dict], list[str]]:
    """
    Uses ChromaDB cosine-indexed collection to find best skill matches.
    Returns (semantic_matches, missing_skills).
    """
    semantic_matches = []
    missing_skills = []

    # Generate embeddings for candidate skills
    cand_embeddings = generate_embeddings_batch(remaining_candidates)

    # Build unique IDs to avoid ChromaDB collision
    run_id = str(uuid.uuid4())[:8]
    ids = [f"{run_id}_cand_{i}" for i in range(len(remaining_candidates))]
    metadatas = [{"skill_name": c} for c in remaining_candidates]

    collection = get_jd_match_collection()

    # Add candidate skill vectors to collection
    collection.add(
        embeddings=cand_embeddings,
        documents=remaining_candidates,
        metadatas=metadatas,
        ids=ids,
    )

    try:
        # Query each required skill against candidate vectors
        req_embeddings = generate_embeddings_batch(remaining_reqs)

        for req, req_vec in zip(remaining_reqs, req_embeddings):
            results = collection.query(
                query_embeddings=[req_vec],
                n_results=1,
                include=["documents", "distances", "metadatas"],
            )

            if (
                results.get("distances")
                and results["distances"][0]
                and results["documents"][0]
            ):
                # ChromaDB cosine distance = 1 - similarity
                distance = results["distances"][0][0]
                similarity = max(0.0, 1.0 - distance)
                best_match = results["documents"][0][0]

                if similarity >= SEMANTIC_THRESHOLD:
                    semantic_matches.append({
                        "required": req,
                        "matched_with": best_match,
                        "similarity_score": round(similarity * 100),
                    })
                else:
                    missing_skills.append(req)
            else:
                missing_skills.append(req)

    finally:
        # Clean up candidate vectors after each run — prevents stale data
        try:
            collection.delete(ids=ids)
        except Exception as cleanup_err:
            logger.warning(f"ChromaDB cleanup warning: {cleanup_err}")

    return semantic_matches, missing_skills


# ── LOCAL COSINE FALLBACK ─────────────────────────────────────────────────────

def _local_cosine_match(
    remaining_reqs: list[str],
    remaining_candidates: list[str],
) -> tuple[list[dict], list[str]]:
    """
    Pure math cosine similarity fallback.
    Used when ChromaDB is unavailable or throws an error.
    Never hangs — uses local embedding fallback which is deterministic and fast.
    """
    semantic_matches = []
    missing_skills = []

    # Use local embedding directly — never try API in the fallback path
    from app.database.vectordb import _local_embedding as _emb
    req_vecs = {req: _emb(req) for req in remaining_reqs}
    cand_vecs = {c: _emb(c) for c in remaining_candidates}

    for req, req_vec in req_vecs.items():
        best_sim = 0.0
        best_cand = ""

        for cand, cand_vec in cand_vecs.items():
            sim = cosine_similarity(req_vec, cand_vec)
            if sim > best_sim:
                best_sim = sim
                best_cand = cand

        if best_sim >= SEMANTIC_THRESHOLD and best_cand:
            semantic_matches.append({
                "required": req,
                "matched_with": best_cand,
                "similarity_score": round(best_sim * 100),
            })
        else:
            missing_skills.append(req)

    return semantic_matches, missing_skills


# ── CHROMADB RUNNER WITH TIMEOUT ──────────────────────────────────────────────

def _run_chromadb_with_timeout(
    remaining_reqs: list[str],
    remaining_candidates: list[str],
) -> tuple[list[dict], list[str]] | None:
    """Runs ChromaDB semantic match in a thread with a timeout.
    Returns None on timeout or any failure, so caller falls back to local cosine."""
    def _run():
        return _chromadb_semantic_match(remaining_reqs, remaining_candidates)

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        fut = pool.submit(_run)
        try:
            return fut.result(timeout=_CHROMADB_TIMEOUT)
        except concurrent.futures.TimeoutError:
            logger.warning(f"ChromaDB semantic match timed out after {_CHROMADB_TIMEOUT}s — using local fallback.")
            return None
        except Exception as e:
            logger.warning(f"ChromaDB semantic match error: {e}")
            return None


# ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

def evaluate_semantic_alignment(
    candidate_skills: list[str],
    required_skills: list[str],
) -> dict:
    """
    Full semantic alignment pipeline:
    1. Exact string matching (case-insensitive)
    2. ChromaDB vector search for semantic matches (with timeout)
    3. Local cosine fallback if ChromaDB fails or times out

    Returns:
        {
            exact_matches: list[str],
            semantic_matches: list[{required, matched_with, similarity_score}],
            missing_skills: list[str],
            match_pct: int
        }
    """
    if not required_skills:
        return {
            "exact_matches": [],
            "semantic_matches": [],
            "missing_skills": [],
            "match_pct": 100,
        }

    # ── STEP 0: Skill alias map for common abbreviation/full-form mismatches ──
    SKILL_ALIASES = {
        "llm": "large language models", "llms": "large language models",
        "nlp": "natural language processing", "rag": "retrieval-augmented generation",
        "genai": "generative ai", "ml": "machine learning",
        "faiss": "vector database", "chroma": "vector database",
        "scikit-learn": "sklearn", "sklearn": "scikit-learn",
        "pytorch": "deep learning framework", "tensorflow": "deep learning framework",
        "reactjs": "react", "nodejs": "node.js", "nextjs": "next.js",
        "postgres": "postgresql", "mongo": "mongodb",
        "ci/cd": "cicd", "github": "version control",
        "vector search": "semantic search", "vector retrieval": "vector search",
        "embedding models": "embeddings", "model evaluation": "ml evaluation",
        "api integration": "rest api", "automation pipelines": "workflow automation",
        "memory retention": "contextual memory", "contextual memory": "memory retention",
        "retrieval-augmented generation": "rag", "natural language processing": "nlp",
        "large language models": "llm", "generative ai": "genai",
        "agent orchestration": "ai agents", "semantic search": "vector search",
        "candidate ranking": "semantic matching", "recruitment intelligence": "ats systems",
        "multi-step reasoning": "reasoning", "tool integration": "api tool calling",
        "prompt engineering": "prompt design",
    }

    import re
    def _norm(s):
        # Remove parenthetical content - handle both closed and unclosed parens
        s = re.sub(r'\([^)]*\)', '', s.lower())
        s = re.sub(r'\([^)]*$', '', s.lower())  # unclosed paren at end
        return s.strip()

    candidate_norm = {_norm(s): s for s in candidate_skills}
    exact_matches = []
    remaining_reqs = []

    for req in required_skills:
        req_raw = req.lower().strip()
        req_norm = _norm(req)

        if req_raw in {s.lower() for s in candidate_skills}:
            exact_matches.append(req)
            continue
        if req_norm in candidate_norm:
            exact_matches.append(req)
            continue
        req_alias = SKILL_ALIASES.get(req_raw) or SKILL_ALIASES.get(req_norm)
        matched = False
        if req_alias:
            for cand_raw, cand_orig in candidate_norm.items():
                cand_alias = SKILL_ALIASES.get(cand_raw)
                if cand_raw == req_alias or cand_alias == req_raw or (cand_alias and req_alias and cand_alias == req_alias):
                    exact_matches.append(req)
                    matched = True
                    break
                if req_alias in cand_raw or cand_raw in req_alias:
                    exact_matches.append(req)
                    matched = True
                    break
        if not matched:
            req_tokens = set(req_norm.split())
            for cand_raw, cand_orig in candidate_norm.items():
                cand_tokens = set(cand_raw.split())
                common = req_tokens & cand_tokens
                if len(common) >= 1 and len(common) >= min(len(req_tokens), len(cand_tokens)) * 0.5:
                    exact_matches.append(req)
                    matched = True
                    break
        if not matched:
            remaining_reqs.append(req)

    # If all matched exactly — skip embedding calls
    if not remaining_reqs:
        return {
            "exact_matches": exact_matches,
            "semantic_matches": [],
            "missing_skills": [],
            "match_pct": 100,
        }

    # Candidates not already used in exact matches
    used_exact = {e.lower().strip() for e in exact_matches}
    remaining_candidates = [
        s for s in candidate_skills if s.lower().strip() not in used_exact
    ]

    if not remaining_candidates:
        return {
            "exact_matches": exact_matches,
            "semantic_matches": [],
            "missing_skills": remaining_reqs,
            "match_pct": int((len(exact_matches) / len(required_skills)) * 100),
        }

    # Skip ChromaDB entirely if API embeddings are unavailable
    from app.modules.shared.llm_service import is_jd_api_available

    if not is_jd_api_available():
        logger.info("API embedding unavailable — skipping ChromaDB, using local cosine.")
        semantic_matches, missing_skills = _local_cosine_match(
            remaining_reqs, remaining_candidates
        )
    else:
        # Try ChromaDB with timeout
        result = _run_chromadb_with_timeout(remaining_reqs, remaining_candidates)
        if result is not None:
            semantic_matches, missing_skills = result
        else:
            # ChromaDB failed (timeout or error) — use local cosine fallback
            logger.info("ChromaDB unavailable — using local cosine fallback.")
            semantic_matches, missing_skills = _local_cosine_match(
                remaining_reqs, remaining_candidates
            )

    # Final match percentage
    total = len(required_skills)
    matched = len(exact_matches) + len(semantic_matches)
    match_pct = int((matched / total) * 100) if total > 0 else 100

    logger.info(
        f"Semantic alignment complete: {len(exact_matches)} exact | "
        f"{len(semantic_matches)} semantic | {len(missing_skills)} missing | "
        f"{match_pct}% overall"
    )

    return {
        "exact_matches": exact_matches,
        "semantic_matches": semantic_matches,
        "missing_skills": missing_skills,
        "match_pct": match_pct,
    }
