import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'priya.sharma@aquapulse.gov.in'))
        ho = result.scalar_one_or_none()
        if ho:
            ids = ho.assigned_village_ids
            print(f"RAW: {repr(ids)}")
            if ids:
                for v in ids:
                    print(f"Item: {repr(v)}, Type: {type(v)}")
        else:
            print("Not found")

if __name__ == "__main__":
    asyncio.run(main())
