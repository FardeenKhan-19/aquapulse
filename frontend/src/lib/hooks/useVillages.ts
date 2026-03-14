'use client';

import { useQuery } from '@tanstack/react-query';
import { villagesApi } from '@/lib/api/villages';

export function useVillages(params?: { page?: number; per_page?: number; search?: string }) {
    return useQuery({
        queryKey: ['villages', 'list', params],
        queryFn: () => villagesApi.list(params),
        staleTime: 30000,
    });
}

export function useAllVillages(params?: { page?: number; per_page?: number; search?: string }) {
    return useQuery({
        queryKey: ['villages', 'all', params],
        queryFn: () => villagesApi.listAll(params),
        staleTime: 30000,
    });
}

export function useVillage(id: string) {
    return useQuery({
        queryKey: ['villages', id],
        queryFn: () => villagesApi.getById(id),
        staleTime: 10000,
        enabled: !!id,
    });
}

export function useVillageReadings(villageId: string, limit = 50) {
    return useQuery({
        queryKey: ['villages', villageId, 'readings', limit],
        queryFn: () => villagesApi.getReadings(villageId, { limit }),
        staleTime: 10000,
        enabled: !!villageId,
    });
}
