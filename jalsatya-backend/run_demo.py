import asyncio
from database import AsyncSessionLocal
from routers.demo import scenario_1_cholera_outbreak
from models.user import User, UserRole
import uuid

async def run():
    async with AsyncSessionLocal() as db:
        admin = User(id=uuid.uuid4(), email="admin@test.com", role=UserRole.admin)
        print("Triggering Demo Scenario 1 (Cholera Outbreak + Forensics + Legal Docs)...")
        res = await scenario_1_cholera_outbreak(db=db, admin=admin)
        print(f"Demo 1 completed successfully: {res}")

if __name__ == "__main__":
    asyncio.run(run())
