'use client';

import { useQuery } from '@tanstack/react-query';
import { predictionsApi } from '@/lib/api/predictions';

export function usePredictions(villageId: string, params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: ['predictions', villageId, params],
        queryFn: () => predictionsApi.getByVillage(villageId, params),
        staleTime: 10000,
        enabled: !!villageId,
    });
}

export function useLatestPrediction(villageId: string) {
    return useQuery({
        queryKey: ['predictions', villageId, 'latest'],
        queryFn: () => predictionsApi.getLatest(villageId),
        staleTime: 10000,
        enabled: !!villageId,
    });
}
