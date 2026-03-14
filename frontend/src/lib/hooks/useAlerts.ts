'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api/alerts';
import { useAlertStore } from '@/lib/stores/alertStore';

export function useAlerts(params?: {
    page?: number;
    per_page?: number;
    severity?: string;
    village_id?: string;
    alert_type?: string;
    acknowledged?: boolean;
}) {
    return useQuery({
        queryKey: ['alerts', 'active', params],
        queryFn: () => alertsApi.listActive(params),
        staleTime: 5000,
    });
}

export function useAlertCount() {
    return useQuery({
        queryKey: ['alerts', 'count'],
        queryFn: () => alertsApi.getCount(),
        staleTime: 5000,
    });
}

export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();
    const { acknowledgeAlert } = useAlertStore();

    return useMutation({
        mutationFn: (alertId: string) => alertsApi.acknowledge(alertId),
        onMutate: async (alertId) => {
            acknowledgeAlert(alertId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });
}
