'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'health_officer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            router.replace('/login');
            return;
        }

        if (requiredRole && user.role !== requiredRole) {
            if (user.role === 'admin' && requiredRole === 'health_officer') {
                return;
            }
            router.replace('/unauthorized');
        }
    }, [isAuthenticated, isLoading, user, requiredRole, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                    <p className="text-text-secondary text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null;
    }

    if (requiredRole && user.role !== requiredRole && !(user.role === 'admin' && requiredRole === 'health_officer')) {
        return null;
    }

    return <>{children}</>;
}
