'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { demoApi } from '@/lib/api/demo';
import { useDemoStore } from '@/lib/stores/demoStore';
import { useWsMessageFilter } from '@/lib/hooks/useWebSocket';
import { toast } from 'sonner';
import { Play, RotateCcw, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { DemoEvent } from '@/lib/api/demo';
import { cn } from '@/lib/utils/cn';

const scenarios = [
    { id: 1, title: 'Dharangaon Cholera Outbreak', subtitle: 'Simulates a full contamination → detection → response pipeline' },
    { id: 2, title: 'Early Detection Timeline', subtitle: 'Shows how AI catches contamination before health impact' },
    { id: 3, title: 'Intervention Success', subtitle: 'Demonstrates prevention through early warning system' },
];

export function DemoControls() {
    const { activeScenario, isRunning, events, setActiveScenario, setIsRunning, addEvent, clearEvents } = useDemoStore();

    const triggerScenario = useMutation({
        mutationFn: (id: number) => demoApi.triggerScenario(id),
        onSuccess: (_, id) => {
            setActiveScenario(id);
            setIsRunning(true);
            toast.success(`Scenario ${id} triggered`);
        },
        onError: (error: any) => toast.error(error.message || 'Failed to trigger scenario'),
    });

    const resetDemo = useMutation({
        mutationFn: () => demoApi.resetDemo(),
        onSuccess: () => {
            clearEvents();
            setActiveScenario(null);
            setIsRunning(false);
            toast.success('Demo data reset');
        },
    });

    useWsMessageFilter('demo_scenario', (payload) => {
        addEvent(payload as DemoEvent);
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === '1') triggerScenario.mutate(1);
            if (e.key === '2') triggerScenario.mutate(2);
            if (e.key === '3') triggerScenario.mutate(3);
            if (e.key.toLowerCase() === 'r') resetDemo.mutate();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const statusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-3.5 h-3.5 text-teal" />;
            case 'error': return <AlertCircle className="w-3.5 h-3.5 text-coral" />;
            case 'in_progress': return <Loader2 className="w-3.5 h-3.5 text-cyan animate-spin" />;
            default: return <Clock className="w-3.5 h-3.5 text-text-muted" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarios.map((s) => (
                    <div key={s.id} className={cn('bg-surface border border-accent/30 rounded-xl p-5', activeScenario === s.id && isRunning && 'border-cyan/50 shadow-lg shadow-cyan/5')}>
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan font-bold text-sm">{s.id}</div>
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary">{s.title}</h3>
                                <p className="text-xs text-text-muted mt-1">{s.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => triggerScenario.mutate(s.id)}
                            disabled={isRunning || triggerScenario.isPending}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 disabled:bg-accent/20 disabled:text-text-muted rounded-lg transition-colors"
                        >
                            {activeScenario === s.id && isRunning ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
                            ) : (
                                <><Play className="w-3.5 h-3.5" /> Trigger Scenario {s.id}</>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={() => resetDemo.mutate()}
                disabled={resetDemo.isPending}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber bg-amber/10 hover:bg-amber/20 rounded-lg transition-colors"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                {resetDemo.isPending ? 'Resetting...' : 'Reset All Demo Data'}
            </button>

            {events.length > 0 && (
                <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-accent/20">
                        <h3 className="text-sm font-semibold text-text-primary">Live Event Feed</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <AnimatePresence>
                            {events.map((event, i) => (
                                <motion.div
                                    key={event.id || i}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 px-4 py-2.5 border-b border-accent/10 last:border-b-0"
                                >
                                    {statusIcon(event.status)}
                                    <span className="text-[10px] font-mono text-text-muted w-20 shrink-0">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-text-secondary shrink-0">{event.event_type}</span>
                                    <span className="text-xs text-text-primary truncate">{event.description}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <p className="text-[10px] text-text-muted text-center">
                Keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-accent/30 rounded text-text-secondary font-mono">1</kbd> <kbd className="px-1.5 py-0.5 bg-accent/30 rounded text-text-secondary font-mono">2</kbd> <kbd className="px-1.5 py-0.5 bg-accent/30 rounded text-text-secondary font-mono">3</kbd> Scenarios · <kbd className="px-1.5 py-0.5 bg-accent/30 rounded text-text-secondary font-mono">R</kbd> Reset
            </p>
        </div>
    );
}
