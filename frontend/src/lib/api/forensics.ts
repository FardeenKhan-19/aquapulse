import apiClient from './client';
import type { ForensicsReport } from '@/lib/types/forensics';
import type { PaginatedResponse } from '@/lib/types/api';

export const forensicsApi = {
    getByVillage: async (villageId: string): Promise<ForensicsReport[]> => {
        const response = await apiClient.get<ForensicsReport[]>(`/ho/villages/${villageId}/forensics`);
        return response.data;
    },

    getById: async (id: string): Promise<ForensicsReport> => {
        const response = await apiClient.get<ForensicsReport>(`/ho/forensics/${id}`);
        return response.data;
    },

    listAll: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<ForensicsReport>> => {
        const response = await apiClient.get<PaginatedResponse<ForensicsReport>>('/ho/forensics', { params });
        return response.data;
    },
};
