from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.user import User, UserRole
from core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from config import settings
import redis.asyncio as aioredis
from loguru import logger


class AuthService:
    def __init__(self, db: AsyncSession, redis_client: aioredis.Redis):
        self.db = db
        self.redis = redis_client

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    async def login(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        user = await self.authenticate_user(email, password)
        if not user:
            return None

        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value, "email": user.email}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id), "role": user.role.value}
        )

        await self.db.execute(
            update(User).where(User.id == user.id).values(last_login=datetime.utcnow())
        )
        await self.db.commit()

        await self.redis.setex(
            f"refresh:{refresh_token}",
            timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            str(user.id),
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value,
                "full_name": user.full_name,
            },
        }

    async def refresh_access_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        stored_user_id = await self.redis.get(f"refresh:{refresh_token}")
        if not stored_user_id:
            return None

        user_id = payload.get("sub")
        if user_id != stored_user_id:
            return None

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            return None

        new_access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value, "email": user.email}
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    async def logout(self, refresh_token: str, access_token: str):
        await self.redis.delete(f"refresh:{refresh_token}")

        payload = decode_token(access_token)
        if payload:
            exp = payload.get("exp", 0)
            ttl = max(int(exp - datetime.utcnow().timestamp()), 0)
            if ttl > 0:
                await self.redis.setex(f"blacklist:{access_token}", ttl, "1")

        logger.info("User logged out, tokens revoked")

    async def change_password(self, user: User, old_password: str, new_password: str) -> bool:
        if not verify_password(old_password, user.hashed_password):
            return False
        new_hash = get_password_hash(new_password)
        await self.db.execute(
            update(User).where(User.id == user.id).values(
                hashed_password=new_hash,
                updated_at=datetime.utcnow(),
            )
        )
        await self.db.commit()
        return True
