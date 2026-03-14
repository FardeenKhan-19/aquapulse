'use client';

import { Marker, Popup } from 'react-map-gl';
import { useState } from 'react';
import { getRiskColor, getRiskLevel, riskColorMap } from '@/lib/utils/riskColors';
import type { Village } from '@/lib/types/village';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface VillageMarkerProps {
    village: Village;
    riskScore: number;
    isSelected?: boolean;
    onClick?: () => void;
}

export function VillageMarker({ village, riskScore, isSelected, onClick }: VillageMarkerProps) {
    const [showPopup, setShowPopup] = useState(false);
    const color = getRiskColor(riskScore);
    const size = Math.max(12, Math.min(30, village.population / 500));
    const riskLevel = getRiskLevel(riskScore);

    return (
        <>
            <Marker
                longitude={village.gps_lng}
                latitude={village.gps_lat}
                anchor="center"
                onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setShowPopup(true);
                    onClick?.();
                }}
            >
                <div
                    className={cn('rounded-full cursor-pointer transition-transform hover:scale-125', isSelected && 'ring-2 ring-white')}
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: color,
                        boxShadow: `0 0 ${size}px ${color}60`,
                    }}
                />
            </Marker>

            {showPopup && (
                <Popup
                    longitude={village.gps_lng}
                    latitude={village.gps_lat}
                    anchor="bottom"
                    onClose={() => setShowPopup(false)}
                    closeOnClick={false}
                    className="village-popup"
                >
                    <div className="bg-surface p-3 rounded-lg min-w-[200px]">
                        <h4 className="text-sm font-bold text-text-primary">{village.name}</h4>
                        <p className="text-xs text-text-muted">{village.district}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold font-mono" style={{ color }}>{riskScore.toFixed(0)}</span>
                            <span
                                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${riskColorMap[riskLevel]}20`, color: riskColorMap[riskLevel] }}
                            >
                                {riskLevel}
                            </span>
                        </div>
                        <Link
                            href={`/dashboard/villages/${village.id}`}
                            className="mt-2 block text-center py-1.5 text-xs font-medium text-cyan bg-cyan/10 hover:bg-cyan/20 rounded transition-colors"
                        >
                            View Details
                        </Link>
                    </div>
                </Popup>
            )}
        </>
    );
}
