'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';

interface ShapExplanationProps {
    shapValues: Record<string, number>;
    prediction?: string;
}

const featureLabels: Record<string, string> = {
    tds_ppm: 'Water TDS Level',
    temperature_c: 'Temperature',
    turbidity_ntu: 'Turbidity',
    ph: 'pH Level',
    humidity_pct: 'Humidity',
    flow_rate_lpm: 'Flow Rate',
    population: 'Population',
    rainfall_mm: 'Rainfall',
    season: 'Season',
    water_source: 'Water Source',
    prev_outbreaks: 'Previous Outbreaks',
    sanitation_score: 'Sanitation Score',
};

export function ShapExplanation({ shapValues, prediction }: ShapExplanationProps) {
    const data = Object.entries(shapValues)
        .map(([feature, value]) => ({
            feature: featureLabels[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value,
            isPositive: value > 0,
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload?.[0]) {
            const d = payload[0].payload;
            return (
                <div className="bg-primary border border-accent/50 rounded-lg p-3 shadow-xl">
                    <p className="text-xs font-medium text-text-primary">{d.feature}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        Contribution: <span className={d.isPositive ? 'text-coral' : 'text-teal'}>
                            {d.value > 0 ? '+' : ''}{d.value.toFixed(3)}
                        </span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                        {d.isPositive ? '↑ Increases risk' : '↓ Decreases risk'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-surface border border-accent/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Why This Prediction Was Made</h3>
            <p className="text-xs text-text-muted mb-4">SHAP feature importance analysis</p>
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 120 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fill: '#e2e8f0', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16} animationDuration={300}>
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.isPositive ? '#e24b4a' : '#1d9e75'} fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
