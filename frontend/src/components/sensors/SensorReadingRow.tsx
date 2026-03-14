'use client';

import type { SensorReading } from '@/lib/types/sensor';
import { formatDateTime, formatTds } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

interface SensorReadingRowProps {
    reading: SensorReading;
}

export function SensorReadingRow({ reading }: SensorReadingRowProps) {
    return (
        <div className={cn('flex items-center gap-4 px-4 py-2 text-xs border-b border-accent/10', reading.is_anomaly && 'bg-amber/5')}>
            <span className="font-mono text-text-muted w-36 shrink-0">{formatDateTime(reading.timestamp)}</span>
            <span className="font-mono text-text-primary w-20 text-right">{formatTds(reading.tds_ppm)}</span>
            <span className="font-mono text-text-primary w-16 text-right">{reading.temperature_c?.toFixed(1) ?? '--'}°C</span>
            <span className="font-mono text-text-primary w-16 text-right">{reading.ph?.toFixed(2) ?? '--'}</span>
            {reading.is_anomaly && <span className="text-amber text-[10px] font-bold">ANOMALY</span>}
        </div>
    );
}
