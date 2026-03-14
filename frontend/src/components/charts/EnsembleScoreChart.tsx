'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface EnsembleScoreChartProps {
    data: Array<{
        time: string;
        xgboost: number;
        random_forest: number;
        gradient_boost: number;
    }>;
}

export function EnsembleScoreChart({ data }: EnsembleScoreChartProps) {
    const models = [
        { key: 'xgboost', color: '#00d4ff', label: 'XGBoost' },
        { key: 'random_forest', color: '#7f77dd', label: 'Random Forest' },
        { key: 'gradient_boost', color: '#1d9e75', label: 'Gradient Boost' },
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
                            <span className="font-mono font-bold" style={{ color: p.color }}>{p.value.toFixed(1)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                {models.map((m) => (
                    <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[2, 2, 0, 0]} barSize={12} animationDuration={300} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
