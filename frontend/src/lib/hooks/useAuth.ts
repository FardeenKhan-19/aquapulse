'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';

export function useAuth() {
    const { user, isAuthenticated, isLoading, error, login, logout, clearError } = useAuthStore();
    return { user, isAuthenticated, isLoading, error, login, logout, clearError };
}

export function useRequireAuth(requiredRole?: 'admin' | 'health_officer') {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (requiredRole && user.role !== requiredRole) {
            if (user.role === 'admin' && requiredRole === 'health_officer') {
                return;
            }
            router.replace('/unauthorized');
        }
    }, [isAuthenticated, isLoading, user, requiredRole, router, pathname]);

    return { user, isAuthenticated, isLoading };
}

export function useRedirectAuthenticated() {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (isAuthenticated && user) {
            const dest = user.role === 'admin' ? '/admin' : '/dashboard';
            router.replace(dest);
        }
    }, [isAuthenticated, isLoading, user, router]);
}
