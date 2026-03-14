'use client';

import { useAllForensics } from '@/lib/hooks/useForensics';
import { PageHeader } from '@/components/layout/PageHeader';
import { ForensicsCard } from '@/components/forensics/ForensicsCard';

export default function ForensicsPage() {
    const { data, isLoading } = useAllForensics({ per_page: 20 });

    return (
        <div>
            <PageHeader title="Forensics" description="Contamination source analysis across your villages" />
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-surface animate-pulse rounded-xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(data?.items || []).map((r) => <ForensicsCard key={r.id} report={r} />)}
                    {(!data?.items || data.items.length === 0) && (
                        <div className="col-span-2 bg-surface border border-accent/30 rounded-xl p-8 text-center">
                            <p className="text-sm text-text-muted">No forensic reports available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
