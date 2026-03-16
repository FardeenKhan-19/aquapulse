from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.forensics_report import ForensicsReport
from models.village import Village
from models.legal_document import LegalDocument, DocumentType, FilingStatus
from models.outbreak_prediction import OutbreakPrediction
from services.notification_service import NotificationService
from services.s3_service import S3Service
from config import settings
from loguru import logger
import google.generativeai as genai
import uuid

SOURCE_NAMES = {
    "industrial_effluent": "Industrial Effluent Discharge",
    "sewage_overflow": "Sewage/Drainage Overflow",
    "fertilizer_runoff": "Agricultural Fertilizer Runoff",
    "pipe_corrosion": "Water Pipe Corrosion/Degradation",
    "algal_bloom": "Algal Bloom (Eutrophication)",
    "natural_hardness": "Natural Mineral Hardness",
    "unknown": "Undetermined Source",
}


class LegalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        genai.configure(api_key=settings.GEMINI_API_KEY)

    @property
    def gemini_model(self):
        return genai.GenerativeModel(model_name=settings.GEMINI_MODEL)

    async def generate_legal_documents(
        self,
        forensics_report: ForensicsReport,
        village: Village,
        prediction: Optional[OutbreakPrediction] = None,
    ) -> List[LegalDocument]:
        context = self._build_context(forensics_report, village, prediction)
        documents = []

        health_alert = await self._generate_health_alert(context, forensics_report, village)
        documents.append(health_alert)

        legal_affidavit = await self._generate_legal_affidavit(context, forensics_report, village)
        documents.append(legal_affidavit)

        cpcb_complaint = await self._generate_cpcb_complaint(context, forensics_report, village)
        documents.append(cpcb_complaint)

        for doc in documents:
            self.db.add(doc)

        await self.db.commit()
        for doc in documents:
            await self.db.refresh(doc)

        try:
            notification_service = NotificationService()
            await notification_service.notify_legal_documents(village, documents)
        except Exception as e:
            logger.warning(f"Failed to send notifications: {e}")

        return documents

    def _build_context(
        self,
        report: ForensicsReport,
        village: Village,
        prediction: Optional[OutbreakPrediction],
    ) -> Dict[str, Any]:
        source_name = SOURCE_NAMES.get(
            report.contamination_source.value if hasattr(report.contamination_source, 'value') else str(report.contamination_source),
            "Unknown"
        )
        context = {
            "village_name": village.name,
            "district": village.district,
            "state": village.state,
            "population": village.population or 5000,
            "gps_lat": float(village.gps_lat) if village.gps_lat else 0,
            "gps_lng": float(village.gps_lng) if village.gps_lng else 0,
            "primary_water_source": village.primary_water_source or "Unknown",
            "contamination_source": source_name,
            "contamination_source_code": report.contamination_source.value if hasattr(report.contamination_source, 'value') else str(report.contamination_source),
            "source_confidence": float(report.source_confidence or 0) * 100,
            "contamination_start": report.contamination_start_timestamp.isoformat() if report.contamination_start_timestamp else "Unknown",
            "tds_baseline": float(report.tds_baseline or 0),
            "tds_peak": float(report.tds_peak or 0),
            "tds_rise_rate": float(report.tds_rise_rate or 0),
            "upstream_distance_km": float(report.upstream_distance_km or 0),
            "generated_at": report.generated_at.isoformat() if report.generated_at else datetime.utcnow().isoformat(),
        }

        if prediction:
            context.update({
                "predicted_disease": prediction.predicted_disease or "Waterborne illness",
                "risk_score": float(prediction.risk_score),
                "risk_level": prediction.risk_level.value if hasattr(prediction.risk_level, 'value') else str(prediction.risk_level),
                "affected_population": prediction.affected_population_estimate or 0,
                "onset_hours": float(prediction.onset_hours_estimate or 48),
            })
        else:
            context.update({
                "predicted_disease": "Waterborne illness",
                "risk_score": 75,
                "risk_level": "high",
                "affected_population": int((village.population or 5000) * 0.2),
                "onset_hours": 48,
            })

        return context

    async def _generate_health_alert(
        self, context: Dict, report: ForensicsReport, village: Village
    ) -> LegalDocument:
        prompt = f"""Generate a formal Government Health Alert document for the Chief Medical Officer (CMO) and Primary Health Centre (PHC) based on the following water contamination data.

VILLAGE DETAILS:
- Village: {context['village_name']}, District: {context['district']}, State: {context['state']}
- Population: {context['population']}
- GPS: {context['gps_lat']}, {context['gps_lng']}
- Primary Water Source: {context['primary_water_source']}

CONTAMINATION DATA:
- Source: {context['contamination_source']} (Confidence: {context['source_confidence']:.1f}%)
- Contamination detected at: {context['contamination_start']}
- TDS Baseline: {context['tds_baseline']:.1f} ppm → Peak: {context['tds_peak']:.1f} ppm
- Rise Rate: {context['tds_rise_rate']:.2f} ppm/min
- Estimated upstream distance: {context['upstream_distance_km']:.1f} km

DISEASE RISK:
- Predicted Disease: {context['predicted_disease']}
- Risk Score: {context['risk_score']:.1f}/100 ({context['risk_level']})
- Estimated affected population: {context['affected_population']}
- Estimated onset: {context['onset_hours']:.0f} hours

FORMAT REQUIREMENTS:
1. Use formal government health alert format with letterhead structure
2. Reference WHO disease protocol for {context['predicted_disease']}
3. Include recommended immediate interventions:
   - ORS distribution plan
   - Water boiling advisory
   - Alternate water source arrangement
   - Medical camp setup
4. Include contact numbers format section
5. Add date, reference number format
6. End with Marathi translation summary paragraph

Generate the complete document. Do not include any meta-commentary."""

        content, prompt_tokens, completion_tokens = await self._call_gemini(prompt)

        return LegalDocument(
            id=uuid.uuid4(),
            forensics_report_id=report.id,
            village_id=village.id,
            document_type=DocumentType.health_alert,
            generated_at=datetime.utcnow(),
            document_content=content,
            filing_status=FilingStatus.generated,
            recipient=f"CMO, {context['district']} & PHC, {context['village_name']}",
            claude_model_used=settings.GEMINI_MODEL,  # legacy column name
            prompt_tokens_used=prompt_tokens,
            completion_tokens_used=completion_tokens,
        )

    async def _generate_legal_affidavit(
        self, context: Dict, report: ForensicsReport, village: Village
    ) -> LegalDocument:
        prompt = f"""Generate a Legal Affidavit for filing with the Central Pollution Control Board (CPCB) / State Pollution Control Board based on water contamination evidence.

CASE DETAILS:
- Village: {context['village_name']}, District: {context['district']}, State: {context['state']}
- Population at Risk: {context['population']}
- GPS Coordinates: {context['gps_lat']}, {context['gps_lng']}

CONTAMINATION EVIDENCE:
- Identified Source: {context['contamination_source']} (AI Confidence: {context['source_confidence']:.1f}%)
- Detection Timestamp: {context['contamination_start']}
- Sensor Data: TDS rose from {context['tds_baseline']:.1f} ppm (baseline) to {context['tds_peak']:.1f} ppm (peak)
- Rate of contamination: {context['tds_rise_rate']:.2f} ppm/minute
- Estimated source distance: {context['upstream_distance_km']:.1f} km upstream

HEALTH IMPACT:
- Predicted Disease Outbreak: {context['predicted_disease']}
- AI Risk Assessment: {context['risk_score']:.1f}/100 ({context['risk_level']})
- Population at immediate risk: {context['affected_population']}

FORMAT REQUIREMENTS:
1. Legal affidavit format admissible under Indian Evidence Act, 1872
2. Structure matching CPCB complaint format
3. Sensor data reference as Annexure A
4. GPS evidence reference as Annexure B
5. Timeline reconstruction as Annexure C
6. Relief sought section including:
   - Immediate closure of contamination source
   - Compensation for affected population
   - Environmental remediation order
7. Legal provisions cited:
   - Water (Prevention and Control of Pollution) Act, 1974, Sections 24 & 25
   - Environment Protection Act, 1986, Sections 7 & 15
   - National Green Tribunal Act, 2010
   - Article 21, Constitution of India (Right to Clean Water)
8. Include verification section and oath format

Generate the complete legal affidavit. No meta-commentary."""

        content, prompt_tokens, completion_tokens = await self._call_gemini(prompt)
        ref_number = f"JS/CPCB/{datetime.utcnow().strftime('%Y%m%d')}/{str(uuid.uuid4())[:8].upper()}"

        return LegalDocument(
            id=uuid.uuid4(),
            forensics_report_id=report.id,
            village_id=village.id,
            document_type=DocumentType.legal_affidavit,
            generated_at=datetime.utcnow(),
            document_content=content,
            filing_status=FilingStatus.generated,
            filing_reference=ref_number,
            recipient=f"CPCB / {context['state']} PCB",
            claude_model_used=settings.GEMINI_MODEL,
            prompt_tokens_used=prompt_tokens,
            completion_tokens_used=completion_tokens,
        )

    async def _generate_cpcb_complaint(
        self, context: Dict, report: ForensicsReport, village: Village
    ) -> LegalDocument:
        prompt = f"""Generate a CPCB Online Complaint in structured format for the Central Pollution Control Board grievance portal.

COMPLAINANT: AquaPulse AI Monitoring System (Automated Filing)
LOCATION: {context['village_name']}, {context['district']}, {context['state']}
GPS: {context['gps_lat']}, {context['gps_lng']}

COMPLAINT CATEGORY: Water Pollution
POLLUTION TYPE: {context['contamination_source']}

DETAILS:
- Automated sensor network detected water contamination
- TDS levels rose from {context['tds_baseline']:.1f} to {context['tds_peak']:.1f} ppm
- Contamination source identified: {context['contamination_source']} (confidence: {context['source_confidence']:.1f}%)
- Estimated source location: {context['upstream_distance_km']:.1f} km upstream
- Disease risk: {context['predicted_disease']} ({context['risk_level']} risk)
- Population at risk: {context['affected_population']}

Generate in the format of a CPCB grievance portal submission with all required fields:
1. Complaint Type
2. State/District/Location
3. Nature of Pollution
4. Source of Pollution (if known)
5. Impact Assessment
6. Duration of Pollution
7. Previous Complaints (if any)
8. Evidence Summary
9. Relief Requested
10. Declaration

Also generate the equivalent JSON structure for API submission.

Generate the complete complaint. No meta-commentary."""

        content, prompt_tokens, completion_tokens = await self._call_gemini(prompt)
        ref_number = f"CPCB/GRV/{datetime.utcnow().strftime('%Y%m%d')}/{str(uuid.uuid4())[:8].upper()}"

        return LegalDocument(
            id=uuid.uuid4(),
            forensics_report_id=report.id,
            village_id=village.id,
            document_type=DocumentType.cpcb_complaint,
            generated_at=datetime.utcnow(),
            document_content=content,
            filing_status=FilingStatus.generated,
            filing_reference=ref_number,
            recipient="CPCB Grievance Portal",
            claude_model_used=settings.GEMINI_MODEL,
            prompt_tokens_used=prompt_tokens,
            completion_tokens_used=completion_tokens,
        )

    async def _call_gemini(self, prompt: str):
        try:
            response = self.gemini_model.generate_content(prompt)
            content = response.text
            
            prompt_tokens = 0
            completion_tokens = 0
            if hasattr(response, 'usage_metadata'):
                prompt_tokens = response.usage_metadata.prompt_token_count
                completion_tokens = response.usage_metadata.candidates_token_count

            return content, prompt_tokens, completion_tokens
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")
            fallback = f"[Document generation failed. Error: {str(e)}. Manual generation required.]"
            return fallback, 0, 0

    async def get_documents_for_village(self, village_id, limit: int = 50) -> List[LegalDocument]:
        result = await self.db.execute(
            select(LegalDocument)
            .where(LegalDocument.village_id == village_id)
            .order_by(LegalDocument.generated_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def get_document_by_id(self, doc_id) -> Optional[LegalDocument]:
        result = await self.db.execute(
            select(LegalDocument).where(LegalDocument.id == doc_id)
        )
        return result.scalar_one_or_none()
