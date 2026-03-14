import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_sensor_reading_no_key(client):
    response = await client.post(
        "/api/sensors/reading",
        json={"timestamp": "2026-03-14T02:17:43Z", "tds_ppm": 847.3},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sensor_me_no_key(client):
    response = await client.get("/api/sensors/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sensor_reading_invalid_key(client):
    response = await client.post(
        "/api/sensors/reading",
        json={"timestamp": "2026-03-14T02:17:43Z", "tds_ppm": 300},
        headers={"X-Sensor-Key": "invalid-key-12345"},
    )
    assert response.status_code == 401
