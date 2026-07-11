import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config.settings import settings
from app.api.v1.router import api_router
from app.api.websocket import router as ws_router
from app.services.redis import redis_service

# Setup basic logging config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("gth_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing application services...")
    await redis_service.connect()
    yield
    # Shutdown actions
    logger.info("Stopping application services...")
    await redis_service.close()

app = FastAPI(
    title="GTH TechVerse 2026 API",
    description="Production backend management system built with FastAPI, SQLAlchemy, Redis and Celery.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Adjust origins in production matching frontend deployment
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "https://tech-verse-2026.vercel.app",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local uploads folder if configured
if settings.STORAGE_PROVIDER.lower() == "local":
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
    except OSError as e:
        logger.warning(f"Could not create upload directory (might be a read-only filesystem like Vercel): {e}")

# Health check
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "redis": redis_service.redis is not None}

# Mount sub-routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Custom exception handlers for frontend compatibility
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Extract the first error message for cleaner frontend display
    error_msg = "Validation Error"
    if exc.errors():
        err = exc.errors()[0]
        error_msg = f"{err.get('loc', [''])[-1]}: {err.get('msg', '')}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": error_msg}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on request {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "An unexpected error occurred. Please try again later."}
    )
