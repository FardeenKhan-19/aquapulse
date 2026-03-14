import apiClient from './client';
import type { Alert } from '@/lib/types/alert';
import type { PaginatedResponse } from '@/lib/types/api';

export const alertsApi = {
    listActive: async (params?: {
        page?: number;
        per_page?: number;
        severity?: string;
        village_id?: string;
        alert_type?: string;
        acknowledged?: boolean;
    }): Promise<PaginatedResponse<Alert>> => {
        const response = await apiClient.get<PaginatedResponse<Alert>>('/ho/alerts', { params });
        return response.data;
    },

    acknowledge: async (id: string): Promise<Alert> => {
        const response = await apiClient.put<Alert>(`/ho/alerts/${id}/acknowledge`);
        return response.data;
    },

    getCount: async (): Promise<{ count: number }> => {
        const response = await apiClient.get<{ count: number }>('/ho/alerts/count');
        return response.data;
    },
};
