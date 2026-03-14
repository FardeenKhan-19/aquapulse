'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, } from 'recharts';
import { MapPin, Bell, AlertTriangle, Activity, Shield, Users, TrendingUp, TrendingDown, Minus, ChevronRight, CheckCircle2, LogOut, Menu, X, Droplets, Factory, Leaf, Wrench, HelpCircle, MessageSquare, BarChart3, Scale, Send, Eye, Filter, Zap, Thermometer, Wind, Gauge, FlaskConical, LayoutDashboard, } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'baseline' | 'low' | 'medium' | 'high' | 'critical';
type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

interface Village {
    id: string;
    name: string;
    district: string;
    state: string;
    population: number;
    riskScore: number;
    riskLevel: RiskLevel;
    primaryWaterSource: string;
    sensorsOnline: number;
    sensorsTotal: number;
    lastUpdated: string;
    predictedDisease: string | null;
    diseaseConfidence: number | null;
    activeAlerts: number;
    tdsReadings: number[];
    currentTds: number;
    currentTemp: number;
    currentTurbidity: number;
    currentPh: number;
    lat: number;
    lng: number;
}

interface Alert {
    id: string;
    villageId: string;
    villageName: string;
    severity: AlertSeverity;
    type: string;
    message: string;
    time: string;
    isAcknowledged: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_VILLAGES: Village[] = [
    {
        id: 'v1', name: 'Dharangaon', district: 'Jalgaon', state: 'Maharashtra',
        population: 28400, riskScore: 87, riskLevel: 'critical',
        primaryWaterSource: 'Tapi River', sensorsOnline: 3, sensorsTotal: 4,
        lastUpdated: '2 min ago', predictedDisease: 'Cholera', diseaseConfidence: 0.91,
        activeAlerts: 3, tdsReadings: [320, 340, 390, 420, 580, 740, 890, 1020, 1180, 1340, 1290, 1410],
        currentTds: 1410, currentTemp: 28.4, currentTurbidity: 18.2, currentPh: 6.1,
        lat: 21.0148, lng: 74.9761,
    },
    {
        id: 'v2', name: 'Pachora', district: 'Jalgaon', state: 'Maharashtra',
        population: 47200, riskScore: 62, riskLevel: 'medium',
        primaryWaterSource: 'Borewell', sensorsOnline: 5, sensorsTotal: 5,
        lastUpdated: '5 min ago', predictedDisease: 'Typhoid', diseaseConfidence: 0.74,
        activeAlerts: 1, tdsReadings: [410, 430, 420, 450, 480, 510, 530, 520, 540, 560, 570, 580],
        currentTds: 580, currentTemp: 26.1, currentTurbidity: 4.8, currentPh: 7.2,
        lat: 20.7842, lng: 75.3466,
    },
    {
        id: 'v3', name: 'Erandol', district: 'Jalgaon', state: 'Maharashtra',
        population: 19800, riskScore: 28, riskLevel: 'low',
        primaryWaterSource: 'Girna Canal', sensorsOnline: 3, sensorsTotal: 3,
        lastUpdated: '8 min ago', predictedDisease: null, diseaseConfidence: null,
        activeAlerts: 0, tdsReadings: [280, 295, 290, 285, 300, 310, 305, 298, 302, 295, 288, 292],
        currentTds: 292, currentTemp: 25.3, currentTurbidity: 2.1, currentPh: 7.6,
        lat: 20.9219, lng: 75.3320,
    },
    {
        id: 'v4', name: 'Bhadgaon', district: 'Jalgaon', state: 'Maharashtra',
        population: 14600, riskScore: 71, riskLevel: 'high',
        primaryWaterSource: 'Waghur Dam', sensorsOnline: 2, sensorsTotal: 4,
        lastUpdated: '12 min ago', predictedDisease: 'Hepatitis A', diseaseConfidence: 0.68,
        activeAlerts: 2, tdsReadings: [350, 380, 420, 460, 510, 550, 610, 650, 680, 720, 740, 760],
        currentTds: 760, currentTemp: 27.8, currentTurbidity: 9.4, currentPh: 6.8,
        lat: 20.6614, lng: 75.7090,
    },
    {
        id: 'v5', name: 'Chalisgaon', district: 'Jalgaon', state: 'Maharashtra',
        population: 62100, riskScore: 18, riskLevel: 'baseline',
        primaryWaterSource: 'Girna River', sensorsOnline: 6, sensorsTotal: 6,
        lastUpdated: '3 min ago', predictedDisease: null, diseaseConfidence: null,
        activeAlerts: 0, tdsReadings: [220, 230, 225, 218, 222, 235, 228, 224, 230, 226, 221, 224],
        currentTds: 224, currentTemp: 24.9, currentTurbidity: 1.4, currentPh: 7.8,
        lat: 20.4625, lng: 74.9952,
    },
    {
        id: 'v6', name: 'Jamner', district: 'Jalgaon', state: 'Maharashtra',
        population: 31700, riskScore: 45, riskLevel: 'medium',
        primaryWaterSource: 'Borewell', sensorsOnline: 3, sensorsTotal: 4,
        lastUpdated: '18 min ago', predictedDisease: 'Gastroenteritis', diseaseConfidence: 0.55,
        activeAlerts: 1, tdsReadings: [380, 395, 410, 400, 420, 430, 445, 438, 450, 462, 455, 468],
        currentTds: 468, currentTemp: 26.7, currentTurbidity: 5.9, currentPh: 7.0,
        lat: 20.8072, lng: 75.7891,
    },
];

const MOCK_ALERTS: Alert[] = [
    {
        id: 'a1', villageId: 'v1', villageName: 'Dharangaon', severity: 'critical',
        type: 'outbreak_risk', message: 'Risk score crossed CRITICAL threshold (87/100). Cholera outbreak predicted with 91% confidence. Immediate action required.',
        time: '4 min ago', isAcknowledged: false,
    },
    {
        id: 'a2', villageId: 'v1', villageName: 'Dharangaon', severity: 'critical',
        type: 'contamination_detected', message: 'TDS reading 1,410 ppm — 4.7× above safe limit. Industrial effluent pattern detected. Forensic analysis initiated.',
        time: '12 min ago', isAcknowledged: false,
    },
    {
        id: 'a3', villageId: 'v4', villageName: 'Bhadgaon', severity: 'high',
        type: 'sensor_offline', message: '2 of 4 sensor nodes offline. GPS: 20.6614°N, 75.7090°E. Coverage gap in northern sector.',
        time: '28 min ago', isAcknowledged: false,
    },
    {
        id: 'a4', villageId: 'v4', villageName: 'Bhadgaon', severity: 'high',
        type: 'outbreak_risk', message: 'Hepatitis A risk elevated to HIGH (71/100). Waghur Dam source shows turbidity anomaly.',
        time: '1 hr ago', isAcknowledged: false,
    },
    {
        id: 'a5', villageId: 'v2', villageName: 'Pachora', severity: 'medium',
        type: 'sensor_anomaly', message: 'pH reading 6.1 — below safe threshold. Potential acidification event. Monitoring closely.',
        time: '2 hr ago', isAcknowledged: true,
    },
];

const TDS_TIMELINE_DATA = Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - 23 + i + 24) % 24;
    const baseVal = 320;
    const spike = i > 14 ? Math.pow(i - 14, 1.8) * 18 : 0;
    const noise = (Math.random() - 0.5) * 40;
    return {
        time: `${String(hour).padStart(2, '0')}:00`,
        tds: Math.round(baseVal + spike + noise),
        baseline: 300,
        warning: 600,
        critical: 1000,
    };
});

