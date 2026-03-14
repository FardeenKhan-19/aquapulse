'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useVillage, useVillageReadings } from '@/lib/hooks/useVillages';
import { useLatestPrediction, usePredictions } from '@/lib/hooks/usePredictions';
import { useForensicsByVillage } from '@/lib/hooks/useForensics';
import { useLegalByVillage } from '@/lib/hooks/useLegal';
import { PageHeader } from '@/components/layout/PageHeader';
import { PredictionPanel } from '@/components/predictions/PredictionPanel';
import { ShapExplanation } from '@/components/predictions/ShapExplanation';
import { WhatIfSimulator } from '@/components/predictions/WhatIfSimulator';
import { TdsTimelineChart } from '@/components/charts/TdsTimelineChart';
import { RiskHistoryChart } from '@/components/charts/RiskHistoryChart';
import { SensorReadingsGrid } from '@/components/charts/SensorReadingsGrid';
import { ForensicsCard } from '@/components/forensics/ForensicsCard';
import { ContaminationTimeline } from '@/components/forensics/ContaminationTimeline';
import { LegalDocumentCard } from '@/components/legal/LegalDocumentCard';
import { RiskScoreGauge } from '@/components/dashboard/RiskScoreGauge';
import { useWsStore } from '@/lib/stores/wsStore';
import { cn } from '@/lib/utils/cn';
import { MapPin, Droplets, Users, Thermometer, Beaker, Wind, Waves } from 'lucide-react';

const tabs = ['Overview', 'Sensor Data', 'Predictions', 'Forensics', 'Legal'] as const;

export default function VillageDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Overview');
    const { data: village, isLoading } = useVillage(id);
    const { data: prediction } = useLatestPrediction(id);
    const { data: readings } = useVillageReadings(id, 50);
    const { data: predictions } = usePredictions(id, { per_page: 30 });
    const { data: forensics } = useForensicsByVillage(id);
    const { data: legal } = useLegalByVillage(id);
    const latestReading = useWsStore((s) => s.latestReadings[id]);

    if (isLoading || !village) {
        return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-surface animate-pulse rounded-xl" />)}</div>;
    }

    const sensorMetrics = [
        { label: 'TDS', value: latestReading?.tds_ppm, unit: 'ppm', icon: Droplets, color: '#00d4ff' },
        { label: 'Temp', value: latestReading?.temperature_c, unit: '°C', icon: Thermometer, color: '#ef9f27' },
        { label: 'Turbidity', value: latestReading?.turbidity_ntu, unit: 'NTU', icon: Waves, color: '#7f77dd' },
        { label: 'pH', value: latestReading?.ph, unit: '', icon: Beaker, color: '#1d9e75' },
        { label: 'Humidity', value: latestReading?.humidity_pct, unit: '%', icon: Wind, color: '#639922' },
        { label: 'Flow', value: latestReading?.flow_rate_lpm, unit: 'L/m', icon: Waves, color: '#00d4ff' },
    ];

    return (
        <div>
            <PageHeader title={village.name} description={`${village.district}, ${village.state}`} />

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                            activeTab === tab ? 'bg-cyan/20 text-cyan' : 'text-text-secondary hover:bg-accent/30'
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-surface border border-accent/30 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Village Info</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-text-muted">Location</span><span className="text-text-primary">{village.gps_lat.toFixed(4)}, {village.gps_lng.toFixed(4)}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted">Population</span><span className="text-text-primary font-mono">{village.population.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted">Water Source</span><span className="text-text-primary">{village.primary_water_source}</span></div>
                            </div>
                        </div>
                        {prediction && <PredictionPanel prediction={prediction} />}
                    </div>
                    {prediction && <ShapExplanation shapValues={prediction.shap_values} />}
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary mb-3">Real-time Sensor Readings</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {sensorMetrics.map((m) => (
                                <div key={m.label} className="bg-surface border border-accent/30 rounded-xl p-3 text-center">
                                    <m.icon className="w-4 h-4 mx-auto mb-1" style={{ color: m.color }} />
                                    <p className="text-[10px] text-text-muted uppercase">{m.label}</p>
                                    <p className="text-lg font-bold font-mono mt-1" style={{ color: m.color }}>
                                        {m.value !== null && m.value !== undefined ? (typeof m.value === 'number' ? m.value.toFixed(1) : m.value) : '--'}
                                    </p>
                                    <p className="text-[10px] text-text-muted">{m.unit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Sensor Data' && (
                <div className="space-y-6">
                    <div className="bg-surface border border-accent/30 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-3">TDS Timeline (24h)</h3>
                        <TdsTimelineChart readings={readings || []} />
                    </div>
                    <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-accent/20">
                            <h3 className="text-sm font-semibold text-text-primary">Recent Readings</h3>
                        </div>
                        <SensorReadingsGrid readings={readings || []} />
                    </div>
                </div>
            )}

            {activeTab === 'Predictions' && (
                <div className="space-y-6">
                    <div className="bg-surface border border-accent/30 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-3">Risk Score History (30 days)</h3>
                        <RiskHistoryChart data={(predictions?.items || []).map((p) => ({ date: p.predicted_at.slice(0, 10), risk_score: p.risk_score }))} />
                    </div>
                    <WhatIfSimulator villageId={id} />
                    <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-accent/20">
                            <h3 className="text-sm font-semibold text-text-primary">Prediction History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-accent/20">
                                        <th className="text-left py-2 px-4 text-text-muted">Time</th>
                                        <th className="text-center py-2 px-4 text-text-muted">Risk</th>
                                        <th className="text-left py-2 px-4 text-text-muted">Disease</th>
                                        <th className="text-left py-2 px-4 text-text-muted">Model</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(predictions?.items || []).map((p) => (
                                        <tr key={p.id} className="border-b border-accent/10">
                                            <td className="py-2 px-4 font-mono text-text-secondary">{new Date(p.predicted_at).toLocaleString()}</td>
                                            <td className="py-2 px-4 text-center"><span className="font-mono font-bold">{p.risk_score.toFixed(1)}</span></td>
                                            <td className="py-2 px-4 text-text-primary">{p.predicted_disease || '--'}</td>
                                            <td className="py-2 px-4 text-text-muted">v{p.model_version}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Forensics' && (
                <div className="space-y-6">
                    {forensics && forensics.length > 0 ? (
                        <>
                            {forensics.map((r) => <ForensicsCard key={r.id} report={r} showLink={false} />)}
                            <ContaminationTimeline events={forensics.map((r) => ({
                                time: 'T+0', label: 'Detection', description: r.contamination_source, type: 'detection' as const,
                            }))} />
                        </>
                    ) : (
                        <div className="bg-surface border border-accent/30 rounded-xl p-8 text-center">
                            <p className="text-sm text-text-muted">No contamination events detected for this village</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'Legal' && (
                <div className="space-y-4">
                    {legal && legal.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {legal.map((doc) => <LegalDocumentCard key={doc.id} document={doc} />)}
                        </div>
                    ) : (
                        <div className="bg-surface border border-accent/30 rounded-xl p-8 text-center">
                            <p className="text-sm text-text-muted">No legal documents for this village</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
