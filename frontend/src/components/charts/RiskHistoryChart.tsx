'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceArea } from 'recharts';

interface RiskHistoryChartProps {
    data: Array<{ date: string; risk_score: number }>;
}

export function RiskHistoryChart({ data }: RiskHistoryChartProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.[0]) {
            const score = payload[0].value;
            return (
                <div className="bg-primary border border-accent/50 rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="text-sm font-mono font-bold text-cyan">{score.toFixed(1)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e24b4a" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#ef9f27" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1d9e75" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <ReferenceArea y1={75} y2={100} fill="#e24b4a" fillOpacity={0.05} />
                <ReferenceArea y1={55} y2={75} fill="#d85a30" fillOpacity={0.05} />
                <ReferenceArea y1={30} y2={55} fill="#ef9f27" fillOpacity={0.05} />
                <ReferenceArea y1={0} y2={30} fill="#1d9e75" fillOpacity={0.05} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="risk_score" stroke="#00d4ff" strokeWidth={2} fill="url(#riskGradient)" animationDuration={300} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
