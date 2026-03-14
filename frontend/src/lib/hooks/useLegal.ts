'use client';

import { useQuery } from '@tanstack/react-query';
import { legalApi } from '@/lib/api/legal';

export function useLegalByVillage(villageId: string) {
    return useQuery({
        queryKey: ['legal', villageId],
        queryFn: () => legalApi.getByVillage(villageId),
        staleTime: 60000,
        enabled: !!villageId,
    });
}

export function useLegalDocument(id: string) {
    return useQuery({
        queryKey: ['legal', 'detail', id],
        queryFn: () => legalApi.getById(id),
        staleTime: 60000,
        enabled: !!id,
    });
}

export function useAllLegal(params?: { page?: number; per_page?: number; status?: string; village_id?: string }) {
    return useQuery({
        queryKey: ['legal', 'all', params],
        queryFn: () => legalApi.listAll(params),
        staleTime: 60000,
    });
}
