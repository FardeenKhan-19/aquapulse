'use client';

import { useCallback, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Village } from '@/lib/types/village';
import { VillageMarker } from './VillageMarker';

interface VillageMapProps {
    villages: Village[];
    selectedVillageId?: string;
    onVillageClick?: (village: Village) => void;
    height?: number;
    riskScores?: Record<string, number>;
}

export function VillageMap({ villages, selectedVillageId, onVillageClick, height = 400, riskScores = {} }: VillageMapProps) {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const bounds = useMemo(() => {
        if (villages.length === 0) return undefined;
        const lats = villages.map((v) => v.gps_lat);
        const lngs = villages.map((v) => v.gps_lng);
        return {
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            zoom: villages.length === 1 ? 12 : 8,
        };
    }, [villages]);

    if (!mapboxToken || mapboxToken === 'your-mapbox-public-token') {
        return (
            <div
                className="bg-surface border border-accent/30 rounded-xl flex items-center justify-center"
                style={{ height }}
            >
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Map unavailable</p>
                    <p className="text-text-muted text-xs mt-1">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden border border-accent/30" style={{ height }}>
            <Map
                initialViewState={bounds || { longitude: 76.9, latitude: 20.7, zoom: 6 }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={mapboxToken}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
            >
                <NavigationControl position="top-right" />
                {villages.map((village) => (
                    <VillageMarker
                        key={village.id}
                        village={village}
                        riskScore={riskScores[village.id] ?? 0}
                        isSelected={village.id === selectedVillageId}
                        onClick={() => onVillageClick?.(village)}
                    />
                ))}
            </Map>
        </div>
    );
}
