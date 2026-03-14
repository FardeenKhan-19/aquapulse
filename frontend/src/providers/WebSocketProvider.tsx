'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    useWebSocket();

    return <>{children}</>;
}
