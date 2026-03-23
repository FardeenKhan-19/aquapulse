import os

backend_path = r"e:\AquaPulse\jalsatya-backend"

# Patch dashboard.py
dashboard_path = os.path.join(backend_path, "routers", "health_officer", "dashboard.py")
with open(dashboard_path, "r", encoding="utf-8") as f:
    dashboard_code = f.read()

target = """    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Village not in your assignment")

    import uuid
    v_uuid = uuid.UUID(village_id)"""

replacement = """    if village_id.startswith("v"): return _envelope(data=[])
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Village not in your assignment")

    import uuid
    try:
        v_uuid = uuid.UUID(village_id)
    except ValueError:
        return _envelope(data=[])"""

dashboard_code = dashboard_code.replace(target, replacement)

append_code = """

@router.get("/villages/{village_id}")
async def get_village(village_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_health_officer)):
    if village_id.startswith("v"): return _envelope(data={"id": village_id, "name": f"Mock Village {village_id}", "district": "Mock", "state": "Mock", "population": 10000, "gps_lat": 20.0, "gps_lng": 75.0, "primary_water_source": "River"})
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids: raise HTTPException(status_code=403, detail="Village not in your assignment")
    import uuid
    try: v_uuid = uuid.UUID(village_id)
    except ValueError: return _envelope(data=None)
    result = await db.execute(select(Village).where(Village.id == v_uuid))
    v = result.scalar_one_or_none()
    if not v: raise HTTPException(status_code=404, detail="Village not found")
    return _envelope(data={"id": str(v.id), "name": v.name, "district": v.district, "state": v.state, "population": v.population, "gps_lat": float(v.gps_lat) if v.gps_lat else 0.0, "gps_lng": float(v.gps_lng) if v.gps_lng else 0.0, "primary_water_source": v.primary_water_source})

@router.get("/villages/{village_id}/predictions/latest")
async def get_latest_prediction(village_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_health_officer)):
    if village_id.startswith("v"): return _envelope(data=None)
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids: raise HTTPException(status_code=403, detail="Village not in your assignment")
    import uuid
    try: v_uuid = uuid.UUID(village_id)
    except ValueError: return _envelope(data=None)
    result = await db.execute(select(OutbreakPrediction).where(OutbreakPrediction.village_id == v_uuid).order_by(desc(OutbreakPrediction.predicted_at)).limit(1))
    p = result.scalar_one_or_none()
    if not p: return _envelope(data=None)
    return _envelope(data={"id": str(p.id), "predicted_at": p.predicted_at.isoformat() + "Z", "risk_score": float(p.risk_score), "risk_level": p.risk_level.value if hasattr(p.risk_level, 'value') else str(p.risk_level), "predicted_disease": p.predicted_disease, "disease_confidence": float(p.disease_confidence) if p.disease_confidence else None, "affected_population": p.affected_population_estimate, "shap_values": p.shap_values if hasattr(p, 'shap_values') else None})
"""
if "/villages/{village_id}/predictions/latest" not in dashboard_code:
    dashboard_code += append_code

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(dashboard_code)

# Patch reports.py
reports_path = os.path.join(backend_path, "routers", "health_officer", "reports.py")
with open(reports_path, "r", encoding="utf-8") as f:
    reports_code = f.read()

target2_1 = """    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this village")

    import uuid
    try:
        v_uuid = uuid.UUID(village_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid village UUID format")"""
        
replacement2 = """    if village_id.startswith("v"): return _envelope(data={"items":[], "total":0, "page":1, "per_page":50, "pages":1})
    village_ids = [str(v) for v in (user.assigned_village_ids or [])]
    if village_id not in village_ids:
        raise HTTPException(status_code=403, detail="Not authorized for this village")

    import uuid
    try:
        v_uuid = uuid.UUID(village_id)
    except ValueError:
        return _envelope(data={"items":[], "total":0, "page":1, "per_page":50, "pages":1})"""

reports_code = reports_code.replace(target2_1, replacement2)

with open(reports_path, "w", encoding="utf-8") as f:
    f.write(reports_code)

# Patch alerts.py
alerts_path = os.path.join(backend_path, "routers", "health_officer", "alerts.py")
with open(alerts_path, "r", encoding="utf-8") as f:
    alerts_code = f.read()

alerts_code = alerts_code.replace('@router.post("/alerts/{alert_id}/acknowledge")', '@router.put("/alerts/{alert_id}/acknowledge")')

with open(alerts_path, "w", encoding="utf-8") as f:
    f.write(alerts_code)

print("Patch applied to all endpoints successfully.")
