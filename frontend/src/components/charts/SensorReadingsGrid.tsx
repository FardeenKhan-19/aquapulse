'use client';

import type { SensorReading } from '@/lib/types/sensor';
import { formatDateTime, formatTds, formatTemperature, formatPh, formatTurbidity } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

interface SensorReadingsGridProps {
    readings: SensorReading[];
}

export function SensorReadingsGrid({ readings }: SensorReadingsGridProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-accent/30">
                        <th className="text-left py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium sticky left-0 bg-surface">Time</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">TDS (ppm)</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">Temp (°C)</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">Turbidity</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">pH</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">Humidity</th>
                        <th className="text-right py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">Flow</th>
                        <th className="text-center py-1.5 px-2 text-[10px] sm:text-xs text-text-muted font-medium">Anomaly</th>
                    </tr>
                </thead>
                <tbody>
                    {readings.map((r) => (
                        <tr
                            key={r.id}
                            className={cn(
                                'border-b border-accent/10 hover:bg-accent/10 transition-colors',
                                r.is_anomaly && 'bg-amber/5'
                            )}
                        >
                            <td className="py-2 px-3 font-mono text-text-secondary sticky left-0 bg-surface whitespace-nowrap">
                                {formatDateTime(r.timestamp)}
                            </td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{formatTds(r.tds_ppm)}</td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{formatTemperature(r.temperature_c)}</td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{formatTurbidity(r.turbidity_ntu)}</td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{formatPh(r.ph)}</td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{r.humidity_pct !== null ? `${r.humidity_pct.toFixed(1)}%` : '--'}</td>
                            <td className="text-right py-2 px-3 font-mono text-text-primary">{r.flow_rate_lpm !== null ? `${r.flow_rate_lpm.toFixed(1)} L/m` : '--'}</td>
                            <td className="text-center py-2 px-3">
                                {r.is_anomaly ? (
                                    <span className="inline-block w-5 h-5 rounded-full bg-amber/20 text-amber text-[10px] leading-5 font-bold">!</span>
                                ) : (
                                    <span className="text-text-muted">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
