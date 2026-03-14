'use client';

import { cn } from '@/lib/utils/cn';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, children, className }: PageHeaderProps) {
    const actionContent = actions || children;
    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
            <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary">{title}</h2>
                {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            </div>
            {actionContent && <div className="flex items-center gap-3">{actionContent}</div>}
        </div>
    );
}
