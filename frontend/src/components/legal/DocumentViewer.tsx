'use client';

import type { LegalDocument } from '@/lib/types/legal';

interface DocumentViewerProps {
    document: LegalDocument;
}

export function DocumentViewer({ document: doc }: DocumentViewerProps) {
    return (
        <div className="bg-surface border border-accent/30 rounded-xl">
            <div className="p-4 border-b border-accent/20">
                <h3 className="text-sm font-semibold text-text-primary">Document Content</h3>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">
                    {doc.document_content}
                </div>
            </div>
        </div>
    );
}
