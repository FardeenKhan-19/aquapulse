import asyncio
import uuid
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User
from models.village import Village

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "priya.sharma@aquapulse.gov.in"))
        ho = res.scalar_one_or_none()
        village_ids = ho.assigned_village_ids
        print(f"Assigned IDs: {village_ids}")

        village_uuids = [uuid.UUID(vid) for vid in village_ids if isinstance(vid, str)]
        print(f"UUID objects: {village_uuids}")

        res = await db.execute(select(Village).where(Village.id.in_(village_uuids)))
        villages = res.scalars().all()
        print(f"Count using .in_(UUID_objects): {len(villages)}")

        # Print all village raw IDs
        res_all = await db.execute(select(Village.id))
        all_ids = res_all.scalars().all()
        print(f"All villages count: {len(all_ids)}")
        print(f"First 3 DB village IDs: {all_ids[:3]}")

if __name__ == "__main__":
    asyncio.run(main())
