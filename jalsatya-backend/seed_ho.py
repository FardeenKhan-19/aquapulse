import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User, UserRole
from core.security import get_password_hash
from models.village import Village

async def main():
    async with AsyncSessionLocal() as db:
        # Check if already exists
        result = await db.execute(select(User).where(User.email == "priya.sharma@aquapulse.gov.in"))
        ho = result.scalar_one_or_none()
        if ho:
            print("Health Officer already exists.")
            return

        # Get some villages to assign
        result = await db.execute(select(Village.id))
        village_ids = result.scalars().all()

        ho_user = User(
            id=uuid.uuid4(),
            email="priya.sharma@aquapulse.gov.in",
            hashed_password=get_password_hash("AquaPulse@2025"),
            full_name="Dr. Priya Sharma",
            role=UserRole.health_officer,
            is_active=True,
            phone="+919876543210",
            assigned_village_ids=[v for v in village_ids[:3]] if village_ids else [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(ho_user)
        await db.commit()
        print("Health Officer seeded successfully!")

asyncio.run(main())
