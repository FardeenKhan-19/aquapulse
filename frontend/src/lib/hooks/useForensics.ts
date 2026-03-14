'use client';

import { useQuery } from '@tanstack/react-query';
import { forensicsApi } from '@/lib/api/forensics';

export function useForensicsByVillage(villageId: string) {
    return useQuery({
        queryKey: ['forensics', villageId],
        queryFn: () => forensicsApi.getByVillage(villageId),
        staleTime: 60000,
        enabled: !!villageId,
    });
}

export function useForensicsReport(id: string) {
    return useQuery({
        queryKey: ['forensics', 'detail', id],
        queryFn: () => forensicsApi.getById(id),
        staleTime: 60000,
        enabled: !!id,
    });
}

export function useAllForensics(params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: ['forensics', 'all', params],
        queryFn: () => forensicsApi.listAll(params),
        staleTime: 60000,
    });
}
