from typing import Optional
from config import settings
from loguru import logger
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
import uuid


class S3Service:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                self._client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION,
                )
            except Exception as e:
                logger.warning(f"S3 client init failed: {e}")
        return self._client

    def upload_document(self, content: bytes, filename: str, content_type: str = "application/pdf") -> Optional[str]:
        try:
            key = f"documents/{datetime.utcnow().strftime('%Y/%m/%d')}/{filename}"
            self.client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType=content_type,
                ServerSideEncryption="AES256",
            )
            logger.info(f"Uploaded to S3: {key}")
            return key
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            return None

    def get_presigned_url(self, key: str, expiry_seconds: int = 3600) -> Optional[str]:
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
                ExpiresIn=expiry_seconds,
            )
            return url
        except Exception as e:
            logger.error(f"S3 presigned URL generation failed: {e}")
            return None

    def delete_document(self, key: str) -> bool:
        try:
            self.client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            return True
        except Exception as e:
            logger.error(f"S3 delete failed: {e}")
            return False
