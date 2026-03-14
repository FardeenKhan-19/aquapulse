'use client';

import type { FilingStatus } from '@/lib/types/legal';
import { cn } from '@/lib/utils/cn';

const statusConfig: Record<FilingStatus, { color: string; bg: string; label: string }> = {
    generated: { color: 'text-text-secondary', bg: 'bg-accent/30', label: 'Generated' },
    filed: { color: 'text-cyan', bg: 'bg-cyan/15', label: 'Filed' },
    acknowledged: { color: 'text-teal', bg: 'bg-teal/15', label: 'Acknowledged' },
    rejected: { color: 'text-coral', bg: 'bg-coral/15', label: 'Rejected' },
    under_review: { color: 'text-amber', bg: 'bg-amber/15', label: 'Under Review' },
};

interface FilingStatusBadgeProps {
    status: FilingStatus;
}

export function FilingStatusBadge({ status }: FilingStatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase', config.bg, config.color)}>
            {config.label}
        </span>
    );
}
