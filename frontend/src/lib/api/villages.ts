import apiClient from './client';
import type { Village, CreateVillagePayload, UpdateVillagePayload } from '@/lib/types/village';
import type { PaginatedResponse } from '@/lib/types/api';
import type { SensorReading } from '@/lib/types/sensor';

export const villagesApi = {
    list: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<Village>> => {
        const response = await apiClient.get<PaginatedResponse<Village>>('/ho/villages', { params });
        return response.data;
    },

    listAll: async (params?: { page?: number; per_page?: number; search?: string }): Promise<PaginatedResponse<Village>> => {
        const response = await apiClient.get<PaginatedResponse<Village>>('/admin/villages', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Village> => {
        const response = await apiClient.get<Village>(`/ho/villages/${id}`);
        return response.data;
    },

    create: async (payload: CreateVillagePayload): Promise<Village> => {
        const response = await apiClient.post<Village>('/admin/villages', payload);
        return response.data;
    },

    update: async (id: string, payload: UpdateVillagePayload): Promise<Village> => {
        const response = await apiClient.put<Village>(`/admin/villages/${id}`, payload);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/villages/${id}`);
    },

    getReadings: async (villageId: string, params?: { limit?: number }): Promise<SensorReading[]> => {
        const response = await apiClient.get<SensorReading[]>(`/ho/villages/${villageId}/readings`, { params });
        return response.data;
    },
};
