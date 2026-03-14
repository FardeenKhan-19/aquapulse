import { create } from 'zustand';
import type { DemoEvent } from '@/lib/api/demo';

interface DemoState {
    activeScenario: number | null;
    isRunning: boolean;
    events: DemoEvent[];
    setActiveScenario: (scenario: number | null) => void;
    setIsRunning: (running: boolean) => void;
    addEvent: (event: DemoEvent) => void;
    clearEvents: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
    activeScenario: null,
    isRunning: false,
    events: [],

    setActiveScenario: (scenario) => set({ activeScenario: scenario }),
    setIsRunning: (running) => set({ isRunning: running }),
    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
    clearEvents: () => set({ events: [] }),
}));
