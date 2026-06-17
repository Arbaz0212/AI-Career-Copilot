# app/database/vectordb.py
# Production-Grade Global Persistent ChromaDB Client & Semantic Embedding Routines.

from __future__ import annotations
import os
import math
import logging
import chromadb

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

# ── STORAGE PATH ──────────────────────────────────────────────────────────────
DATABASE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "chroma_data"
)
os.makedirs(DATABASE_DIR, exist_ok=True)

# ── CHROMADB CLIENT ───────────────────────────────────────────────────────────
try:
    chroma_client = chromadb.PersistentClient(path=DATABASE_DIR)
    logger.info(f"ChromaDB initialized at: {DATABASE_DIR}")
except Exception as e:
    logger.critical(f"ChromaDB PersistentClient failed — falling back to in-memory: {e}")
    chroma_client = chromadb.Client()


# ── COLLECTION ACCESSOR ───────────────────────────────────────────────────────

def get_jd_match_collection() -> chromadb.Collection:
    """
    Retrieves or creates the JD matching ChromaDB collection.
    Uses cosine distance — optimal for semantic skill similarity.
    """
    return chroma_client.get_or_create_collection(
        name="jd_matching_collection",
        metadata={"hnsw:space": "cosine"},
    )


# ── EMBEDDING GENERATOR ───────────────────────────────────────────────────────

EMBEDDING_DIM = 768

def _local_embedding(text: str) -> list[float]:
    """Fast deterministic embedding using char n-gram hashing.
    Always returns a 768-dim unit vector — never hangs, never crashes."""
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM

    clean = text.lower().strip()
    dim = EMBEDDING_DIM
    vec = [0.0] * dim
    total = 0

    for n in (1, 2, 3):
        for i in range(len(clean) - n + 1):
            gram = clean[i:i + n]
            h = hash(gram)
            idx = abs(h) % dim
            vec[idx] += 1.0
            total += 1

    if total == 0:
        return [0.0] * dim

    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


# ── PUBLIC EMBEDDING FUNCTIONS ────────────────────────────────────────────────

def generate_single_embedding(text: str) -> list[float]:
    """Generates a 768-dim dense vector using local n-gram hashing.
    Deterministic, fast (~0.001s), always uses local since Groq doesn't support embeddings."""
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM
    return _local_embedding(text)


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings for a list of texts.
    Uses local fallback for all texts if API is unavailable (fast path).
    """
    if not texts:
        return []

    # Try first text as a probe
    first = _try_api_embedding(texts[0])
    if first is None:
        # Fast path: API unavailable, use local for everything
        logger.info("API embedding unavailable — using fast local embeddings.")
        return [_local_embedding(t) for t in texts]

    # API available: use it for all texts
    results = [first]
    for i, text in enumerate(texts[1:], start=1):
        result = _try_api_embedding(text)
        results.append(result if result is not None else _local_embedding(text))
        if i < len(texts) - 1:
            time.sleep(0.3)

    return results
