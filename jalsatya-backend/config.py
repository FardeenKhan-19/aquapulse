from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    APP_NAME: str = "AquaPulse AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str = "sqlite+aiosqlite:///./aquapulse.db"
    DATABASE_URL_SYNC: str = "sqlite:///./aquapulse.db"

    REDIS_URL: str = "memory://"
    CELERY_BROKER_URL: str = "memory://"
    CELERY_RESULT_BACKEND: str = "memory://"

    SENSOR_MODE: str = "mock"
    MOCK_UPDATE_INTERVAL_SECONDS: int = 5
    MOCK_VILLAGE_COUNT: int = 15

    GEMINI_API_KEY: str = "your-gemini-api-key"
    GEMINI_MODEL: str = "gemini-2.5-pro"

    AWS_ACCESS_KEY_ID: str = "your-key"
    AWS_SECRET_ACCESS_KEY: str = "your-secret"
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str = "aquapulse-documents"
    CLOUDFRONT_DOMAIN: str = "your-cloudfront-domain"

    TWILIO_ACCOUNT_SID: str = "your-sid"
    TWILIO_AUTH_TOKEN: str = "your-token"
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    TWILIO_SMS_FROM: str = "+1234567890"

    ALLOWED_ORIGINS: str = "http://localhost:3000,https://yourdomain.com"
    SENSOR_RATE_LIMIT_SECONDS: int = 25
    API_RATE_LIMIT_PER_MINUTE: int = 100

    ADMIN_EMAIL: str = "admin@aquapulse.ai"
    ADMIN_PASSWORD: str = "ChangeThisInProduction@2026"
    ADMIN_FULL_NAME: str = "System Administrator"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_mock_mode(self) -> bool:
        return self.SENSOR_MODE == "mock"


settings = Settings()
