import os
from celery import Celery

# Set default Django settings module or config path
os.environ.setdefault("CELERY_CONFIG_MODULE", "app.config.settings")

# We can import settings directly since it reads environment variables
from app.config.settings import settings

celery_app = Celery(
    "gth_tasks",
    broker=settings.celery_broker_resolved,
    backend=settings.celery_result_backend_resolved
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Configure auto-discovery of tasks in tasks submodules
    imports=[
        "app.tasks.background_tasks"
    ]
)
