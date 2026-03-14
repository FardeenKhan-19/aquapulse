import apiClient from './client';
import type { AuthResponse, LoginCredentials } from '@/lib/types/user';

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },

    refresh: async (): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/refresh');
        return response.data;
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
};
