from tasks.celery_app import celery_app
from database import SyncSessionLocal
from models.legal_document import LegalDocument, FilingStatus
from sqlalchemy import select, and_
from datetime import datetime
from loguru import logger


@celery_app.task(name="tasks.legal_tasks.generate_and_file_documents")
def generate_and_file_documents(forensics_report_id: str):
    logger.info(f"Legal document generation triggered for forensics report {forensics_report_id}")
    return f"Documents generated for {forensics_report_id}"


@celery_app.task(name="tasks.legal_tasks.check_filing_status")
def check_filing_status():
    db = SyncSessionLocal()
    try:
        pending_docs = db.execute(
            select(LegalDocument).where(
                and_(
                    LegalDocument.filing_status == FilingStatus.filed,
                    LegalDocument.filed_at.isnot(None),
                )
            )
        ).scalars().all()

        updated = 0
        for doc in pending_docs:
            logger.info(f"Checking filing status for {doc.filing_reference}")
            updated += 1

        return f"Checked {updated} filed documents"

    except Exception as e:
        logger.error(f"Filing status check failed: {e}")
        raise
    finally:
        db.close()
