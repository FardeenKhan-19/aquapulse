from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func, update
from models.alert import Alert, AlertType, AlertSeverity
from models.village import Village
from models.outbreak_prediction import OutbreakPrediction
from models.forensics_report import ForensicsReport
from models.sensor_node import SensorNode
from models.user import User, UserRole
from core.websocket_manager import ws_manager
from loguru import logger
import uuid


class AlertService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(
        self,
        village_id,
        alert_type: AlertType,
        severity: AlertSeverity,
        message: str,
        prediction_id=None,
        forensics_id=None,
        sensor_id=None,
    ) -> Alert:
        alert = Alert(
            id=uuid.uuid4(),
            village_id=village_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            related_prediction_id=prediction_id,
            related_forensics_id=forensics_id,
            related_sensor_id=sensor_id,
            is_acknowledged=False,
            created_at=datetime.utcnow(),
        )
        self.db.add(alert)
        await self.db.commit()
        await self.db.refresh(alert)

        await ws_manager.broadcast_alert(
            alert_id=str(alert.id),
            village_id=str(village_id),
            severity=severity.value,
            message_text=message,
        )

        logger.info(f"Alert created: [{severity.value}] {alert_type.value} for village {village_id}")
        return alert

    async def create_outbreak_alert(self, prediction: OutbreakPrediction, village: Village) -> Optional[Alert]:
        risk_level = prediction.risk_level.value if hasattr(prediction.risk_level, 'value') else str(prediction.risk_level)

        severity_map = {
            "critical": AlertSeverity.critical,
            "high": AlertSeverity.high,
            "medium": AlertSeverity.medium,
            "low": AlertSeverity.low,
            "baseline": AlertSeverity.info,
        }
        severity = severity_map.get(risk_level, AlertSeverity.info)

        if risk_level in ("baseline", "low"):
            return None

        disease = prediction.predicted_disease or "waterborne illness"
        pop = prediction.affected_population_estimate or 0
        score = float(prediction.risk_score)

        message = (
            f"⚠️ OUTBREAK RISK: {village.name} — {risk_level.upper()} risk ({score:.1f}/100). "
            f"{disease} likely. ~{pop} people at risk. "
            f"Onset estimated in {float(prediction.onset_hours_estimate or 48):.0f} hours."
        )

        return await self.create_alert(
            village_id=village.id,
            alert_type=AlertType.outbreak_risk,
            severity=severity,
            message=message,
            prediction_id=prediction.id,
        )

    async def create_contamination_alert(self, forensics: ForensicsReport, village: Village) -> Alert:
        source = forensics.contamination_source.value if hasattr(forensics.contamination_source, 'value') else str(forensics.contamination_source)
        confidence = float(forensics.source_confidence or 0) * 100

        message = (
            f"🔬 CONTAMINATION DETECTED: {village.name} — Source: {source.replace('_', ' ').title()} "
            f"(confidence: {confidence:.1f}%). TDS peaked at {float(forensics.tds_peak or 0):.0f} ppm "
            f"(baseline: {float(forensics.tds_baseline or 0):.0f} ppm)."
        )

        return await self.create_alert(
            village_id=village.id,
            alert_type=AlertType.contamination_detected,
            severity=AlertSeverity.high,
            message=message,
            forensics_id=forensics.id,
        )

    async def create_sensor_offline_alert(self, sensor: SensorNode, village: Village) -> Alert:
        last_seen_str = sensor.last_seen.isoformat() if sensor.last_seen else "never"
        message = (
            f"📡 SENSOR OFFLINE: {sensor.name} in {village.name} "
            f"has been offline since {last_seen_str}."
        )

        return await self.create_alert(
            village_id=village.id,
            alert_type=AlertType.sensor_offline,
            severity=AlertSeverity.medium,
            message=message,
            sensor_id=sensor.id,
        )

    async def create_legal_filed_alert(self, village: Village, filing_reference: str) -> Alert:
        message = (
            f"📋 LEGAL CASE FILED: CPCB complaint filed for {village.name}. "
            f"Case reference: {filing_reference}."
        )

        return await self.create_alert(
            village_id=village.id,
            alert_type=AlertType.legal_filed,
            severity=AlertSeverity.info,
            message=message,
        )

    async def acknowledge_alert(self, alert_id, user_id) -> Optional[Alert]:
        result = await self.db.execute(select(Alert).where(Alert.id == alert_id))
        alert = result.scalar_one_or_none()
        if not alert:
            return None

        alert.is_acknowledged = True
        alert.acknowledged_by = user_id
        alert.acknowledged_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def get_active_alerts(
        self, village_ids: Optional[List] = None, limit: int = 100
    ) -> List[Alert]:
        query = select(Alert).where(Alert.is_acknowledged == False)
        if village_ids:
            query = query.where(Alert.village_id.in_(village_ids))
        query = query.order_by(desc(Alert.created_at)).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_alert_history(
        self, village_ids: Optional[List] = None, days: int = 30, limit: int = 200
    ) -> List[Alert]:
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = select(Alert).where(Alert.created_at >= cutoff)
        if village_ids:
            query = query.where(Alert.village_id.in_(village_ids))
        query = query.order_by(desc(Alert.created_at)).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()
