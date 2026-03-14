'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { riskColorMap, getRiskLevel } from '@/lib/utils/riskColors';
import { formatRelativeTime } from '@/lib/utils/formatters';
import Link from 'next/link';
import type { Village } from '@/lib/types/village';
import { useLatestPrediction } from '@/lib/hooks/usePredictions';
import { useWsStore } from '@/lib/stores/wsStore';
import { RiskScoreGauge } from './RiskScoreGauge';
import { AlertBadge } from './AlertBadge';
import { MapPin, Droplets, Users } from 'lucide-react';

interface VillageRiskCardProps {
    village: Village;
    alertCount?: number;
    showActions?: boolean;
    compact?: boolean;
}

export function VillageRiskCard({ village, alertCount = 0, showActions = true, compact = false }: VillageRiskCardProps) {
    const { data: prediction } = useLatestPrediction(village.id);
    const latestReading = useWsStore((s) => s.latestReadings[village.id]);
    const riskScore = prediction?.risk_score ?? 0;
    const riskLevel = prediction?.risk_level ?? getRiskLevel(riskScore);

    const tdsReadings = latestReading ? [latestReading.tds_ppm ?? 0] : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'bg-surface border border-accent/30 rounded-xl p-4 hover:border-cyan/30 transition-all group',
                riskScore > 75 && 'border-coral/40 shadow-lg shadow-coral/5'
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary truncate">{village.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">{village.district}</span>
                    </div>
                </div>
                {alertCount > 0 && <AlertBadge count={alertCount} />}
            </div>

            {!compact && (
                <div className="flex items-center gap-4 mb-3">
                    <RiskScoreGauge score={riskScore} size={80} />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
                                style={{ backgroundColor: `${riskColorMap[riskLevel]}20`, color: riskColorMap[riskLevel] }}
                            >
                                {riskLevel}
                            </span>
                        </div>
                        {prediction?.predicted_disease && (
                            <p className="text-xs text-text-secondary">
                                <span className="text-text-muted">Predicted: </span>
                                {prediction.predicted_disease}
                            </p>
                        )}
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-text-muted" />
                            <span className="text-xs text-text-muted">{village.population.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {latestReading && (
                <div className="flex items-center gap-2 text-xs border-t border-accent/20 pt-2 mt-2">
                    <Droplets className="w-3 h-3 text-cyan" />
                    <span className="font-mono text-text-secondary">{latestReading.tds_ppm?.toFixed(0) ?? '--'} ppm</span>
                    <span className="text-text-muted ml-auto">{formatRelativeTime(latestReading.timestamp)}</span>
                </div>
            )}

            {showActions && (
                <Link
                    href={`/dashboard/villages/${village.id}`}
                    className="mt-3 block w-full text-center py-2 text-xs font-medium text-cyan hover:text-cyan/80 bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors"
                >
                    View Details
                </Link>
            )}
        </motion.div>
    );
}
