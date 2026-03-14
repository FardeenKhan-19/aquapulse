'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { PageHeader } from '@/components/layout/PageHeader';
import { SensorStatusDot } from '@/components/dashboard/SensorStatusDot';
import { SensorReadingRow } from '@/components/sensors/SensorReadingRow';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters';

export default function SensorDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: sensor, isLoading } = useQuery({ queryKey: ['admin', 'sensors', id], queryFn: () => sensorsApi.getById(id), enabled: !!id });
    const { data: readings } = useQuery({ queryKey: ['admin', 'sensors', id, 'readings'], queryFn: () => sensorsApi.getReadings(id, { limit: 50 }), enabled: !!id });

    if (isLoading || !sensor) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    const isOnline = sensor.is_active && sensor.last_seen && (Date.now() - new Date(sensor.last_seen).getTime()) < 300000;

    return (
        <div className="space-y-6">
            <PageHeader title={sensor.name} description={`Hardware ID: ${sensor.hardware_id}`}>
                <SensorStatusDot isOnline={!!isOnline} showLabel />
            </PageHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Sensor Info</h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-text-muted">Location</span><span className="text-text-primary font-mono">{sensor.gps_lat.toFixed(4)}, {sensor.gps_lng.toFixed(4)}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Types</span><span className="text-text-primary">{sensor.sensor_types.join(', ')}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Approved</span><span className={sensor.is_approved ? 'text-teal' : 'text-amber'}>{sensor.is_approved ? 'Yes' : 'Pending'}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Last Seen</span><span className="text-text-secondary">{sensor.last_seen ? formatRelativeTime(sensor.last_seen) : 'Never'}</span></div>
                        {sensor.deployment_date && <div className="flex justify-between"><span className="text-text-muted">Deployed</span><span className="text-text-secondary">{formatDateTime(sensor.deployment_date)}</span></div>}
                    </div>
                </div>
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Calibration Data</h3>
                    <pre className="text-xs font-mono text-text-secondary bg-primary rounded-lg p-3 overflow-x-auto max-h-48">{JSON.stringify(sensor.calibration_data, null, 2)}</pre>
                </div>
            </div>

            {readings && readings.length > 0 && (
                <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-accent/20">
                        <h3 className="text-sm font-semibold text-text-primary">Recent Readings ({readings.length})</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                        {readings.map((r) => <SensorReadingRow key={r.id} reading={r} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
