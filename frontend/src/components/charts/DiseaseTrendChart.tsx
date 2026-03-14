'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DiseaseTrendChartProps {
    data: Array<{
        date: string;
        cholera: number;
        typhoid: number;
        hepatitis_a: number;
        gastroenteritis: number;
    }>;
}

export function DiseaseTrendChart({ data }: DiseaseTrendChartProps) {
    const diseases = [
        { key: 'cholera', color: '#e24b4a', label: 'Cholera' },
        { key: 'typhoid', color: '#ef9f27', label: 'Typhoid' },
        { key: 'hepatitis_a', color: '#7f77dd', label: 'Hepatitis A' },
        { key: 'gastroenteritis', color: '#00d4ff', label: 'Gastroenteritis' },
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload) {
            return (
                <div className="bg-primary border border-accent/50 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-text-muted mb-2">{label}</p>
                    {payload.map((p: any) => (
                        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-text-secondary">{p.name}:</span>
                            <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                {diseases.map((d) => (
                    <Area
                        key={d.key}
                        type="monotone"
                        dataKey={d.key}
                        name={d.label}
                        stackId="1"
                        stroke={d.color}
                        fill={d.color}
                        fillOpacity={0.3}
                        animationDuration={300}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}
