'use client';

import { cn } from '@/lib/utils/cn';

interface SensorStatusDotProps {
    isOnline: boolean;
    className?: string;
    showLabel?: boolean;
}

export function SensorStatusDot({ isOnline, className, showLabel = false }: SensorStatusDotProps) {
    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span
                className={cn(
                    'w-2 h-2 rounded-full',
                    isOnline ? 'bg-teal animate-pulse-cyan' : 'bg-text-muted'
                )}
            />
            {showLabel && (
                <span className={cn('text-xs', isOnline ? 'text-teal' : 'text-text-muted')}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            )}
        </span>
    );
}
