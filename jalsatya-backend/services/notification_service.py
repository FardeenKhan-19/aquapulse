from datetime import datetime
from typing import Optional, List, Dict, Any
from config import settings
from loguru import logger


class NotificationService:
    def __init__(self):
        self._twilio_client = None

    @property
    def twilio_client(self):
        if self._twilio_client is None:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            except Exception as e:
                logger.warning(f"Twilio client init failed: {e}")
        return self._twilio_client

    async def send_whatsapp(self, to_number: str, message: str) -> bool:
        try:
            if not self.twilio_client:
                logger.warning("Twilio client not available, skipping WhatsApp")
                return False

            msg = self.twilio_client.messages.create(
                from_=settings.TWILIO_WHATSAPP_FROM,
                body=message,
                to=f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number,
            )
            logger.info(f"WhatsApp sent to {to_number}: {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"WhatsApp send failed to {to_number}: {e}")
            return False

    async def send_sms(self, to_number: str, message: str) -> bool:
        try:
            if not self.twilio_client:
                logger.warning("Twilio client not available, skipping SMS")
                return False

            msg = self.twilio_client.messages.create(
                from_=settings.TWILIO_SMS_FROM,
                body=message,
                to=to_number,
            )
            logger.info(f"SMS sent to {to_number}: {msg.sid}")
            return True
        except Exception as e:
            logger.error(f"SMS send failed to {to_number}: {e}")
            return False

    async def send_critical_alert(self, phone: str, village_name: str, disease: str, population: int, case_no: str = ""):
        message = (
            f"⚠️ AQUAPULSE ALERT: {village_name} — CRITICAL risk. "
            f"{disease} likely. {population} at risk. "
            f"Do not use water. "
            f"{'Legal case filed: ' + case_no if case_no else 'Legal case being prepared.'}"
        )

        whatsapp_sent = await self.send_whatsapp(phone, message)
        if not whatsapp_sent:
            import asyncio
            await asyncio.sleep(120)
            await self.send_sms(phone, message)

    async def send_forensics_alert(self, phone: str, village_name: str, source: str, confidence: float):
        message = (
            f"🔬 Source identified: {source.replace('_', ' ').title()} in {village_name}. "
            f"Confidence: {confidence:.1f}%. Legal docs auto-filed."
        )
        await self.send_whatsapp(phone, message)

    async def send_legal_filed_alert(self, phone: str, village_name: str, case_no: str, s3_url: str = ""):
        message = (
            f"📋 CPCB complaint filed for {village_name}. "
            f"Case #: {case_no}. "
            f"{'Evidence: ' + s3_url if s3_url else ''}"
        )
        await self.send_whatsapp(phone, message)

    async def send_sensor_offline_alert(self, phone: str, sensor_name: str, village_name: str, duration: str):
        message = f"📡 Sensor {sensor_name} in {village_name} offline since {duration}."
        await self.send_whatsapp(phone, message)

    async def notify_legal_documents(self, village, documents):
        from sqlalchemy.ext.asyncio import AsyncSession
        logger.info(f"Legal document notifications queued for village {village.name}")

    async def send_daily_digest(self, phone: str, digest: str):
        message = f"📊 AquaPulse Daily Digest:\n{digest}"
        await self.send_whatsapp(phone, message)
