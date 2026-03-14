import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.sensor_node import SensorNode
from models.village import Village
from models.sensor_reading import SensorReading
from config import settings
from loguru import logger
import uuid
import numpy as np


HEALTHY_PROFILES = {
    "tds_base": 220, "tds_noise": 15, "temp_base": 27, "temp_noise": 1.5,
    "turb_base": 4, "turb_noise": 1, "ph_base": 7.2, "ph_noise": 0.2,
    "humidity_base": 62, "humidity_noise": 5, "flow_base": 4.5, "flow_noise": 0.5,
}
WARNING_PROFILES = {
    "tds_base": 480, "tds_noise": 40, "temp_base": 30, "temp_noise": 2,
    "turb_base": 18, "turb_noise": 5, "ph_base": 6.5, "ph_noise": 0.3,
    "humidity_base": 75, "humidity_noise": 8, "flow_base": 3.0, "flow_noise": 0.8,
}
CRITICAL_PROFILES = {
    "tds_base": 920, "tds_noise": 80, "temp_base": 32, "temp_noise": 2,
    "turb_base": 45, "turb_noise": 12, "ph_base": 5.8, "ph_noise": 0.5,
    "humidity_base": 85, "humidity_noise": 5, "flow_base": 2.0, "flow_noise": 1.0,
}

VILLAGE_NAMES_MH = [
    ("Dharangaon", "Jalgaon", "Maharashtra"),
    ("Yawal", "Jalgaon", "Maharashtra"),
    ("Raver", "Jalgaon", "Maharashtra"),
    ("Chopda", "Jalgaon", "Maharashtra"),
    ("Bhusawal", "Jalgaon", "Maharashtra"),
    ("Pachora", "Jalgaon", "Maharashtra"),
    ("Amalner", "Jalgaon", "Maharashtra"),
    ("Erandol", "Jalgaon", "Maharashtra"),
    ("Parola", "Jalgaon", "Maharashtra"),
    ("Jamner", "Jalgaon", "Maharashtra"),
]
VILLAGE_NAMES_UP = [
    ("Basti Town", "Basti", "Uttar Pradesh"),
    ("Gorakhpur East", "Gorakhpur", "Uttar Pradesh"),
    ("Deoria", "Deoria", "Uttar Pradesh"),
    ("Kushinagar", "Kushinagar", "Uttar Pradesh"),
    ("Azamgarh", "Azamgarh", "Uttar Pradesh"),
]


def _get_season(dt: datetime) -> int:
    month = dt.month
    if month in (3, 4, 5):
        return 0  # summer
    elif month in (6, 7, 8, 9):
        return 1  # monsoon
    elif month in (10, 11):
        return 2  # post-monsoon
    else:
        return 3  # winter


def _daily_cycle_factor(hour: int) -> float:
    return 1.0 + 0.05 * math.sin(2 * math.pi * (hour - 6) / 24)


def _monsoon_turbidity_factor(dt: datetime) -> float:
    if dt.month in (6, 7, 8, 9):
        return 1.5 + 0.5 * random.random()
    return 1.0


def _industrial_spike(hour: int) -> float:
    spike_hours = [2, 6, 14, 22]
    for sh in spike_hours:
        if abs(hour - sh) <= 1 and random.random() < 0.15:
            return 2.5 + random.random() * 2.0
    return 1.0


def generate_reading(profile: Dict[str, float], dt: datetime, add_spike: bool = False) -> Dict[str, Any]:
    hour = dt.hour
    season = _get_season(dt)
    daily_factor = _daily_cycle_factor(hour)
    monsoon_factor = _monsoon_turbidity_factor(dt)
    industrial_factor = _industrial_spike(hour) if add_spike else 1.0

    noise_pct = 0.02 + random.random() * 0.03

    tds = profile["tds_base"] * daily_factor * industrial_factor
    tds += random.gauss(0, profile["tds_noise"])
    tds = max(10, tds)

    temp = profile["temp_base"] + random.gauss(0, profile["temp_noise"])
    temp += (-2 if hour < 6 else 2 if 10 < hour < 16 else 0)
    if season == 0:
        temp += 3
    elif season == 3:
        temp -= 4

    turb = profile["turb_base"] * monsoon_factor + random.gauss(0, profile["turb_noise"])
    turb = max(0.1, turb)

    ph = profile["ph_base"] + random.gauss(0, profile["ph_noise"])
    if industrial_factor > 1.5:
        ph -= 0.5 * (industrial_factor - 1)
    ph = max(2, min(12, ph))

    humidity = profile["humidity_base"] + random.gauss(0, profile["humidity_noise"])
    if season == 1:
        humidity += 15
    humidity = max(20, min(100, humidity))

    flow = profile["flow_base"] + random.gauss(0, profile["flow_noise"])
    if 6 <= hour <= 9 or 17 <= hour <= 20:
        flow *= 1.3
    flow = max(0.1, flow)

    sensor_failure = random.random() < 0.05

    reading = {
        "timestamp": dt.isoformat() + "Z",
        "tds_ppm": round(tds, 1) if not sensor_failure else None,
        "temperature_c": round(temp, 1),
        "turbidity_ntu": round(turb, 1) if random.random() > 0.02 else None,
        "ph": round(ph, 2),
        "humidity_pct": round(humidity, 1),
        "flow_rate_lpm": round(flow, 2),
        "battery_pct": round(85 + random.random() * 15, 0),
        "signal_strength_dbm": round(-50 - random.random() * 30, 0),
    }
    return reading


