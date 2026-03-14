'use client';

import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/lib/websocket/client';
import { createMessageHandler } from '@/lib/websocket/handlers';
import { useAuthStore } from '@/lib/stores/authStore';
import { useWsStore } from '@/lib/stores/wsStore';
import { useQueryClient } from '@tanstack/react-query';
import type { WsMessage } from '@/lib/types/websocket';

export function useWebSocket() {
    const { accessToken, isAuthenticated } = useAuthStore();
    const connectionStatus = useWsStore((s) => s.connectionStatus);
    const queryClient = useQueryClient();
    const handlerRef = useRef<((msg: WsMessage) => void) | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            wsClient.disconnect();
            return;
        }

        const handler = createMessageHandler(queryClient);
        handlerRef.current = handler;
        wsClient.addHandler(handler);
        wsClient.connect(accessToken);

        return () => {
            if (handlerRef.current) {
                wsClient.removeHandler(handlerRef.current);
            }
            wsClient.disconnect();
        };
    }, [isAuthenticated, accessToken, queryClient]);

    return { connectionStatus };
}

export function useWsMessageFilter(type: string, callback: (payload: unknown) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const handler = (message: WsMessage) => {
            if (message.type === type) {
                callbackRef.current(message.payload);
            }
        };

        wsClient.addHandler(handler);
        return () => wsClient.removeHandler(handler);
    }, [type]);
}
