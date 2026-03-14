from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from core.dependencies import get_current_admin
from models.user import User
from models.village import Village
from schemas.village import VillageCreate, VillageUpdate, VillageResponse
from datetime import datetime
import uuid
import math

router = APIRouter(prefix="/api/admin/villages", tags=["Admin - Villages"])


def _envelope(data=None, message=None, success=True):
    return {"success": success, "data": data, "message": message, "timestamp": datetime.utcnow().isoformat() + "Z"}


@router.post("")
async def create_village(
    village_data: VillageCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    village = Village(
        id=uuid.uuid4(),
        name=village_data.name,
        district=village_data.district,
        state=village_data.state,
        gps_lat=village_data.gps_lat,
        gps_lng=village_data.gps_lng,
        population=village_data.population,
        primary_water_source=village_data.primary_water_source,
        assigned_health_officer_ids=[],
        risk_threshold_low=village_data.risk_threshold_low,
        risk_threshold_medium=village_data.risk_threshold_medium,
        risk_threshold_high=village_data.risk_threshold_high,
        risk_threshold_critical=village_data.risk_threshold_critical,
        created_at=datetime.utcnow(),
    )
    db.add(village)
    await db.commit()
    await db.refresh(village)

    return _envelope(data=VillageResponse.model_validate(village).model_dump(mode="json"))


@router.get("")
async def list_villages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    total_result = await db.execute(select(func.count(Village.id)))
    total = total_result.scalar()

    result = await db.execute(
        select(Village)
        .order_by(Village.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    villages = result.scalars().all()

    return _envelope(data={
        "items": [VillageResponse.model_validate(v).model_dump(mode="json") for v in villages],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
    })


@router.get("/{village_id}")
async def get_village(
    village_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Village).where(Village.id == village_id))
    village = result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return _envelope(data=VillageResponse.model_validate(village).model_dump(mode="json"))


@router.put("/{village_id}")
async def update_village(
    village_id: uuid.UUID,
    village_data: VillageUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Village).where(Village.id == village_id))
    village = result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    update_dict = village_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(village, key, value)

    await db.commit()
    await db.refresh(village)

    return _envelope(data=VillageResponse.model_validate(village).model_dump(mode="json"))


@router.delete("/{village_id}")
async def delete_village(
    village_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Village).where(Village.id == village_id))
    village = result.scalar_one_or_none()
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    await db.delete(village)
    await db.commit()

    return _envelope(message="Village deleted")
