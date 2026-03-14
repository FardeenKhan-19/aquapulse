'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, Area, CartesianGrid } from 'recharts';
import { formatTime } from '@/lib/utils/formatters';
import type { SensorReading } from '@/lib/types/sensor';

interface TdsTimelineChartProps {
    readings: SensorReading[];
    baseline?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
}

export function TdsTimelineChart({ readings, baseline = 300, warningThreshold = 500, criticalThreshold = 800 }: TdsTimelineChartProps) {
    const data = readings
        .filter((r) => r.tds_ppm !== null)
        .map((r) => ({
            time: formatTime(r.timestamp),
            tds: r.tds_ppm,
            isAnomaly: r.is_anomaly,
            timestamp: r.timestamp,
        }))
        .reverse();

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (payload.isAnomaly) {
            return <circle cx={cx} cy={cy} r={4} fill="#e24b4a" stroke="#e24b4a" strokeWidth={2} />;
        }
        return null;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.[0]) {
            const data = payload[0].payload;
            const delta = data.tds - baseline;
            return (
                <div className="bg-primary border border-accent/50 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-text-muted">{data.time}</p>
                    <p className="text-sm font-mono font-bold text-cyan">{data.tds?.toFixed(0)} ppm</p>
                    <p className="text-xs text-text-secondary">
                        Δ baseline: <span className={delta > 0 ? 'text-coral' : 'text-teal'}>{delta > 0 ? '+' : ''}{delta.toFixed(0)}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                    <linearGradient id="tdsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={baseline} stroke="#475569" strokeDasharray="4 4" />
                <ReferenceLine y={warningThreshold} stroke="#ef9f27" strokeDasharray="4 4" />
                <ReferenceLine y={criticalThreshold} stroke="#e24b4a" strokeDasharray="4 4" />
                <Area dataKey="tds" fill="url(#tdsGradient)" stroke="none" />
                <Line type="monotone" dataKey="tds" stroke="#00d4ff" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 4, fill: '#00d4ff' }} animationDuration={300} />
            </LineChart>
        </ResponsiveContainer>
    );
}
