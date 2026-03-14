import { create } from 'zustand';
import type { Alert } from '@/lib/types/alert';

interface AlertState {
    activeAlerts: Alert[];
    unreadCount: number;
    setAlerts: (alerts: Alert[]) => void;
    prependAlert: (alert: Alert) => void;
    acknowledgeAlert: (id: string) => void;
    setUnreadCount: (count: number) => void;
    decrementUnread: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    activeAlerts: [],
    unreadCount: 0,

    setAlerts: (alerts) => set({ activeAlerts: alerts }),

    prependAlert: (alert) =>
        set((state) => ({
            activeAlerts: [alert, ...state.activeAlerts],
            unreadCount: state.unreadCount + 1,
        })),

    acknowledgeAlert: (id) =>
        set((state) => ({
            activeAlerts: state.activeAlerts.map((a) =>
                a.id === id ? { ...a, is_acknowledged: true } : a
            ),
        })),

    setUnreadCount: (count) => set({ unreadCount: count }),
    decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
