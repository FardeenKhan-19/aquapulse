'use client';

import { motion } from 'framer-motion';
import type { ForensicsReport, ContaminationSource } from '@/lib/types/forensics';
import { sourceColorMap } from '@/lib/utils/riskColors';
import { formatRelativeTime, formatTds, humanizeSnakeCase } from '@/lib/utils/formatters';
import { Factory, Droplets, Leaf, Wrench, Waves, Mountain, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const sourceIcons: Record<ContaminationSource, React.ElementType> = {
    industrial_effluent: Factory,
    sewage_overflow: Droplets,
    fertilizer_runoff: Leaf,
    pipe_corrosion: Wrench,
    algal_bloom: Waves,
    natural_hardness: Mountain,
    unknown: HelpCircle,
};

interface ForensicsCardProps {
    report: ForensicsReport;
    villageName?: string;
    showLink?: boolean;
}

export function ForensicsCard({ report, villageName, showLink = true }: ForensicsCardProps) {
    const Icon = sourceIcons[report.contamination_source] || HelpCircle;
    const color = sourceColorMap[report.contamination_source] || '#94a3b8';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-accent/30 rounded-xl p-5 hover:border-purple/30 transition-colors"
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">
                            {humanizeSnakeCase(report.contamination_source)}
                        </h3>
                        <span className="text-xs font-mono font-bold" style={{ color }}>
                            {(report.source_confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                    {villageName && <p className="text-xs text-text-muted mt-0.5">{villageName}</p>}
                </div>
            </div>

            <div className="mt-4">
                <SourceConfidenceBarInline confidence={report.source_confidence} color={color} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
                <MetricItem label="Start" value={formatRelativeTime(report.contamination_start_timestamp)} />
                <MetricItem label="Peak TDS" value={formatTds(report.tds_peak)} />
                <MetricItem label="Distance" value={report.upstream_distance_km ? `${report.upstream_distance_km.toFixed(1)} km` : '--'} />
            </div>

            {report.pattern_signature && Object.keys(report.pattern_signature).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.keys(report.pattern_signature).slice(0, 5).map((key) => (
                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded bg-purple/10 text-purple text-[10px] font-medium">
                            {humanizeSnakeCase(key)}
                        </span>
                    ))}
                </div>
            )}

            {showLink && (
                <Link
                    href={`/dashboard/forensics/${report.id}`}
                    className="mt-4 block text-center py-2 text-xs font-medium text-purple hover:text-purple/80 bg-purple/10 hover:bg-purple/20 rounded-lg transition-colors"
                >
                    View Full Report
                </Link>
            )}
        </motion.div>
    );
}

function SourceConfidenceBarInline({ confidence, color }: { confidence: number; color: string }) {
    return (
        <div className="w-full h-2 rounded-full bg-accent/30 overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
            />
        </div>
    );
}

function MetricItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] text-text-muted uppercase">{label}</p>
            <p className="text-xs font-mono font-medium text-text-primary mt-0.5">{value}</p>
        </div>
    );
}
