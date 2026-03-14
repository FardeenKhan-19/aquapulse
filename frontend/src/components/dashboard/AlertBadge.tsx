'use client';

import { cn } from '@/lib/utils/cn';

interface AlertBadgeProps {
    count: number;
    className?: string;
}

export function AlertBadge({ count, className }: AlertBadgeProps) {
    if (count === 0) return null;

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                count >= 5 ? 'bg-coral text-white' : count >= 2 ? 'bg-amber text-primary' : 'bg-cyan/20 text-cyan',
                className
            )}
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}
