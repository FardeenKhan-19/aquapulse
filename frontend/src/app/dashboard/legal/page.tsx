'use client';

import { useAllLegal } from '@/lib/hooks/useLegal';
import { PageHeader } from '@/components/layout/PageHeader';
import { LegalDocumentCard } from '@/components/legal/LegalDocumentCard';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const statuses = ['all', 'generated', 'filed', 'acknowledged', 'under_review', 'rejected'];

export default function LegalPage() {
    const [statusFilter, setStatusFilter] = useState('all');
    const { data, isLoading } = useAllLegal({
        per_page: 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
    });

    return (
        <div>
            <PageHeader title="Legal Documents" description="Track legal filings and document status" />
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {statuses.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn('px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors', statusFilter === s ? 'bg-cyan/20 text-cyan font-medium' : 'text-text-secondary hover:bg-accent/30')}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-surface animate-pulse rounded-xl" />)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(data?.items || []).map((doc) => <LegalDocumentCard key={doc.id} document={doc} />)}
                    {(!data?.items || data.items.length === 0) && (
                        <div className="col-span-2 bg-surface border border-accent/30 rounded-xl p-8 text-center">
                            <p className="text-sm text-text-muted">No legal documents found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
