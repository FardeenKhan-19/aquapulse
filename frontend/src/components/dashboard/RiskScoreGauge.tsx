'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { getRiskColor } from '@/lib/utils/riskColors';

interface RiskScoreGaugeProps {
    score: number;
    size?: number;
    strokeWidth?: number;
}

export function RiskScoreGauge({ score, size = 100, strokeWidth = 8 }: RiskScoreGaugeProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius;
    const progress = useMotionValue(0);
    const strokeDashoffset = useTransform(progress, [0, 100], [circumference, 0]);
    const displayValue = useMotionValue(0);

    useEffect(() => {
        const controls = animate(progress, score, { duration: 1, ease: 'easeOut' });
        const valueControls = animate(displayValue, score, { duration: 1, ease: 'easeOut' });
        return () => { controls.stop(); valueControls.stop(); };
    }, [score, progress, displayValue]);

    const color = getRiskColor(score);
    const center = size / 2;

    return (
        <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
            <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
                <path
                    d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                <motion.path
                    d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${center}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset }}
                    filter={`drop-shadow(0 0 6px ${color}40)`}
                />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <motion.span
                    className="text-xl font-bold font-mono"
                    style={{ color }}
                >
                    {Math.round(score)}
                </motion.span>
            </div>
        </div>
    );
}
