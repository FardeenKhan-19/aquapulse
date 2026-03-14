'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, FlaskConical } from 'lucide-react';
import { predictionsApi } from '@/lib/api/predictions';
import type { OutbreakPrediction } from '@/lib/types/prediction';
import { RiskScoreGauge } from '@/components/dashboard/RiskScoreGauge';
import { riskColorMap } from '@/lib/utils/riskColors';

interface WhatIfSimulatorProps {
    villageId: string;
}

interface SimParams {
    [key: string]: number;
    tds_ppm: number;
    temperature_c: number;
    turbidity_ntu: number;
    ph: number;
    humidity_pct: number;
}

export function WhatIfSimulator({ villageId }: WhatIfSimulatorProps) {
    const [result, setResult] = useState<OutbreakPrediction | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const { register, handleSubmit } = useForm<SimParams>({
        defaultValues: { tds_ppm: 300, temperature_c: 25, turbidity_ntu: 5, ph: 7, humidity_pct: 60 },
    });

    const onSubmit = async (data: SimParams) => {
        setIsRunning(true);
        try {
            const prediction = await predictionsApi.whatIf(villageId, data);
            setResult(prediction);
        } catch {
            setResult(null);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-surface border border-accent/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4 text-purple" />
                <h3 className="text-sm font-semibold text-text-primary">What-If Simulator</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[
                    { name: 'tds_ppm' as const, label: 'TDS (ppm)', min: 0, max: 2000, step: 10 },
                    { name: 'temperature_c' as const, label: 'Temp (°C)', min: 0, max: 50, step: 0.5 },
                    { name: 'turbidity_ntu' as const, label: 'Turbidity (NTU)', min: 0, max: 100, step: 1 },
                    { name: 'ph' as const, label: 'pH', min: 0, max: 14, step: 0.1 },
                    { name: 'humidity_pct' as const, label: 'Humidity (%)', min: 0, max: 100, step: 1 },
                ].map((field) => (
                    <div key={field.name}>
                        <label className="text-[10px] text-text-muted uppercase">{field.label}</label>
                        <input
                            type="number"
                            {...register(field.name, { valueAsNumber: true })}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="w-full mt-1 px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50"
                        />
                    </div>
                ))}
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={isRunning}
                        className="w-full py-2 px-4 bg-purple hover:bg-purple/90 disabled:bg-purple/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                        {isRunning ? 'Running...' : 'Simulate'}
                    </button>
                </div>
            </form>

            {result && (
                <div className="border-t border-accent/20 pt-4 flex items-center gap-4">
                    <RiskScoreGauge score={result.risk_score} size={80} />
                    <div className="space-y-1">
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                            style={{ backgroundColor: `${riskColorMap[result.risk_level]}20`, color: riskColorMap[result.risk_level] }}
                        >
                            {result.risk_level}
                        </span>
                        {result.predicted_disease && (
                            <p className="text-xs text-text-secondary">Predicted: {result.predicted_disease}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
