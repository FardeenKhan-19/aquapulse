import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'priya.sharma@aquapulse.gov.in'))
        ho = result.scalar_one_or_none()
        if ho:
            print(f"User: {ho.full_name}")
            print(f"Assigned Villages: {ho.assigned_village_ids}")
            print(f"Type: {type(ho.assigned_village_ids)}")
        else:
            print("HO not found")

if __name__ == "__main__":
    asyncio.run(main())
