'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi, type SystemHealth } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';

export function SystemHealthPanel() {
    const { data, isLoading } = useQuery({
        queryKey: ['system', 'health'],
        queryFn: adminApi.getSystemHealth,
        staleTime: 15000,
        refetchInterval: 30000,
    });

    if (isLoading || !data) {
        return <div className="bg-surface border border-accent/30 rounded-xl p-6 h-48 animate-pulse" />;
    }

    const services = [
        { name: 'API Server', ...data.api_server },
        { name: 'Database', ...data.database },
        { name: 'Redis', ...data.redis },
        { name: 'Celery Workers', status: data.celery_workers.status, response_time_ms: 0, extra: `${data.celery_workers.active_workers} workers` },
        { name: 'WebSocket', status: data.websocket.status, response_time_ms: 0, extra: `${data.websocket.connections} connections` },
    ];

    return (
        <div className="bg-surface border border-accent/30 rounded-xl">
            <div className="px-4 py-3 border-b border-accent/20">
                <h3 className="text-sm font-semibold text-text-primary">System Health</h3>
            </div>
            <div className="p-4 space-y-3">
                {services.map((service) => {
                    const isHealthy = service.status === 'healthy' || service.status === 'ok' || service.status === 'connected';
                    return (
                        <div key={service.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full', isHealthy ? 'bg-teal' : 'bg-coral')} />
                                <span className="text-xs text-text-primary">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {service.response_time_ms > 0 && (
                                    <span className="text-[10px] font-mono text-text-muted">{service.response_time_ms}ms</span>
                                )}
                                {'extra' in service && service.extra && (
                                    <span className="text-[10px] text-text-secondary">{service.extra}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
