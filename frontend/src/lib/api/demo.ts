import apiClient from './client';

export interface DemoScenarioStatus {
    scenario_id: number;
    name: string;
    status: 'idle' | 'running' | 'completed' | 'error';
    started_at?: string;
    completed_at?: string;
}

export interface DemoEvent {
    id: string;
    scenario_id: number;
    timestamp: string;
    event_type: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
}

export const demoApi = {
    triggerScenario: async (scenarioId: number): Promise<DemoScenarioStatus> => {
        const response = await apiClient.post<DemoScenarioStatus>(`/demo/scenario/${scenarioId}`);
        return response.data;
    },

    resetDemo: async (): Promise<void> => {
        await apiClient.get('/demo/reset');
    },

    getStatus: async (): Promise<DemoScenarioStatus[]> => {
        const response = await apiClient.get<DemoScenarioStatus[]>('/demo/status');
        return response.data;
    },
};
