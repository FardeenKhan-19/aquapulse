'use client';

import { motion } from 'framer-motion';
import type { LegalDocument, DocumentType, FilingStatus } from '@/lib/types/legal';
import { formatDate, formatRelativeTime } from '@/lib/utils/formatters';
import { FilingStatusBadge } from './FilingStatusBadge';
import { FileText, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { legalApi } from '@/lib/api/legal';
import Link from 'next/link';

const docTypeColors: Record<DocumentType, string> = {
    health_alert: '#00d4ff',
    legal_affidavit: '#7f77dd',
    cpcb_complaint: '#e24b4a',
};

const docTypeLabels: Record<DocumentType, string> = {
    health_alert: 'Health Alert',
    legal_affidavit: 'Legal Affidavit',
    cpcb_complaint: 'CPCB Complaint',
};

interface LegalDocumentCardProps {
    document: LegalDocument;
    villageName?: string;
}

export function LegalDocumentCard({ document: doc, villageName }: LegalDocumentCardProps) {
    const [downloading, setDownloading] = useState(false);
    const [copied, setCopied] = useState(false);
    const color = docTypeColors[doc.document_type];

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const url = await legalApi.downloadPdf(doc.id);
            window.open(url as string, '_blank');
        } catch {
            // Handle error
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyRef = () => {
        if (doc.filing_reference) {
            navigator.clipboard.writeText(doc.filing_reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-accent/30 rounded-xl p-4 hover:border-purple/20 transition-colors"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                        <FileText className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                        <span
                            className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${color}20`, color }}
                        >
                            {docTypeLabels[doc.document_type]}
                        </span>
                        {villageName && <p className="text-xs text-text-muted mt-1">{villageName}</p>}
                    </div>
                </div>
                <FilingStatusBadge status={doc.filing_status} />
            </div>

            {doc.filing_reference && (
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-text-muted">Case #</span>
                    <code className="text-xs font-mono text-text-primary bg-accent/20 px-2 py-0.5 rounded">{doc.filing_reference}</code>
                    <button onClick={handleCopyRef} className="p-1 text-text-muted hover:text-text-primary transition-colors">
                        {copied ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span>Generated {formatDate(doc.generated_at)}</span>
                {doc.filed_at && <span>Filed {formatRelativeTime(doc.filed_at)}</span>}
            </div>

            <div className="mt-3 flex gap-2">
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-purple bg-purple/10 hover:bg-purple/20 rounded-lg transition-colors"
                >
                    <Download className="w-3 h-3" />
                    {downloading ? 'Loading...' : 'Download PDF'}
                </button>
                <Link
                    href={`/dashboard/legal/${doc.id}`}
                    className="flex-1 flex items-center justify-center py-2 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors"
                >
                    View Detail
                </Link>
            </div>
        </motion.div>
    );
}