// ─── Utility Functions ─────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string; label: string; textColor: string }> = {
    baseline: { color: '#1d9e75', bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)', label: 'Baseline', textColor: 'text-teal-400' },
    low: { color: '#639922', bg: 'rgba(99,153,34,0.12)', border: 'rgba(99,153,34,0.3)', label: 'Low Risk', textColor: 'text-green-400' },
    medium: { color: '#ef9f27', bg: 'rgba(239,159,39,0.12)', border: 'rgba(239,159,39,0.3)', label: 'Medium', textColor: 'text-amber-400' },
    high: { color: '#d85a30', bg: 'rgba(216,90,48,0.12)', border: 'rgba(216,90,48,0.3)', label: 'High Risk', textColor: 'text-orange-400' },
    critical: { color: '#e24b4a', bg: 'rgba(226,75,74,0.12)', border: 'rgba(226,75,74,0.3)', label: 'Critical', textColor: 'text-coral' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; icon: React.ReactNode; bg: string }> = {
    info: { color: 'text-blue-400', icon: <Activity className="w-4 h-4" />, bg: 'bg-blue-400/10' },
    low: { color: 'text-slate-400', icon: <Activity className="w-4 h-4" />, bg: 'bg-slate-400/10' },
    medium: { color: 'text-amber-400', icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-amber-400/10' },
    high: { color: 'text-orange-400', icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-orange-400/10' },
    critical: { color: 'text-coral', icon: <Zap className="w-4 h-4" />, bg: 'bg-coral/10' },
};

function RiskBadge({ level }: { level: RiskLevel }) {
    const cfg = RISK_CONFIG[level];
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
            {cfg.label}
        </span>
    );
}

function TdsSpark({ readings }: { readings: number[] }) {
    const max = Math.max(...readings);
    const min = Math.min(...readings);
    const range = max - min || 1;
    const w = 80, h = 28;
    const pts = readings.map((v, i) => {
        const x = (i / (readings.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
    });
    const lastVal = readings[readings.length - 1];
    const isRising = readings[readings.length - 1] > readings[readings.length - 2];
    const color = lastVal > 1000 ? '#e24b4a' : lastVal > 600 ? '#ef9f27' : '#1d9e75';

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <polyline
                points={pts.join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={parseFloat(pts[pts.length - 1].split(',')[0])} cy={parseFloat(pts[pts.length - 1].split(',')[1])} r="2.5" fill={color} />
        </svg>
    );
}

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
    const cfg = RISK_CONFIG[level];
    const angle = (score / 100) * 180;
    const r = 36;
    const cx = 50, cy = 50;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startX = cx + r * Math.cos(toRad(180));
    const startY = cy + r * Math.sin(toRad(180));
    const endX = cx + r * Math.cos(toRad(180 - angle));
    const endY = cy + r * Math.sin(toRad(180 - angle));
    const largeArc = angle > 180 ? 1 : 0;

    return (
        <div className="relative flex items-center justify-center">
            <svg width="80" height="48" viewBox="0 0 100 60">
                {/* Track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="7"
                    strokeLinecap="round"
                />
                {/* Value arc */}
                <path
                    d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${cfg.color}80)` }}
                />
                {/* Score text */}
                <text x={cx} y={cy + 4} textAnchor="middle" fill={cfg.color} fontSize="14" fontWeight="700" fontFamily="JetBrains Mono">
                    {score}
                </text>
            </svg>
        </div>
    );
}



// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sub, icon: Icon, color, trend, alert,
}: {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'flat';
    alert?: boolean;
}) {
    return (
        <div
            className={`rounded-xl p-4 border transition-all duration-200 hover:scale-[1.01] cursor-default
        ${alert ? 'bg-coral/8 border-coral/30' : 'bg-navy-800 border-navy-600 hover:border-navy-500'}`}
            style={alert ? { boxShadow: '0 0 16px rgba(226,75,74,0.12)' } : {}}
        >
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                >
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {trend && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-coral' : trend === 'down' ? 'text-teal-400' : 'text-slate-500'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </span>
                )}
            </div>
            <div className="font-mono text-2xl font-bold text-white mb-0.5 tabular-nums" style={{ color: alert ? '#e24b4a' : undefined }}>
                {value}
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className="text-xs text-slate-500">{sub}</div>
        </div>
    );
}

// ─── Village Risk Card ────────────────────────────────────────────────────────

function VillageRiskCard({ village, onViewDetails }: { village: Village; onViewDetails: () => void }) {
    const cfg = RISK_CONFIG[village.riskLevel];
    const isCritical = village.riskLevel === 'critical';
    const isHigh = village.riskLevel === 'high';

    const sensorReading = (label: string, value: number, unit: string, icon: React.ReactNode, safe: [number, number]) => {
        const isOk = value >= safe[0] && value <= safe[1];
        return (
            <div className="flex items-center gap-1.5">
                <span className="text-slate-600">{icon}</span>
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`font-mono text-xs font-semibold ml-auto ${isOk ? 'text-teal-400' : 'text-coral'}`}>
                    {value}{unit}
                </span>
            </div>
        );
    };

    return (
        <div
            className={`rounded-xl border transition-all duration-200 hover:scale-[1.01] overflow-hidden
        ${isCritical ? 'bg-coral/5 border-coral/30' : isHigh ? 'bg-orange-500/5 border-orange-500/25' : 'bg-navy-800 border-navy-600 hover:border-navy-500'}`}
            style={isCritical ? { boxShadow: '0 0 20px rgba(226,75,74,0.15)' } : {}}
        >
            {/* Critical banner */}
            {isCritical && (
                <div className="bg-coral/20 border-b border-coral/30 px-3 py-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-coral animate-pulse" />
                    <span className="text-xs font-bold text-coral uppercase tracking-wider">Critical — Immediate Action</span>
                </div>
            )}

            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">{village.name}</h3>
                        <p className="text-xs text-slate-500">{village.district}, {village.state}</p>
                    </div>
                    <RiskBadge level={village.riskLevel} />
                </div>

                {/* Gauge + TDS */}
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex flex-col items-center">
                        <RiskGauge score={village.riskScore} level={village.riskLevel} />
                        <span className="text-[10px] text-slate-500 mt-0.5">Risk Score</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">TDS (24h)</span>
                            <span className={`font-mono text-xs font-bold ${village.currentTds > 1000 ? 'text-coral' : village.currentTds > 600 ? 'text-amber-400' : 'text-teal-400'}`}>
                                {village.currentTds} ppm
                            </span>
                        </div>
                        <TdsSpark readings={village.tdsReadings} />
                    </div>
                </div>

                {/* Sensor readings */}
                <div className="space-y-1.5 mb-3">
                    {sensorReading('Temp', village.currentTemp, '°C', <Thermometer className="w-3 h-3" />, [20, 30])}
                    {sensorReading('Turbidity', village.currentTurbidity, ' NTU', <Wind className="w-3 h-3" />, [0, 5])}
                    {sensorReading('pH', village.currentPh, '', <Gauge className="w-3 h-3" />, [6.5, 8.5])}
                </div>

                {/* Disease prediction */}
                {village.predictedDisease && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-400 font-medium">
                                ⚠ {village.predictedDisease} predicted
                            </span>
                            <span className="font-mono text-xs text-purple-300">
                                {Math.round((village.diseaseConfidence || 0) * 100)}% conf.
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${village.sensorsOnline === village.sensorsTotal ? 'bg-teal-400' : 'bg-amber-400'}`} />
                            {village.sensorsOnline}/{village.sensorsTotal} sensors
                        </span>
                        {village.activeAlerts > 0 && (
                            <span className="flex items-center gap-1 text-coral">
                                <Bell className="w-3 h-3" />
                                {village.activeAlerts}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-mono">{village.lastUpdated}</span>
                        <button
                            onClick={onViewDetails}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-cyan-400 hover:bg-cyan-400/10 border border-cyan-400/20 hover:border-cyan-400/40 transition-colors"
                        >
                            Details <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── TDS Timeline Chart ───────────────────────────────────────────────────────

function TdsChart() {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        const val = payload[0]?.value;
        return (
            <div className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 shadow-xl">
                <p className="text-xs text-slate-400 mb-1 font-mono">{label}</p>
                <p className="text-sm font-bold text-white font-mono">{val} ppm</p>
                <p className={`text-xs font-mono ${val > 1000 ? 'text-coral' : val > 600 ? 'text-amber-400' : 'text-teal-400'}`}>
                    {val > 1000 ? '🔴 Critical' : val > 600 ? '🟡 Warning' : '🟢 Safe'}
                </p>
            </div>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={180}>
            <LineChart data={TDS_TIMELINE_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                <defs>
                    <linearGradient id="tdsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={300} stroke="#1d9e75" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Baseline', position: 'insideTopLeft', fill: '#1d9e75', fontSize: 9 }} />
                <ReferenceLine y={600} stroke="#ef9f27" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Warning', position: 'insideTopLeft', fill: '#ef9f27', fontSize: 9 }} />
                <ReferenceLine y={1000} stroke="#e24b4a" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Critical', position: 'insideTopLeft', fill: '#e24b4a', fontSize: 9 }} />
                <Line type="monotone" dataKey="tds" stroke="#00d4ff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#00d4ff' }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({ alerts, onAcknowledge }: { alerts: Alert[]; onAcknowledge: (id: string) => void }) {
    return (
        <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-coral" />
                    <h2 className="text-sm font-semibold text-white">Active Alerts</h2>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-coral/20 text-coral font-mono font-semibold">
                        {alerts.filter(a => !a.isAcknowledged).length}
                    </span>
                </div>
                <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View all <ChevronRight className="w-3 h-3" />
                </button>
            </div>
            <div className="divide-y divide-navy-600">
                {alerts.map((alert) => {
                    const cfg = SEVERITY_CONFIG[alert.severity];
                    return (
                        <div
                            key={alert.id}
                            className={`px-4 py-3 flex items-start gap-3 transition-colors hover:bg-navy-700/50 ${alert.isAcknowledged ? 'opacity-50' : ''}`}
                        >
                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                <span className={cfg.color}>{cfg.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-white">{alert.villageName}</span>
                                    <span className={`text-xs ${cfg.color} font-medium capitalize`}>{alert.severity}</span>
                                    {alert.isAcknowledged && (
                                        <span className="text-xs text-teal-400 flex items-center gap-0.5">
                                            <CheckCircle2 className="w-3 h-3" /> ACK
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 truncate">{alert.message}</p>
                                <p className="text-xs text-slate-600 font-mono mt-0.5">{alert.time}</p>
                            </div>
                            {!alert.isAcknowledged && (
                                <button
                                    onClick={() => onAcknowledge(alert.id)}
                                    className="shrink-0 px-2 py-1 rounded text-xs text-slate-400 hover:text-teal-400 hover:bg-teal-400/10 border border-navy-500 hover:border-teal-400/30 transition-all"
                                >
                                    ACK
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ villages, alerts, onAcknowledge, onViewVillage }: {
    villages: Village[];
    alerts: Alert[];
    onAcknowledge: (id: string) => void;
    onViewVillage: (id: string) => void;
}) {
    const [chatInput, setChatInput] = useState('');
    const router = useRouter();
    const unackedAlerts = alerts.filter(a => !a.isAcknowledged).length;
    const criticalVillage = villages.reduce((prev, curr) => curr.riskScore > prev.riskScore ? curr : prev);
    const totalPopAtRisk = villages.filter(v => ['high', 'critical'].includes(v.riskLevel)).reduce((sum, v) => sum + v.population, 0);

    return (
        <div className="space-y-6">
            {/* Critical Alert Banner */}
            {criticalVillage.riskLevel === 'critical' && (
                <div className="rounded-xl border border-coral/40 bg-coral/8 px-4 py-3 flex items-center gap-3 animate-slide-up"
                    style={{ boxShadow: '0 0 20px rgba(226,75,74,0.12)' }}>
                    <Zap className="w-5 h-5 text-coral animate-pulse shrink-0" />
                    <div className="flex-1">
                        <span className="text-sm font-bold text-coral">CRITICAL OUTBREAK RISK — {criticalVillage.name}</span>
                        <span className="text-xs text-slate-400 ml-2">
                            Risk score {criticalVillage.riskScore}/100 · {criticalVillage.predictedDisease} predicted · {(criticalVillage.diseaseConfidence! * 100).toFixed(0)}% confidence
                        </span>
                    </div>
                    <button
                        onClick={() => onViewVillage(criticalVillage.id)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-coral text-white text-xs font-semibold hover:bg-coral/90 transition-colors"
                    >
                        View Now
                    </button>
                </div>
            )}

            {/* KPI Cards — 4 cards, 2-col mobile, 4-col desktop */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Villages Monitored"
                    value={villages.length}
                    sub="Jalgaon District, MH"
                    icon={MapPin}
                    color="#00d4ff"
                    trend="flat"
                />
                <KpiCard
                    label="Active Alerts"
                    value={unackedAlerts}
                    sub={`${alerts.length} total this week`}
                    icon={Bell}
                    color="#e24b4a"
                    trend="up"
                    alert={unackedAlerts > 0}
                />
                <KpiCard
                    label="Highest Risk"
                    value={criticalVillage.riskScore}
                    sub={`${criticalVillage.name} — ${RISK_CONFIG[criticalVillage.riskLevel].label}`}
                    icon={AlertTriangle}
                    color="#e24b4a"
                    trend="up"
                    alert
                />
                <KpiCard
                    label="Cases Prevented"
                    value="2,847"
                    sub="March 2026 · All villages"
                    icon={Shield}
                    color="#1d9e75"
                    trend="up"
                />
            </div>

            {/* TDS Chart + Alerts */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {/* TDS Timeline */}
                <div className="xl:col-span-3 rounded-xl bg-navy-800 border border-navy-600 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-white">Dharangaon TDS — Last 24 Hours</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Tapi River intake · Sensor Node JS-DH-001</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-coral">1,410</span>
                            <span className="text-xs text-slate-500">ppm</span>
                            <span className="flex items-center gap-0.5 text-xs text-coral">
                                <TrendingUp className="w-3 h-3" /> +340%
                            </span>
                        </div>
                    </div>
                    <TdsChart />
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-teal-400 inline-block rounded" /> Baseline (300)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" /> Warning (600)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-coral inline-block rounded" /> Critical (1000)</span>
                    </div>
                </div>

                {/* Alerts */}
                <div className="xl:col-span-2">
                    <AlertsPanel alerts={alerts.slice(0, 5)} onAcknowledge={onAcknowledge} />
                </div>
            </div>

            {/* Village Cards Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        Village Risk Status
                        <span className="text-xs text-slate-500 font-normal">— {villages.length} villages monitored</span>
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-mono">{totalPopAtRisk.toLocaleString('en-IN')} population at risk</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
                    {villages.map((v) => (
                        <VillageRiskCard key={v.id} village={v} onViewDetails={() => onViewVillage(v.id)} />
                    ))}
                </div>
            </div>

            {/* AI Assistant Quick Access */}
            <div className="rounded-xl bg-navy-800 border border-purple-500/20 p-4"
                style={{ boxShadow: '0 0 20px rgba(127,119,221,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <h2 className="text-sm font-semibold text-white">Ask AquaPulse AI</h2>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Claude 3.5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                    Ask about water quality trends, contamination sources, disease risk factors, or legal filing status across your assigned villages.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g. Why is Dharangaon TDS spiking? What is the contamination source?"
                        className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && chatInput.trim()) {
                                toast.success('Opening AI Assistant...', { duration: 2000 });
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            if (chatInput.trim()) toast.success('Opening AI Assistant...', { duration: 2000 });
                        }}
                        className="px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {[
                        'Why is Dharangaon at critical risk?',
                        'Which villages need immediate field visit?',
                        'What is the contamination source in Bhadgaon?',
                    ].map((q) => (
                        <button
                            key={q}
                            onClick={() => setChatInput(q)}
                            className="text-xs px-2.5 py-1 rounded-full bg-navy-700 border border-navy-500 text-slate-400 hover:text-purple-400 hover:border-purple-500/30 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Village List Tab ─────────────────────────────────────────────────────────

function VillagesTab({ villages, onViewVillage }: { villages: Village[]; onViewVillage: (id: string) => void }) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'riskScore' | 'name' | 'population'>('riskScore');
    const [filterLevel, setFilterLevel] = useState<RiskLevel | 'all'>('all');

    const filtered = villages
        .filter(v => {
            const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                v.district.toLowerCase().includes(search.toLowerCase());
            const matchLevel = filterLevel === 'all' || v.riskLevel === filterLevel;
            return matchSearch && matchLevel;
        })
        .sort((a, b) => {
            if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return b.population - a.population;
        });

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search villages or districts..."
                        className="w-full bg-navy-800 border border-navy-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/40 transition-all"
                    />
                </div>
                <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-400/40"
                >
                    <option value="all">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="baseline">Baseline</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-400/40"
                >
                    <option value="riskScore">Sort: Risk Score</option>
                    <option value="name">Sort: Name</option>
                    <option value="population">Sort: Population</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-navy-600 bg-navy-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Village</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Population</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Risk Score</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Risk Level</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Current TDS</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Alerts</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Sensors</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {filtered.map((v) => {
                                const cfg = RISK_CONFIG[v.riskLevel];
                                return (
                                    <tr key={v.id} className="hover:bg-navy-700/40 transition-colors group cursor-pointer" onClick={() => onViewVillage(v.id)}>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-white">{v.name}</p>
                                                <p className="text-xs text-slate-500">{v.district}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-slate-300">{v.population.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${v.riskScore}%`, backgroundColor: cfg.color }} />
                                                </div>
                                                <span className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{v.riskScore}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><RiskBadge level={v.riskLevel} /></td>
                                        <td className="px-4 py-3">
                                            <span className={`font-mono text-sm font-semibold ${v.currentTds > 1000 ? 'text-coral' : v.currentTds > 600 ? 'text-amber-400' : 'text-teal-400'}`}>
                                                {v.currentTds} ppm
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {v.activeAlerts > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-coral font-mono font-semibold">
                                                    <Bell className="w-3 h-3" /> {v.activeAlerts}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-600">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-mono ${v.sensorsOnline < v.sensorsTotal ? 'text-amber-400' : 'text-teal-400'}`}>
                                                {v.sensorsOnline}/{v.sensorsTotal}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-lg text-xs text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/10 transition-all flex items-center gap-1 ml-auto">
                                                <Eye className="w-3 h-3" /> View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-navy-600 flex items-center justify-between text-xs text-slate-500">
                    <span>Showing {filtered.length} of {villages.length} villages</span>
                    <span className="font-mono">Last sync: {new Date().toLocaleTimeString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Forensics Tab ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    industrial_effluent: { icon: Factory, color: '#e24b4a', bg: 'bg-coral/10', label: 'Industrial Effluent' },
    sewage_overflow: { icon: Droplets, color: '#ef9f27', bg: 'bg-amber-400/10', label: 'Sewage Overflow' },
    fertilizer_runoff: { icon: Leaf, color: '#639922', bg: 'bg-green-500/10', label: 'Fertilizer Runoff' },
    pipe_corrosion: { icon: Wrench, color: '#94a3b8', bg: 'bg-slate-400/10', label: 'Pipe Corrosion' },
    unknown: { icon: HelpCircle, color: '#64748b', bg: 'bg-slate-500/10', label: 'Unknown Source' },
};

const MOCK_FORENSICS = [
    { id: 'f1', villageId: 'v1', villageName: 'Dharangaon', source: 'industrial_effluent', confidence: 0.94, contaminationStart: '2026-03-13T08:14:00Z', peakTds: 1410, upstreamKm: 3.2, status: 'legal_filed' },
    { id: 'f2', villageId: 'v4', villageName: 'Bhadgaon', source: 'sewage_overflow', confidence: 0.78, contaminationStart: '2026-03-13T06:30:00Z', peakTds: 760, upstreamKm: 1.8, status: 'report_generated' },
    { id: 'f3', villageId: 'v2', villageName: 'Pachora', source: 'fertilizer_runoff', confidence: 0.61, contaminationStart: '2026-03-12T14:00:00Z', peakTds: 580, upstreamKm: 5.4, status: 'monitoring' },
];

function ForensicsTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Contamination Forensics — March 2026</h2>
                <span className="text-xs text-slate-500">{MOCK_FORENSICS.length} active reports</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {MOCK_FORENSICS.map((f) => {
                    const src = SOURCE_CONFIG[f.source] || SOURCE_CONFIG.unknown;
                    const SrcIcon = src.icon;
                    return (
                        <div key={f.id} className="rounded-xl bg-navy-800 border border-navy-600 p-4 hover:border-navy-500 transition-colors">
                            <div className="flex items-start gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${src.bg}`}>
                                    <SrcIcon className="w-5 h-5" style={{ color: src.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-white">{f.villageName}</h3>
                                    <p className="text-xs text-slate-400">{src.label}</p>
                                </div>
                                <span className="font-mono text-lg font-bold" style={{ color: src.color }}>
                                    {Math.round(f.confidence * 100)}%
                                </span>
                            </div>

                            {/* Confidence bar */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                    <span>Source confidence</span>
                                    <span className="font-mono">{Math.round(f.confidence * 100)}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-navy-600 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${f.confidence * 100}%`, backgroundColor: src.color }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="text-center">
                                    <p className="font-mono text-sm font-bold text-white">{f.peakTds}</p>
                                    <p className="text-xs text-slate-500">Peak TDS</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-mono text-sm font-bold text-white">{f.upstreamKm} km</p>
                                    <p className="text-xs text-slate-500">Upstream</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-mono text-xs font-bold text-white">
                                        {new Date(f.contaminationStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs text-slate-500">Start time</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${f.status === 'legal_filed' ? 'bg-teal-500/15 text-teal-400' :
                                    f.status === 'report_generated' ? 'bg-purple-500/15 text-purple-400' : 'bg-navy-700 text-slate-400'
                                    }`}>
                                    {f.status === 'legal_filed' ? '⚖ Legal Filed' : f.status === 'report_generated' ? '📄 Report Ready' : '🔍 Monitoring'}
                                </span>
                                <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                                    Full report <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Legal Tab ────────────────────────────────────────────────────────────────

const MOCK_LEGAL = [
    { id: 'l1', village: 'Dharangaon', type: 'legal_affidavit', generated: '2026-03-13T10:30:00Z', status: 'filed', caseRef: 'CPCB/MH/2026/0892', filedAt: '2026-03-13T11:45:00Z' },
    { id: 'l2', village: 'Dharangaon', type: 'cpcb_complaint', generated: '2026-03-13T10:35:00Z', status: 'acknowledged', caseRef: 'CPCB/MH/2026/0893', filedAt: '2026-03-13T12:00:00Z' },
    { id: 'l3', village: 'Bhadgaon', type: 'health_alert', generated: '2026-03-13T09:00:00Z', status: 'generated', caseRef: 'NPCB/JLG/2026/0441', filedAt: null },
    { id: 'l4', village: 'Pachora', type: 'health_alert', generated: '2026-03-12T16:00:00Z', status: 'under_review', caseRef: 'NPCB/JLG/2026/0438', filedAt: '2026-03-12T17:00:00Z' },
];

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    health_alert: { label: 'Health Alert', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    legal_affidavit: { label: 'Legal Affidavit', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    cpcb_complaint: { label: 'CPCB Complaint', color: 'text-coral', bg: 'bg-coral/10' },
};

const FILING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    generated: { label: 'Generated', color: 'text-slate-400', bg: 'bg-slate-400/10' },
    filed: { label: 'Filed', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    acknowledged: { label: 'Acknowledged', color: 'text-teal-400', bg: 'bg-teal-400/10' },
    rejected: { label: 'Rejected', color: 'text-coral', bg: 'bg-coral/10' },
    under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

function LegalTab() {
    const [copied, setCopied] = useState<string | null>(null);

    const copyRef = (ref: string) => {
        navigator.clipboard.writeText(ref).catch(() => { });
        setCopied(ref);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-purple-400" />
                    Legal Documents
                </h2>
                <span className="text-xs text-slate-500">{MOCK_LEGAL.length} documents · Auto-generated by AquaPulse AI</span>
            </div>

            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-navy-600 bg-navy-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Village</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Document Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Generated</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Case Reference</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {MOCK_LEGAL.map((doc) => {
                                const docCfg = DOC_TYPE_CONFIG[doc.type];
                                const statusCfg = FILING_STATUS_CONFIG[doc.status];
                                return (
                                    <tr key={doc.id} className="hover:bg-navy-700/40 transition-colors">
                                        <td className="px-4 py-3 text-sm text-white font-medium">{doc.village}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${docCfg.bg} ${docCfg.color}`}>
                                                {docCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                            {new Date(doc.generated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                            {' '}
                                            {new Date(doc.generated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-xs text-slate-300">{doc.caseRef}</span>
                                                <button
                                                    onClick={() => copyRef(doc.caseRef)}
                                                    className="text-slate-600 hover:text-cyan-400 transition-colors"
                                                    title="Copy case reference"
                                                >
                                                    {copied === doc.caseRef ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <Activity className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => toast.success(`Downloading ${doc.caseRef}.pdf...`)}
                                                    className="px-2 py-1 rounded text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 border border-navy-500 hover:border-cyan-400/20 transition-all"
                                                >
                                                    PDF
                                                </button>
                                                <button className="px-2 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-navy-600 border border-navy-500 transition-all">
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HealthOfficerDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [villages, setVillages] = useState<Village[]>(MOCK_VILLAGES);
    const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
    const [wsConnected, setWsConnected] = useState(true);
    const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);

    // Simulate WebSocket live updates
    useEffect(() => {
        const interval = setInterval(() => {
            setVillages(prev => prev.map(v => {
                if (v.id === 'v1') {
                    const delta = (Math.random() - 0.3) * 30;
                    const newTds = Math.max(800, Math.min(1600, v.currentTds + delta));
                    const newReadings = [...v.tdsReadings.slice(1), Math.round(newTds)];
                    return { ...v, currentTds: Math.round(newTds), tdsReadings: newReadings };
                }
                return v;
            }));
        }, 5000);

        // Simulate WS reconnect
        const wsTimer = setTimeout(() => setWsConnected(true), 1000);

        return () => { clearInterval(interval); clearTimeout(wsTimer); };
    }, []);

    const handleAcknowledge = (alertId: string) => {
        // Backend integration point: PUT /api/ho/alerts/{id}/acknowledge
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
        toast.success('Alert acknowledged', { duration: 3000 });
    };

    const handleViewVillage = (id: string) => {
        setSelectedVillageId(id);
        setActiveTab('villages');
        toast.info(`Loading ${villages.find(v => v.id === id)?.name} details...`, { duration: 2000 });
    };

    const unackedAlerts = alerts.filter(a => !a.isAcknowledged).length;

    const renderTab = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab villages={villages} alerts={alerts} onAcknowledge={handleAcknowledge} onViewVillage={handleViewVillage} />;
            case 'villages':
                return <VillagesTab villages={villages} onViewVillage={handleViewVillage} />;
            case 'alerts':
                return (
                    <div className="space-y-4">
                        <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledge} />
                    </div>
                );
            case 'forensics':
                return <ForensicsTab />;
            case 'legal':
                return <LegalTab />;
            case 'chatbot':
                return (
                    <div className="rounded-xl bg-navy-800 border border-purple-500/20 p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-60" />
                        <h3 className="text-lg font-semibold text-white mb-2">AI Assistant</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            Full AI chatbot interface with Claude 3.5. Ask about contamination sources, disease risk factors, legal filing status, or historical water quality trends.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {renderTab()}
        </div>
    );
}