'use client';

import { motion } from 'framer-motion';

interface SourceConfidenceBarProps {
    confidence: number;
    color?: string;
    showLabel?: boolean;
}

export function SourceConfidenceBar({ confidence, color = '#7f77dd', showLabel = true }: SourceConfidenceBarProps) {
    return (
        <div>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-muted">Confidence</span>
                    <span className="text-xs font-mono font-bold" style={{ color }}>{(confidence * 100).toFixed(1)}%</span>
                </div>
            )}
            <div className="w-full h-3 rounded-full bg-accent/30 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>
        </div>
    );
}
