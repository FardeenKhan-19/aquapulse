'use client';

import type { SensorNode } from '@/lib/types/sensor';
import { SensorStatusDot } from '@/components/dashboard/SensorStatusDot';
import { formatRelativeTime } from '@/lib/utils/formatters';
import Link from 'next/link';

interface SensorNodeCardProps {
    sensor: SensorNode;
}

export function SensorNodeCard({ sensor }: SensorNodeCardProps) {
    const isOnline = sensor.is_active && sensor.last_seen && (Date.now() - new Date(sensor.last_seen).getTime()) < 300000;

    return (
        <div className="bg-surface border border-accent/30 rounded-xl p-4 hover:border-cyan/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">{sensor.name}</h3>
                    <p className="text-xs text-text-muted font-mono">{sensor.hardware_id}</p>
                </div>
                <SensorStatusDot isOnline={!!isOnline} showLabel />
            </div>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-text-muted">Sensor Types</span>
                    <div className="flex gap-1">
                        {sensor.sensor_types.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-accent/20 text-text-secondary rounded text-[10px]">{t}</span>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-muted">Last Seen</span>
                    <span className="text-text-secondary">{sensor.last_seen ? formatRelativeTime(sensor.last_seen) : 'Never'}</span>
                </div>
                {sensor.battery_level !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-text-muted">Battery</span>
                        <span className={sensor.battery_level < 20 ? 'text-coral' : 'text-teal'}>{sensor.battery_level}%</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-text-muted">Approved</span>
                    <span className={sensor.is_approved ? 'text-teal' : 'text-amber'}>{sensor.is_approved ? 'Yes' : 'Pending'}</span>
                </div>
            </div>
            <Link
                href={`/admin/sensors/${sensor.id}`}
                className="mt-3 block text-center py-2 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors"
            >
                View Details
            </Link>
        </div>
    );
}
