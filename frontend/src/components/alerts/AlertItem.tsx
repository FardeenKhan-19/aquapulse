'use client';

import { motion } from 'framer-motion';
import type { Alert } from '@/lib/types/alert';
import { formatRelativeTime, humanizeSnakeCase } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Bell } from 'lucide-react';

const severityIcons: Record<string, React.ElementType> = {
    critical: AlertCircle,
    high: AlertTriangle,
    medium: Bell,
    low: Info,
    info: Info,
};

const severityColors: Record<string, string> = {
    critical: '#e24b4a',
    high: '#d85a30',
    medium: '#ef9f27',
    low: '#639922',
    info: '#00d4ff',
};

interface AlertItemProps {
    alert: Alert;
    onAcknowledge: () => void;
}

export function AlertItem({ alert, onAcknowledge }: AlertItemProps) {
    const Icon = severityIcons[alert.severity] || Info;
    const color = severityColors[alert.severity] || '#94a3b8';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
                'bg-surface border border-accent/30 rounded-lg p-4 flex items-start gap-3 transition-colors',
                alert.severity === 'critical' && 'border-coral/40 bg-coral/5',
                alert.is_acknowledged && 'opacity-60'
            )}
        >
            <div className="p-1.5 rounded-lg mt-0.5" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${color}20`, color }}
                    >
                        {alert.severity}
                    </span>
                    <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-accent/20">
                        {humanizeSnakeCase(alert.alert_type)}
                    </span>
                </div>
                <p className="text-sm text-text-primary">{alert.message}</p>
                <p className="text-[10px] text-text-muted mt-1">{formatRelativeTime(alert.created_at)}</p>
            </div>

            {!alert.is_acknowledged ? (
                <button
                    onClick={onAcknowledge}
                    className="px-3 py-1.5 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors whitespace-nowrap"
                >
                    Acknowledge
                </button>
            ) : (
                <div className="flex items-center gap-1 text-teal">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Ack&apos;d</span>
                </div>
            )}
        </motion.div>
    );
}
