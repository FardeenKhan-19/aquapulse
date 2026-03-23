from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from database import get_db
from models.user import User, UserRole
from models.sensor_node import SensorNode
from core.security import decode_token, verify_api_key
import json
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

import time

class MockRedis:
    def __init__(self):
        self._data = {}
        self._expires = {}
    async def get(self, key):
        if key in self._expires and time.time() > self._expires[key]:
            self._data.pop(key, None)
            self._expires.pop(key, None)
        return self._data.get(key)
    async def set(self, key, value, ex=None):
        self._data[key] = value
        if ex:
            self._expires[key] = time.time() + ex
        return True
    async def setex(self, key, time_s, value):
        self._data[key] = value
        self._expires[key] = time.time() + time_s
        return True
    async def delete(self, *names):
        for name in names:
            self._data.pop(name, None)
        return len(names)
    async def ping(self):
        return True

_redis_mock = MockRedis()

async def get_redis():
    return _redis_mock


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    redis_client = await get_redis()
    is_blacklisted = await redis_client.get(f"blacklist:{token}")
    if is_blacklisted:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    import uuid
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )
        
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_current_health_officer(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role not in (UserRole.health_officer, UserRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Health officer or admin access required",
        )
    return current_user


async def get_sensor_node(
    x_sensor_key: Optional[str] = Header(None, alias="X-Sensor-Key"),
    db: AsyncSession = Depends(get_db),
    redis_client: MockRedis = Depends(get_redis),
) -> SensorNode:
    if not x_sensor_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Sensor-Key header required",
        )
    result = await db.execute(select(SensorNode).where(SensorNode.api_key == x_sensor_key))
    sensor = result.scalar_one_or_none()
    if sensor is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid sensor API key",
        )
    if not sensor.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sensor node not approved",
        )
    if not sensor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sensor node is deactivated",
        )
    rate_key = f"sensor_rate:{str(sensor.id)}"
    last_submit = await redis_client.get(rate_key)
    if last_submit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limited: max 1 reading per {settings.SENSOR_RATE_LIMIT_SECONDS} seconds",
        )
    return sensor
