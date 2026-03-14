from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from core.dependencies import get_current_user, get_redis
from schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest, RefreshRequest
from services.auth_service import AuthService
from models.user import User
from datetime import datetime
import redis.asyncio as aioredis

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _envelope(data=None, message=None, success=True):
    return {
        "success": success,
        "data": data,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def _error(message: str, error_code: str, status_code: int = 400):
    return {
        "success": False,
        "data": None,
        "message": message,
        "error_code": error_code,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.post("/login")
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis_client)
    result = await auth_service.login(request.email, request.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    response_data = _envelope(data=result)
    return response_data


@router.post("/refresh")
async def refresh_token(
    request: RefreshRequest = None,
    refresh_token_cookie: str = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    token = None
    if request and request.refresh_token:
        token = request.refresh_token
    elif refresh_token_cookie:
        token = refresh_token_cookie

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required",
        )

    auth_service = AuthService(db, redis_client)
    result = await auth_service.refresh_access_token(token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    return _envelope(data=result)


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    refresh_token = body.get("refresh_token", "")
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token", "")

    auth_service = AuthService(db, redis_client)
    await auth_service.logout(refresh_token, access_token)

    return _envelope(message="Logged out successfully")


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return _envelope(data={
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "phone": current_user.phone,
        "assigned_village_ids": [str(v) for v in (current_user.assigned_village_ids or [])],
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() + "Z" if current_user.created_at else None,
        "last_login": current_user.last_login.isoformat() + "Z" if current_user.last_login else None,
    })


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis_client: aioredis.Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis_client)
    success = await auth_service.change_password(current_user, request.old_password, request.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    return _envelope(message="Password changed successfully")
