export type DocumentType = 'health_alert' | 'legal_affidavit' | 'cpcb_complaint';
export type FilingStatus = 'generated' | 'filed' | 'acknowledged' | 'rejected' | 'under_review';

export interface LegalDocument {
    id: string;
    forensics_report_id: string;
    village_id: string;
    document_type: DocumentType;
    generated_at: string;
    document_content: string;
    document_pdf_s3_key: string;
    filing_status: FilingStatus;
    filed_at: string | null;
    filing_reference: string | null;
}
