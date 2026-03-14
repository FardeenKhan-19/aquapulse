'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

export function AuthInitializer() {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return null;
}
