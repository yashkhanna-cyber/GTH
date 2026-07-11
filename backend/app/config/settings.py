import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GTH TechVerse 2026"
    ENVIRONMENT: str = "development"

    # Security
    JWT_SECRET: str = "gth-techverse-2026-super-secret-key-change-in-production"
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def jwt_secret_resolved(self) -> str:
        return self.JWT_SECRET_KEY or self.JWT_SECRET

    @property
    def jwt_refresh_secret_resolved(self) -> str:
        return self.JWT_REFRESH_SECRET or self.jwt_secret_resolved

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/gth_techverse"

    # Supabase
    SUPABASE_URL: str = ""
    NEXT_PUBLIC_SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    @property
    def supabase_url_resolved(self) -> str:
        return self.SUPABASE_URL or self.NEXT_PUBLIC_SUPABASE_URL

    @property
    def supabase_anon_key_resolved(self) -> str:
        return self.SUPABASE_ANON_KEY or self.NEXT_PUBLIC_SUPABASE_ANON_KEY

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = ""
    CELERY_RESULT_BACKEND: str = ""

    @property
    def celery_broker_resolved(self) -> str:
        if self.CELERY_BROKER_URL:
            return self.CELERY_BROKER_URL
        base = self.REDIS_URL
        if base.endswith("/0"):
            return base[:-2] + "/1"
        return base + "/1"

    @property
    def celery_result_backend_resolved(self) -> str:
        if self.CELERY_RESULT_BACKEND:
            return self.CELERY_RESULT_BACKEND
        base = self.REDIS_URL
        if base.endswith("/0"):
            return base[:-2] + "/2"
        return base + "/2"

    # Storage Settings
    # Supported: local, s3, minio, r2, supabase
    STORAGE_PROVIDER: str = "local"
    STORAGE_ENDPOINT: str = ""
    STORAGE_BUCKET: str = "gth-techverse"
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_REGION: str = "us-east-1"
    # Used if STORAGE_PROVIDER is local
    UPLOAD_DIR: str = "uploads"

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@geetauniversity.edu.in"
    SMTP_FROM_NAME: str = "GTH TechVerse"

settings = Settings()