def generate_spike_sequence(
    base_profile: Dict[str, float],
    start_time: datetime,
    peak_tds: float = 950,
    duration_minutes: int = 120,
    interval_seconds: int = 30,
) -> List[Dict[str, Any]]:
    readings = []
    steps = duration_minutes * 60 // interval_seconds
    rise_steps = steps // 3
    peak_steps = steps // 3
    fall_steps = steps - rise_steps - peak_steps

    for i in range(steps):
        dt = start_time + timedelta(seconds=i * interval_seconds)
        reading = generate_reading(base_profile, dt)

        if i < rise_steps:
            progress = i / rise_steps
            tds_val = base_profile["tds_base"] + (peak_tds - base_profile["tds_base"]) * progress
        elif i < rise_steps + peak_steps:
            tds_val = peak_tds + random.gauss(0, 20)
        else:
            progress = (i - rise_steps - peak_steps) / fall_steps
            tds_val = peak_tds - (peak_tds - base_profile["tds_base"]) * progress

        reading["tds_ppm"] = round(max(10, tds_val), 1)

        if tds_val > base_profile["tds_base"] * 1.5:
            reading["ph"] = round(max(3, base_profile["ph_base"] - 1.2 * (tds_val / peak_tds)), 2)
            reading["turbidity_ntu"] = round(base_profile["turb_base"] * 2.5 + random.gauss(0, 3), 1)

        readings.append(reading)

    return readings


def generate_recovery_sequence(
    base_profile: Dict[str, float],
    start_time: datetime,
    duration_hours: int = 24,
    interval_seconds: int = 300,
) -> List[Dict[str, Any]]:
    readings = []
    elevated_tds = base_profile["tds_base"] * 2.5
    steps = duration_hours * 3600 // interval_seconds

    for i in range(steps):
        dt = start_time + timedelta(seconds=i * interval_seconds)
        progress = i / steps
        decay = math.exp(-3 * progress)

        reading = generate_reading(base_profile, dt)
        current_tds = base_profile["tds_base"] + (elevated_tds - base_profile["tds_base"]) * decay
        reading["tds_ppm"] = round(current_tds + random.gauss(0, 10), 1)
        reading["ph"] = round(base_profile["ph_base"] - 0.8 * decay + random.gauss(0, 0.1), 2)
        reading["turbidity_ntu"] = round(base_profile["turb_base"] * (1 + 2 * decay) + random.gauss(0, 1), 1)

        readings.append(reading)

    return readings


async def seed_villages(db: AsyncSession) -> List[Village]:
    all_village_data = VILLAGE_NAMES_MH + VILLAGE_NAMES_UP
    villages = []
    base_lat_mh, base_lng_mh = 21.01, 75.57
    base_lat_up, base_lng_up = 26.81, 83.39

    for idx, (name, district, state) in enumerate(all_village_data):
        if state == "Maharashtra":
            lat = base_lat_mh + random.uniform(-0.5, 0.5)
            lng = base_lng_mh + random.uniform(-0.5, 0.5)
        else:
            lat = base_lat_up + random.uniform(-0.5, 0.5)
            lng = base_lng_up + random.uniform(-0.5, 0.5)

        village = Village(
            id=uuid.uuid4(),
            name=name,
            district=district,
            state=state,
            gps_lat=round(lat, 8),
            gps_lng=round(lng, 8),
            population=random.randint(2000, 25000),
            primary_water_source=random.choice(["River", "Borewell", "Canal", "Reservoir", "Handpump"]),
            assigned_health_officer_ids=[],
        )
        db.add(village)
        villages.append(village)

    await db.commit()
    for v in villages:
        await db.refresh(v)

    logger.info(f"Seeded {len(villages)} villages")
    return villages


async def generate_historical_data(
    db: AsyncSession,
    villages: List[Village],
    sensors: List[SensorNode],
    hours: int = 24,
):
    now = datetime.utcnow()
    village_sensor_map = {}
    for sensor in sensors:
        village_sensor_map[str(sensor.village_id)] = sensor

    profiles = [HEALTHY_PROFILES, WARNING_PROFILES, CRITICAL_PROFILES]

    for idx, village in enumerate(villages[:3]):
        sensor = village_sensor_map.get(str(village.id))
        if not sensor:
            continue

        profile = profiles[idx % 3]
        add_spike = idx == 2

        interval = 300
        steps = hours * 3600 // interval

        for i in range(steps):
            dt = now - timedelta(seconds=(steps - i) * interval)
            data = generate_reading(profile, dt, add_spike=add_spike)

            reading = SensorReading(
                id=uuid.uuid4(),
                sensor_node_id=sensor.id,
                village_id=village.id,
                timestamp=dt,
                tds_ppm=data.get("tds_ppm"),
                temperature_c=data.get("temperature_c"),
                turbidity_ntu=data.get("turbidity_ntu"),
                ph=data.get("ph"),
                humidity_pct=data.get("humidity_pct"),
                flow_rate_lpm=data.get("flow_rate_lpm"),
                raw_payload=data,
                is_anomaly=False,
                anomaly_score=0.0,
            )
            db.add(reading)

            if i % 50 == 0:
                await db.flush()

    await db.commit()
    logger.info(f"Generated {hours}h of historical data for {min(len(villages), 3)} villages")
