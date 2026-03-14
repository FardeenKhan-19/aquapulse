from tasks.celery_app import celery_app
from database import SyncSessionLocal
from models.user import User, UserRole
from models.village import Village
from models.alert import Alert
from models.outbreak_prediction import OutbreakPrediction
from sqlalchemy import select, and_, func, desc
from datetime import datetime, timedelta
from loguru import logger


@celery_app.task(name="tasks.alert_tasks.process_new_alert")
def process_new_alert(alert_id: str):
    db = SyncSessionLocal()
    try:
        alert = db.execute(select(Alert).where(Alert.id == alert_id)).scalar_one_or_none()
        if not alert:
            return "Alert not found"

        village = db.execute(select(Village).where(Village.id == alert.village_id)).scalar_one_or_none()
        if not village:
            return "Village not found"

        officer_ids = village.assigned_health_officer_ids or []
        if officer_ids:
            officers = db.execute(
                select(User).where(and_(User.id.in_(officer_ids), User.is_active == True))
            ).scalars().all()

            for officer in officers:
                if officer.phone:
                    logger.info(f"Would send alert to {officer.full_name} ({officer.phone}): {alert.message}")

        return f"Alert processed, notified {len(officer_ids)} officers"

    except Exception as e:
        logger.error(f"Alert processing failed: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.alert_tasks.send_daily_digest")
def send_daily_digest():
    db = SyncSessionLocal()
    try:
        officers = db.execute(
            select(User).where(and_(User.role == UserRole.health_officer, User.is_active == True))
        ).scalars().all()

        for officer in officers:
            village_ids = officer.assigned_village_ids or []
            if not village_ids:
                continue

            villages = db.execute(
                select(Village).where(Village.id.in_(village_ids))
            ).scalars().all()

            digest_parts = [f"Good morning {officer.full_name},", "", "Village Risk Summary:"]

            for village in villages:
                pred = db.execute(
                    select(OutbreakPrediction)
                    .where(OutbreakPrediction.village_id == village.id)
                    .order_by(desc(OutbreakPrediction.predicted_at))
                    .limit(1)
                ).scalar_one_or_none()

                risk_text = "baseline"
                if pred:
                    risk_text = f"{pred.risk_level.value if hasattr(pred.risk_level, 'value') else str(pred.risk_level)} ({float(pred.risk_score):.0f}/100)"

                digest_parts.append(f"• {village.name}: {risk_text}")

            active_alerts = db.execute(
                select(func.count(Alert.id)).where(
                    and_(Alert.village_id.in_(village_ids), Alert.is_acknowledged == False)
                )
            ).scalar() or 0

            digest_parts.extend(["", f"Active alerts: {active_alerts}", "", "Stay vigilant. — AquaPulse AI"])
            digest = "\n".join(digest_parts)

            if officer.phone:
                logger.info(f"Daily digest for {officer.full_name}: {len(digest)} chars")

        return f"Digests sent to {len(officers)} officers"

    except Exception as e:
        logger.error(f"Daily digest failed: {e}")
        raise
    finally:
        db.close()
