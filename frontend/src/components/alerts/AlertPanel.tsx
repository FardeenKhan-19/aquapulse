'use client';

import { useAlerts, useAcknowledgeAlert } from '@/lib/hooks/useAlerts';
import { AlertItem } from './AlertItem';
import { AlertFilters } from './AlertFilters';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function AlertPanel() {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const { data, isLoading, error } = useAlerts(filters as any);
    const acknowledgeMutation = useAcknowledgeAlert();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-4 text-center">
                <p className="text-sm text-coral">Failed to load alerts</p>
            </div>
        );
    }

    const alerts = data?.items || [];

    return (
        <div className="space-y-4">
            <AlertFilters filters={filters} onFiltersChange={setFilters} />
            {alerts.length === 0 ? (
                <div className="bg-surface border border-accent/30 rounded-xl p-8 text-center">
                    <p className="text-sm text-text-muted">No alerts found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {alerts.map((alert) => (
                        <AlertItem
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={() => acknowledgeMutation.mutate(alert.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
