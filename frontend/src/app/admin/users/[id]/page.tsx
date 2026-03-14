'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: user, isLoading } = useQuery({ queryKey: ['admin', 'users', id], queryFn: () => adminApi.getUserById(id), enabled: !!id });

    if (isLoading || !user) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title={user.full_name} description={user.email} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">User Information</h3>
                    <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-text-muted">Role</span><span className={cn('px-2 py-0.5 rounded font-semibold uppercase text-[10px]', user.role === 'admin' ? 'bg-coral/15 text-coral' : 'bg-cyan/15 text-cyan')}>{user.role}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Phone</span><span className="text-text-primary">{user.phone || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Status</span><span className={user.is_active ? 'text-teal' : 'text-coral'}>{user.is_active ? 'Active' : 'Inactive'}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Last Login</span><span className="text-text-secondary">{user.last_login ? formatRelativeTime(user.last_login) : 'Never'}</span></div>
                        <div className="flex justify-between"><span className="text-text-muted">Created</span><span className="text-text-secondary">{formatDateTime(user.created_at)}</span></div>
                    </div>
                </div>
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">Assigned Villages ({user.assigned_village_ids.length})</h3>
                    <div className="space-y-2">
                        {user.assigned_village_ids.length > 0 ? user.assigned_village_ids.map((vid) => (
                            <div key={vid} className="px-3 py-2 bg-accent/10 rounded-lg text-xs font-mono text-text-secondary">{vid}</div>
                        )) : <p className="text-xs text-text-muted">No villages assigned</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
