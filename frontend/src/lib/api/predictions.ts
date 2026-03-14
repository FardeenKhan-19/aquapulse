import apiClient from './client';
import type { OutbreakPrediction } from '@/lib/types/prediction';
import type { PaginatedResponse } from '@/lib/types/api';

export const predictionsApi = {
    getByVillage: async (villageId: string, params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<OutbreakPrediction>> => {
        const response = await apiClient.get<PaginatedResponse<OutbreakPrediction>>(`/ho/villages/${villageId}/predictions`, { params });
        return response.data;
    },

    getLatest: async (villageId: string): Promise<OutbreakPrediction> => {
        const response = await apiClient.get<OutbreakPrediction>(`/ho/villages/${villageId}/predictions/latest`);
        return response.data;
    },

    whatIf: async (villageId: string, params: Record<string, number>): Promise<OutbreakPrediction> => {
        const response = await apiClient.post<OutbreakPrediction>(`/ho/villages/${villageId}/predictions/what-if`, params);
        return response.data;
    },
};
