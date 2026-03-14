'use client';

import { cn } from '@/lib/utils/cn';

interface TimelineEvent {
    time: string;
    label: string;
    description: string;
    type: 'detection' | 'threshold' | 'alert' | 'legal' | 'other';
}

interface ContaminationTimelineProps {
    events: TimelineEvent[];
}

const typeColors: Record<string, string> = {
    detection: '#00d4ff',
    threshold: '#ef9f27',
    alert: '#e24b4a',
    legal: '#1d9e75',
    other: '#94a3b8',
};

export function ContaminationTimeline({ events }: ContaminationTimelineProps) {
    if (events.length === 0) return null;

    return (
        <div className="bg-surface border border-accent/30 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-6">Contamination Timeline</h3>
            <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-accent/30" style={{ left: '5%', right: '5%' }} />
                <div className="flex justify-between relative">
                    {events.map((event, i) => (
                        <div key={i} className="flex flex-col items-center text-center" style={{ maxWidth: `${100 / events.length}%` }}>
                            <p className="text-[10px] text-text-secondary mb-1 truncate max-w-[80px]" title={event.description}>
                                {event.description}
                            </p>
                            <div
                                className="w-3 h-3 rounded-full z-10 border-2 border-primary"
                                style={{ backgroundColor: typeColors[event.type] || typeColors.other }}
                            />
                            <p className="text-[10px] font-mono text-text-muted mt-1">{event.time}</p>
                            <p className="text-[9px] text-text-muted mt-0.5">{event.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
