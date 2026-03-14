'use client';

import { useParams } from 'next/navigation';
import { useVillage } from '@/lib/hooks/useVillages';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDateTime } from '@/lib/utils/formatters';

export default function AdminVillageDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: village, isLoading } = useVillage(id);

    if (isLoading || !village) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title={village.name} description={`${village.district}, ${village.state}`} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Village Information</h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-text-muted">GPS</span><span className="text-text-primary font-mono">{village.gps_lat.toFixed(4)}, {village.gps_lng.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Population</span><span className="text-text-primary font-mono">{village.population.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Water Source</span><span className="text-text-primary">{village.primary_water_source}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Officers Assigned</span><span className="font-mono">{village.assigned_health_officer_ids.length}</span></div>
                    </div>
                </div>
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Risk Thresholds</h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-text-muted">Low</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded bg-accent/20 overflow-hidden"><div className="h-full bg-green-500 rounded" style={{ width: `${village.risk_threshold_low}%` }} /></div>
                                <span className="font-mono text-text-primary w-8 text-right">{village.risk_threshold_low}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-muted">Medium</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded bg-accent/20 overflow-hidden"><div className="h-full bg-amber rounded" style={{ width: `${village.risk_threshold_medium}%` }} /></div>
                                <span className="font-mono text-text-primary w-8 text-right">{village.risk_threshold_medium}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-muted">High</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded bg-accent/20 overflow-hidden"><div className="h-full bg-orange-500 rounded" style={{ width: `${village.risk_threshold_high}%` }} /></div>
                                <span className="font-mono text-text-primary w-8 text-right">{village.risk_threshold_high}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-muted">Critical</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-2 rounded bg-accent/20 overflow-hidden"><div className="h-full bg-coral rounded" style={{ width: `${village.risk_threshold_critical}%` }} /></div>
                                <span className="font-mono text-text-primary w-8 text-right">{village.risk_threshold_critical}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
