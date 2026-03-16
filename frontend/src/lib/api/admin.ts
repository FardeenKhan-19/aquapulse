import apiClient from './client';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/lib/types/user';
import type { PaginatedResponse } from '@/lib/types/api';

export interface SystemHealth {
    api_server: { status: string; response_time_ms: number };
    database: { status: string; response_time_ms: number };
    redis: { status: string; response_time_ms: number };
    celery_workers: { status: string; active_workers: number };
    websocket: { status: string; connections: number };
}

export interface ModelInfo {
    name: string;
    version: string;
    training_date: string;
    accuracy: number;
    prediction_count?: number;
    classification_counts?: Record<string, number>;
}

export interface ApiUsageDay {
    date: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    documents_generated: number;
}

export interface ApiUsageResponse {
    usage_by_day: ApiUsageDay[];
    model: string;
}

export const adminApi = {
    getUsers: async (params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
        return response.data;
    },

    getUserById: async (id: string): Promise<User> => {
        const response = await apiClient.get<User>(`/admin/users/${id}`);
        return response.data;
    },

    createUser: async (payload: CreateUserPayload): Promise<User> => {
        const response = await apiClient.post<User>('/admin/users', payload);
        return response.data;
    },

    updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
        const response = await apiClient.put<User>(`/admin/users/${id}`, payload);
        return response.data;
    },

    resetPassword: async (id: string): Promise<{ temporary_password: string }> => {
        const response = await apiClient.post<{ temporary_password: string }>(`/admin/users/${id}/reset-password`);
        return response.data;
    },

    getSystemHealth: async (): Promise<SystemHealth> => {
        const response = await apiClient.get<SystemHealth>('/admin/system/health');
        return response.data;
    },

    getModels: async (): Promise<ModelInfo[]> => {
        const response = await apiClient.get<ModelInfo[]>('/admin/system/models');
        return response.data;
    },

    retrainModel: async (modelName: string): Promise<{ job_id: string }> => {
        const response = await apiClient.post<{ job_id: string }>('/admin/system/retrain', { model: modelName });
        return response.data;
    },

    getLogs: async (params?: { level?: string; limit?: number }): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/admin/system/logs', { params });
        return response.data;
    },

    getApiUsage: async (): Promise<ApiUsageResponse> => {
        const response = await apiClient.get<ApiUsageResponse>('/admin/system/api-usage');
        return response.data;
    },
};
