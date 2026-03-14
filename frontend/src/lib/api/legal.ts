import apiClient from './client';
import type { LegalDocument } from '@/lib/types/legal';
import type { PaginatedResponse } from '@/lib/types/api';

export const legalApi = {
    getByVillage: async (villageId: string): Promise<LegalDocument[]> => {
        const response = await apiClient.get<LegalDocument[]>(`/ho/villages/${villageId}/legal`);
        return response.data;
    },

    getById: async (id: string): Promise<LegalDocument> => {
        const response = await apiClient.get<LegalDocument>(`/ho/legal/${id}`);
        return response.data;
    },

    listAll: async (params?: { page?: number; per_page?: number; status?: string; village_id?: string }): Promise<PaginatedResponse<LegalDocument>> => {
        const response = await apiClient.get<PaginatedResponse<LegalDocument>>('/ho/legal', { params });
        return response.data;
    },

    downloadPdf: async (id: string): Promise<string> => {
        const response = await apiClient.get<{ url: string }>(`/ho/legal/${id}/download`);
        return response.data as unknown as string;
    },
};
