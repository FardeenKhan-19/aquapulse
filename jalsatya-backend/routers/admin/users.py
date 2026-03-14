from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from database import get_db
from core.dependencies import get_current_admin
from models.user import User, UserRole
from schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse, AssignVillageRequest, ResetPasswordRequest
from core.security import get_password_hash
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/api/admin/users", tags=["Admin - Users"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("")
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=UserRole(user_data.role),
        phone=user_data.phone,
        assigned_village_ids=[str(v) for v in (user_data.assigned_village_ids or [])],
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return _envelope(data=UserResponse.model_validate(user).model_dump(mode="json"))


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar()

    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    users = result.scalars().all()

    return _envelope(data={
        "items": [UserResponse.model_validate(u).model_dump(mode="json") for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
    })


@router.get("/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _envelope(data=UserResponse.model_validate(user).model_dump(mode="json"))


@router.put("/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = user_data.model_dump(exclude_unset=True)
    if "assigned_village_ids" in update_dict and update_dict["assigned_village_ids"] is not None:
        update_dict["assigned_village_ids"] = [str(v) for v in update_dict["assigned_village_ids"]]

    for key, value in update_dict.items():
        setattr(user, key, value)
    user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)

    return _envelope(data=UserResponse.model_validate(user).model_dump(mode="json"))


@router.delete("/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    user.updated_at = datetime.utcnow()
    await db.commit()

    return _envelope(message="User deactivated")


@router.post("/{user_id}/assign-village")
async def assign_village(
    user_id: uuid.UUID,
    request: AssignVillageRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    current_ids = list(user.assigned_village_ids or [])
    vid_str = str(request.village_id)
    if vid_str not in [str(v) for v in current_ids]:
        current_ids.append(vid_str)
        user.assigned_village_ids = current_ids
        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)

    return _envelope(data=UserResponse.model_validate(user).model_dump(mode="json"), message="Village assigned")


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: uuid.UUID,
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = get_password_hash(request.new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()

    return _envelope(message="Password reset successfully")
