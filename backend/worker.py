"""
Celery worker entrypoint.
Run with: celery -A worker worker --loglevel=info --concurrency=4
"""
from app.tasks import celery_app

if __name__ == "__main__":
    celery_app.start()
