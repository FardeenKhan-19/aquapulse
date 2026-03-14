'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { User } from '@/lib/types/user';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { MoreHorizontal, UserPlus, Shield, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface UserTableProps {
    onNewUser: () => void;
}

export function UserTable({ onNewUser }: UserTableProps) {
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.getUsers(), staleTime: 60000 });
    const queryClient = useQueryClient();

    const toggleActive = useMutation({
        mutationFn: ({ id, active }: { id: string; active: boolean }) => adminApi.updateUser(id, { is_active: active }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    });

    const users = data?.items || [];

    if (isLoading) {
        return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-surface animate-pulse rounded-lg" />)}</div>;
    }

    return (
        <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
                <h3 className="text-sm font-semibold text-text-primary">Health Officers</h3>
                <button
                    onClick={onNewUser}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded-lg transition-colors"
                >
                    <UserPlus className="w-3 h-3" />
                    New User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-accent/20">
                            <th className="text-left py-2.5 px-4 text-text-muted font-medium">Name</th>
                            <th className="text-left py-2.5 px-4 text-text-muted font-medium">Email</th>
                            <th className="text-center py-2.5 px-4 text-text-muted font-medium">Role</th>
                            <th className="text-center py-2.5 px-4 text-text-muted font-medium">Villages</th>
                            <th className="text-center py-2.5 px-4 text-text-muted font-medium">Status</th>
                            <th className="text-left py-2.5 px-4 text-text-muted font-medium">Last Login</th>
                            <th className="text-center py-2.5 px-4 text-text-muted font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-accent/10 hover:bg-accent/10 transition-colors">
                                <td className="py-2.5 px-4">
                                    <Link href={`/admin/users/${user.id}`} className="text-text-primary hover:text-cyan font-medium">{user.full_name}</Link>
                                </td>
                                <td className="py-2.5 px-4 text-text-secondary">{user.email}</td>
                                <td className="py-2.5 px-4 text-center">
                                    <span className="px-2 py-0.5 rounded bg-cyan/15 text-cyan text-[10px] font-semibold uppercase">
                                        {user.role === 'health_officer' ? 'HO' : 'Admin'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-center font-mono text-text-primary">{user.assigned_village_ids.length}</td>
                                <td className="py-2.5 px-4 text-center">
                                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', user.is_active ? 'bg-teal/15 text-teal' : 'bg-coral/15 text-coral')}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-text-muted">{user.last_login ? formatRelativeTime(user.last_login) : 'Never'}</td>
                                <td className="py-2.5 px-4 text-center">
                                    <button
                                        onClick={() => toggleActive.mutate({ id: user.id, active: !user.is_active })}
                                        className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-accent/30 transition-colors"
                                        title={user.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {user.is_active ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
