import { create } from 'zustand';
import type { SensorReading } from '@/lib/types/sensor';
import type { OutbreakPrediction } from '@/lib/types/prediction';
import type { WsConnectionStatus } from '@/lib/types/websocket';

interface WsState {
    connectionStatus: WsConnectionStatus;
    latestReadings: Record<string, SensorReading>;
    predictions: Record<string, OutbreakPrediction>;
    setConnectionStatus: (status: WsConnectionStatus) => void;
    updateReading: (villageId: string, reading: SensorReading) => void;
    updatePrediction: (villageId: string, prediction: OutbreakPrediction) => void;
    reset: () => void;
}

export const useWsStore = create<WsState>((set) => ({
    connectionStatus: 'disconnected',
    latestReadings: {},
    predictions: {},

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    updateReading: (villageId, reading) =>
        set((state) => ({
            latestReadings: { ...state.latestReadings, [villageId]: reading },
        })),

    updatePrediction: (villageId, prediction) =>
        set((state) => ({
            predictions: { ...state.predictions, [villageId]: prediction },
        })),

    reset: () =>
        set({
            connectionStatus: 'disconnected',
            latestReadings: {},
            predictions: {},
        }),
}));
