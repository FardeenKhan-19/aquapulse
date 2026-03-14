import type { RiskLevel } from '@/lib/types/prediction';
import type { ContaminationSource } from '@/lib/types/forensics';

export const riskColorMap: Record<RiskLevel, string> = {
    baseline: '#1d9e75',
    low: '#639922',
    medium: '#ef9f27',
    high: '#d85a30',
    critical: '#e24b4a',
};

export const riskBgMap: Record<RiskLevel, string> = {
    baseline: 'bg-teal/20 text-teal',
    low: 'bg-green-600/20 text-green-400',
    medium: 'bg-amber/20 text-amber',
    high: 'bg-orange-600/20 text-orange-400',
    critical: 'bg-coral/20 text-coral',
};

export const riskBorderMap: Record<RiskLevel, string> = {
    baseline: 'border-teal',
    low: 'border-green-500',
    medium: 'border-amber',
    high: 'border-orange-500',
    critical: 'border-coral',
};

export function getRiskLevel(score: number): RiskLevel {
    if (score >= 75) return 'critical';
    if (score >= 55) return 'high';
    if (score >= 30) return 'medium';
    if (score >= 15) return 'low';
    return 'baseline';
}

export function getRiskColor(score: number): string {
    return riskColorMap[getRiskLevel(score)];
}

export const sourceColorMap: Record<ContaminationSource, string> = {
    industrial_effluent: '#e24b4a',
    sewage_overflow: '#d85a30',
    fertilizer_runoff: '#a3b822',
    pipe_corrosion: '#6b7280',
    algal_bloom: '#1d9e75',
    natural_hardness: '#6b8cae',
    unknown: '#94a3b8',
};
