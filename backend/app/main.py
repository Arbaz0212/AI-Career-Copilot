import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

from app.database.database import engine, Base
from app.models import User, JobAnalysis, Payment, ResumeAnalysis
from app.routes import auth
from app.routes.payment import router as payment_router
from app.routes.analysis import router as history_router
from app.modules.resume_review.routes import (
    router as resume_review_router
)
from app.modules.jd_match.routes import (
    router as jd_match_router,
    limiter as jd_match_limiter,
)

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,
    stream=sys.stdout,
)
logging.root.handlers[0].flush = lambda: sys.stdout.flush()
logging.getLogger("chromadb").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google.genai").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Career Copilot API"
)

app.state.limiter = jd_match_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
RENDER_DOMAIN = os.getenv("RENDER_EXTERNAL_URL", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        FRONTEND_URL,
        RENDER_DOMAIN,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(payment_router)
app.include_router(resume_review_router)
app.include_router(jd_match_router)
app.include_router(history_router)


@app.get("/")
def root():
    return {"message": "AI Career Copilot API Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def on_startup():
    """Create all database tables and migrate existing ones."""
    Base.metadata.create_all(bind=engine)
    # Attempt to add new columns to existing tables (safe, IF NOT EXISTS)
    from sqlalchemy import text
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR DEFAULT 'email'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewer_scans INTEGER DEFAULT 1",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS jd_scans INTEGER DEFAULT 1",
            "ALTER TABLE job_analyses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                conn.rollback()

        # Backfill free scans for existing users who have NULL (column added by migration but never populated)
        # IMPORTANT: Only backfill NULL users — users who consumed their free scan (now 0) keep 0.
        from app.models.user import User
        from app.database.database import SessionLocal
        session = SessionLocal()
        try:
            fixed = session.query(User).filter(
                (User.reviewer_scans == None) | (User.jd_scans == None)
            ).all()
            for u in fixed:
                if u.reviewer_scans is None:
                    u.reviewer_scans = 1
                if u.jd_scans is None:
                    u.jd_scans = 1
            session.commit()
            if fixed:
                logger.info(f"Backfilled free scans for {len(fixed)} existing user(s).")
        except Exception as e:
            session.rollback()
            logger.warning(f"Scan backfill skipped (non-critical): {e}")
        finally:
            session.close()
    logger.info("Database tables created / migrated.")
