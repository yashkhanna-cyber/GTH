import os
import shutil
import uuid
import logging
import boto3
from botocore.client import Config
from typing import BinaryIO, Tuple
from fastapi import UploadFile
from app.config.settings import settings

logger = logging.getLogger(__name__)

class StorageManager:
    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER.lower()
        self.bucket = settings.STORAGE_BUCKET
        self.s3_client = None

        if self.provider in ["s3", "minio", "r2"]:
            try:
                client_kwargs = {
                    "aws_access_key_id": settings.STORAGE_ACCESS_KEY,
                    "aws_secret_access_key": settings.STORAGE_SECRET_KEY,
                    "region_name": settings.STORAGE_REGION,
                }
                
                # Check for custom endpoint (MinIO, R2)
                if settings.STORAGE_ENDPOINT:
                    client_kwargs["endpoint_url"] = settings.STORAGE_ENDPOINT

                # Use path-style addressing for MinIO
                if self.provider == "minio":
                    client_kwargs["config"] = Config(signature_version="s3v4")
                    
                self.s3_client = boto3.client("s3", **client_kwargs)
                logger.info(f"Initialized S3-compatible storage client via provider: {self.provider}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 storage client: {e}")
        elif self.provider == "supabase":
            logger.info("Initialized Supabase Storage client (using direct HTTP API).")
        else:
            # Local Storage
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            logger.info("Initialized Local storage.")

    def upload_file(self, file: BinaryIO, filename: str, mime_type: str, bucket: str = None) -> Tuple[str, str]:
        """
        Uploads a file to the configured storage provider.
        Returns a tuple: (stored_filename, file_url)
        """
        # Generate a unique filename to prevent name collisions
        ext = os.path.splitext(filename)[1]
        stored_filename = f"{uuid.uuid4()}{ext}"
        bucket_name = bucket or self.bucket

        if self.provider == "supabase":
            try:
                import httpx
                file_data = file.read()
                url = f"{settings.supabase_url_resolved.rstrip('/')}/storage/v1/object/{bucket_name}/{stored_filename}"
                headers = {
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": mime_type
                }
                response = httpx.post(url, headers=headers, content=file_data, timeout=30.0)
                if response.status_code != 200:
                    logger.error(f"Supabase Upload failed ({response.status_code}): {response.text}")
                    raise Exception(f"Supabase Upload HTTP Error: {response.text}")
                
                file_url = f"{settings.supabase_url_resolved.rstrip('/')}/storage/v1/object/public/{bucket_name}/{stored_filename}"
                return stored_filename, file_url
            except Exception as e:
                logger.error(f"Supabase Upload Error: {e}")
                raise e
        elif self.provider == "local" or (self.provider != "supabase" and not self.s3_client):
            # Store locally
            file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file, buffer)
            
            # Local file URL (can be resolved via static file serving)
            file_url = f"/uploads/{stored_filename}"
            return stored_filename, file_url
        else:
            # Store in S3-compatible storage
            try:
                self.s3_client.upload_fileobj(
                    file,
                    bucket_name,
                    stored_filename,
                    ExtraArgs={"ContentType": mime_type}
                )
                
                # Generate File URL
                if settings.STORAGE_ENDPOINT:
                    file_url = f"{settings.STORAGE_ENDPOINT}/{bucket_name}/{stored_filename}"
                else:
                    file_url = f"https://{bucket_name}.s3.{settings.STORAGE_REGION}.amazonaws.com/{stored_filename}"
                
                return stored_filename, file_url
            except Exception as e:
                logger.error(f"S3 Upload Error: {e}")
                raise e

    def delete_file(self, stored_filename: str, bucket: str = None) -> bool:
        """
        Deletes a file from the configured storage provider.
        """
        bucket_name = bucket or self.bucket
        if self.provider == "supabase":
            try:
                import httpx
                url = f"{settings.supabase_url_resolved.rstrip('/')}/storage/v1/object/{bucket_name}/{stored_filename}"
                headers = {
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}"
                }
                response = httpx.delete(url, headers=headers, timeout=30.0)
                if response.status_code != 200:
                    logger.error(f"Supabase Delete failed ({response.status_code}): {response.text}")
                    return False
                return True
            except Exception as e:
                logger.error(f"Supabase Delete Error: {e}")
                return False
        elif self.provider == "local" or (self.provider != "supabase" and not self.s3_client):
            file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        else:
            try:
                self.s3_client.delete_object(Bucket=bucket_name, Key=stored_filename)
                return True
            except Exception as e:
                logger.error(f"S3 Delete Error: {e}")
                return False

storage_manager = StorageManager()
