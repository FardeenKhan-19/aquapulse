import asyncio
import uuid
from sqlalchemy import select, or_
from database import AsyncSessionLocal
from models.user import User
from models.village import Village

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "priya.sharma@aquapulse.gov.in"))
        ho = res.scalar_one_or_none()
        village_ids = ho.assigned_village_ids
        print(f"Assigned IDs count: {len(village_ids)}")
        
        # Test 3: or_ with uuid.UUID
        conditions = [Village.id == uuid.UUID(v) for v in village_ids]
        q3 = select(Village).where(or_(*conditions))
        res3 = await db.execute(q3)
        villages3 = res3.scalars().all()
        print(f"or_ fallback count: {len(villages3)}")

if __name__ == "__main__":
    asyncio.run(main())
