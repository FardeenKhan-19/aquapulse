'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'flat';
    trendValue?: string;
    color?: string;
    onClick?: () => void;
}

export function KpiCard({ title, value, icon: Icon, trend, trendValue, color = '#00d4ff', onClick }: KpiCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={cn(
                'bg-surface border border-accent/30 rounded-xl p-4 hover:border-cyan/20 transition-all',
                onClick && 'cursor-pointer hover:scale-[1.02]'
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{title}</p>
                    <p className="mt-2 text-2xl font-bold font-mono" style={{ color }}>{value}</p>
                    {trend && trendValue && (
                        <p className={cn('mt-1 text-xs', trend === 'up' ? 'text-coral' : trend === 'down' ? 'text-teal' : 'text-text-muted')}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                        </p>
                    )}
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </motion.div>
    );
}
