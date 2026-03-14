'use client';

import type { OutbreakPrediction } from '@/lib/types/prediction';
import { RiskScoreGauge } from '@/components/dashboard/RiskScoreGauge';
import { riskColorMap } from '@/lib/utils/riskColors';
import { formatRelativeTime, humanizeSnakeCase } from '@/lib/utils/formatters';

interface PredictionPanelProps {
    prediction: OutbreakPrediction;
}

export function PredictionPanel({ prediction }: PredictionPanelProps) {
    return (
        <div className="bg-surface border border-accent/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Latest Prediction</h3>
            <div className="flex items-center gap-6">
                <RiskScoreGauge score={prediction.risk_score} size={120} />
                <div className="space-y-3 flex-1">
                    <div>
                        <p className="text-xs text-text-muted">Risk Level</p>
                        <span
                            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold uppercase mt-1"
                            style={{ backgroundColor: `${riskColorMap[prediction.risk_level]}20`, color: riskColorMap[prediction.risk_level] }}
                        >
                            {prediction.risk_level}
                        </span>
                    </div>
                    {prediction.predicted_disease && (
                        <div>
                            <p className="text-xs text-text-muted">Predicted Disease</p>
                            <p className="text-sm font-medium text-text-primary mt-0.5">
                                {humanizeSnakeCase(prediction.predicted_disease)}
                                {prediction.disease_confidence && (
                                    <span className="ml-2 text-xs text-text-secondary">({(prediction.disease_confidence * 100).toFixed(0)}%)</span>
                                )}
                            </p>
                        </div>
                    )}
                    {prediction.affected_population_estimate && (
                        <div>
                            <p className="text-xs text-text-muted">Affected Population Est.</p>
                            <p className="text-sm font-mono font-medium text-text-primary mt-0.5">{prediction.affected_population_estimate.toLocaleString()}</p>
                        </div>
                    )}
                    {prediction.onset_hours_estimate && (
                        <div>
                            <p className="text-xs text-text-muted">Estimated Onset</p>
                            <p className="text-sm font-mono font-medium text-amber mt-0.5">{prediction.onset_hours_estimate}h</p>
                        </div>
                    )}
                    <p className="text-[10px] text-text-muted">Model v{prediction.model_version} · {formatRelativeTime(prediction.predicted_at)}</p>
                </div>
            </div>
        </div>
    );
}
