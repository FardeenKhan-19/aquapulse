import { useWsStore } from '@/lib/stores/wsStore';
import type { WsMessage } from '@/lib/types/websocket';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

type MessageHandler = (message: WsMessage) => void;

class WebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectDelay = INITIAL_RECONNECT_DELAY;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private token: string | null = null;
    private isIntentionallyClosed = false;

    connect(token: string) {
        this.token = token;
        this.isIntentionallyClosed = false;
        this.doConnect();
    }

    private doConnect() {
        if (!this.token) return;

        try {
            this.ws = new WebSocket(`${WS_BASE_URL}/ws/live?token=${this.token}`);

            this.ws.onopen = () => {
                useWsStore.getState().setConnectionStatus('connected');
                this.reconnectDelay = INITIAL_RECONNECT_DELAY;
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WsMessage = JSON.parse(event.data);
                    this.messageHandlers.forEach((handler) => handler(message));
                } catch {
                    // Invalid message format
                }
            };

            this.ws.onclose = () => {
                if (!this.isIntentionallyClosed) {
                    useWsStore.getState().setConnectionStatus('reconnecting');
                    this.scheduleReconnect();
                } else {
                    useWsStore.getState().setConnectionStatus('disconnected');
                }
            };

            this.ws.onerror = () => {
                this.ws?.close();
            };
        } catch {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.doConnect();
        }, this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }

    disconnect() {
        this.isIntentionallyClosed = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
        this.ws = null;
        useWsStore.getState().setConnectionStatus('disconnected');
    }

    addHandler(handler: MessageHandler) {
        this.messageHandlers.add(handler);
    }

    removeHandler(handler: MessageHandler) {
        this.messageHandlers.delete(handler);
    }
}

export const wsClient = new WebSocketClient();
