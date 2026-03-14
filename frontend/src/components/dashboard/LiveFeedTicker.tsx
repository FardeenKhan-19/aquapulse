'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore } from '@/lib/stores/alertStore';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export function LiveFeedTicker() {
    const alerts = useAlertStore((s) => s.activeAlerts.slice(0, 5));

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertCircle className="w-3.5 h-3.5 text-coral" />;
            case 'high': return <AlertTriangle className="w-3.5 h-3.5 text-amber" />;
            default: return <Info className="w-3.5 h-3.5 text-cyan" />;
        }
    };

    if (alerts.length === 0) {
        return (
            <div className="bg-surface border border-accent/30 rounded-xl p-4">
                <p className="text-sm text-text-muted text-center py-4">No active alerts</p>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-accent/20">
                <h3 className="text-sm font-semibold text-text-primary">Live Alert Feed</h3>
            </div>
            <AnimatePresence>
                {alerts.map((alert, i) => (
                    <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 border-b border-accent/10 last:border-b-0',
                            alert.severity === 'critical' && 'bg-coral/5'
                        )}
                    >
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-primary truncate">{alert.message}</p>
                        </div>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">{formatRelativeTime(alert.created_at)}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
