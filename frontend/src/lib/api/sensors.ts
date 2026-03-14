import apiClient from './client';
import type { SensorNode, SensorReading, RegisterSensorPayload, SensorRegistrationResponse } from '@/lib/types/sensor';
import type { PaginatedResponse } from '@/lib/types/api';

export const sensorsApi = {
    list: async (params?: {
        page?: number;
        per_page?: number;
        village_id?: string;
        status?: string;
        approved?: boolean;
    }): Promise<PaginatedResponse<SensorNode>> => {
        const response = await apiClient.get<PaginatedResponse<SensorNode>>('/admin/sensors', { params });
        return response.data;
    },

    getById: async (id: string): Promise<SensorNode> => {
        const response = await apiClient.get<SensorNode>(`/admin/sensors/${id}`);
        return response.data;
    },

    register: async (payload: RegisterSensorPayload): Promise<SensorRegistrationResponse> => {
        const response = await apiClient.post<SensorRegistrationResponse>('/admin/sensors/register', payload);
        return response.data;
    },

    approve: async (id: string): Promise<SensorNode> => {
        const response = await apiClient.put<SensorNode>(`/admin/sensors/${id}/approve`);
        return response.data;
    },

    deactivate: async (id: string): Promise<SensorNode> => {
        const response = await apiClient.put<SensorNode>(`/admin/sensors/${id}/deactivate`);
        return response.data;
    },

    updateCalibration: async (id: string, calibration: Record<string, unknown>): Promise<SensorNode> => {
        const response = await apiClient.put<SensorNode>(`/admin/sensors/${id}/calibration`, { calibration_data: calibration });
        return response.data;
    },

    getReadings: async (sensorId: string, params?: { limit?: number }): Promise<SensorReading[]> => {
        const response = await apiClient.get<SensorReading[]>(`/admin/sensors/${sensorId}/readings`, { params });
        return response.data;
    },

    regenerateQr: async (id: string): Promise<{ qr_code_base64: string }> => {
        const response = await apiClient.post<{ qr_code_base64: string }>(`/admin/sensors/${id}/qr`);
        return response.data;
    },
};
