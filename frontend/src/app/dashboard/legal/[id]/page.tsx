'use client';

import { useParams } from 'next/navigation';
import { useLegalDocument } from '@/lib/hooks/useLegal';
import { PageHeader } from '@/components/layout/PageHeader';
import { LegalDocumentCard } from '@/components/legal/LegalDocumentCard';
import { DocumentViewer } from '@/components/legal/DocumentViewer';

export default function LegalDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: doc, isLoading } = useLegalDocument(id);

    if (isLoading || !doc) {
        return <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Legal Document" description={doc.filing_reference ? `Case #${doc.filing_reference}` : `ID: ${doc.id}`} />
            <LegalDocumentCard document={doc} />
            <DocumentViewer document={doc} />
        </div>
    );
}
