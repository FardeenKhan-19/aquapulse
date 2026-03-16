'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, } from 'recharts';
import { MapPin, Bell, AlertTriangle, Activity, Shield, Users, TrendingUp, TrendingDown, Minus, Wifi, CheckCircle2, LogOut, Menu, X, Factory, Send, Eye, RefreshCw, Filter, Zap, LayoutDashboard, Server, Database, Cpu, Radio, Users2, Settings, Play, RotateCcw, Terminal, XCircle, Loader2, BrainCircuit, KeyRound, QrCode, Plus, Edit, ToggleLeft, ToggleRight, Download, Globe, } from 'lucide-react';
import { toast } from 'sonner';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { VillageMap } from '@/components/map/VillageMap';
import type { Village } from '@/lib/types/village';
import { adminApi, type ApiUsageResponse } from '@/lib/api/admin';
import { villagesApi } from '@/lib/api/villages';


type RiskLevel = 'baseline' | 'low' | 'medium' | 'high' | 'critical';
type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
type SensorStatus = 'online' | 'offline' | 'pending';
type ServiceStatus = 'healthy' | 'degraded' | 'down';

interface SensorNode {
    id: string; hardwareId: string; name: string; village: string; villageId: string;
    sensorTypes: string[]; status: SensorStatus; isApproved: boolean;
    lastSeen: string; battery: number; signal: number; lat: number; lng: number;
}

interface AdminUser {
    id: string; name: string; email: string; role: 'health_officer';
    assignedVillages: number; isActive: boolean; lastLogin: string; phone: string;
}

interface ServiceHealth {
    name: string; status: ServiceStatus; responseMs: number; detail: string; icon: React.ElementType;
}

interface DemoEvent {
    id: string; time: string; type: string; description: string;
    status: 'pending' | 'running' | 'complete' | 'error';
}

interface Alert {
    id: string; villageId: string; villageName: string; severity: AlertSeverity;
    type: string; message: string; time: string; isAcknowledged: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SENSORS: SensorNode[] = [
    { id: 's1', hardwareId: 'JS-DH-001', name: 'Dharangaon Main Intake', village: 'Dharangaon', villageId: 'v1', sensorTypes: ['TDS', 'Temp', 'pH', 'Turbidity'], status: 'online', isApproved: true, lastSeen: '1 min ago', battery: 78, signal: 92, lat: 21.0148, lng: 74.9761 },
    { id: 's2', hardwareId: 'JS-DH-002', name: 'Dharangaon Distribution Point', village: 'Dharangaon', villageId: 'v1', sensorTypes: ['TDS', 'Flow', 'Temp'], status: 'online', isApproved: true, lastSeen: '2 min ago', battery: 91, signal: 88, lat: 21.0152, lng: 74.9770 },
    { id: 's3', hardwareId: 'JS-DH-003', name: 'Dharangaon Tapi Riverbank', village: 'Dharangaon', villageId: 'v1', sensorTypes: ['TDS', 'Turbidity', 'pH'], status: 'online', isApproved: true, lastSeen: '3 min ago', battery: 64, signal: 74, lat: 21.0139, lng: 74.9750 },
    { id: 's4', hardwareId: 'JS-DH-004', name: 'Dharangaon Overhead Tank', village: 'Dharangaon', villageId: 'v1', sensorTypes: ['TDS', 'Humidity'], status: 'offline', isApproved: true, lastSeen: '2 hr ago', battery: 12, signal: 0, lat: 21.0160, lng: 74.9780 },
    { id: 's5', hardwareId: 'JS-PC-001', name: 'Pachora Borewell Alpha', village: 'Pachora', villageId: 'v2', sensorTypes: ['TDS', 'Temp', 'pH', 'Turbidity', 'Flow'], status: 'online', isApproved: true, lastSeen: '4 min ago', battery: 87, signal: 95, lat: 20.7842, lng: 75.3466 },
    { id: 's6', hardwareId: 'JS-BD-001', name: 'Bhadgaon Dam Outflow', village: 'Bhadgaon', villageId: 'v4', sensorTypes: ['TDS', 'Turbidity', 'Flow'], status: 'online', isApproved: true, lastSeen: '8 min ago', battery: 55, signal: 68, lat: 20.6614, lng: 75.7090 },
    { id: 's7', hardwareId: 'JS-BD-002', name: 'Bhadgaon Village Tap', village: 'Bhadgaon', villageId: 'v4', sensorTypes: ['TDS', 'pH'], status: 'offline', isApproved: true, lastSeen: '3 hr ago', battery: 8, signal: 0, lat: 20.6620, lng: 75.7100 },
    { id: 's8', hardwareId: 'JS-ER-001', name: 'Erandol Canal Monitor', village: 'Erandol', villageId: 'v3', sensorTypes: ['TDS', 'Temp', 'Turbidity'], status: 'online', isApproved: true, lastSeen: '6 min ago', battery: 93, signal: 97, lat: 20.9219, lng: 75.3320 },
    { id: 's9', hardwareId: 'JS-CH-001', name: 'Chalisgaon River Intake', village: 'Chalisgaon', villageId: 'v5', sensorTypes: ['TDS', 'Temp', 'pH', 'Turbidity', 'Flow', 'Humidity'], status: 'online', isApproved: true, lastSeen: '2 min ago', battery: 82, signal: 91, lat: 20.4625, lng: 74.9952 },
    { id: 's10', hardwareId: 'JS-JM-001', name: 'Jamner Borewell Monitor', village: 'Jamner', villageId: 'v6', sensorTypes: ['TDS', 'pH', 'Temp'], status: 'pending', isApproved: false, lastSeen: 'Never', battery: 100, signal: 0, lat: 20.8072, lng: 75.7891 },
];

const MOCK_USERS: AdminUser[] = [
    { id: 'u1', name: 'Dr. Priya Sharma', email: 'priya.sharma@aquapulse.gov.in', role: 'health_officer', assignedVillages: 6, isActive: true, lastLogin: '15 min ago', phone: '+91-9876543210' },
    { id: 'u2', name: 'Rajesh Patil', email: 'rajesh.patil@aquapulse.gov.in', role: 'health_officer', assignedVillages: 4, isActive: true, lastLogin: '2 hr ago', phone: '+91-9845678901' },
    { id: 'u3', name: 'Sunita Deshmukh', email: 'sunita.deshmukh@aquapulse.gov.in', role: 'health_officer', assignedVillages: 5, isActive: true, lastLogin: '1 day ago', phone: '+91-9823456789' },
    { id: 'u4', name: 'Anil Kumar Joshi', email: 'anil.joshi@aquapulse.gov.in', role: 'health_officer', assignedVillages: 3, isActive: false, lastLogin: '5 days ago', phone: '+91-9812345678' },
    { id: 'u5', name: 'Meera Kulkarni', email: 'meera.kulkarni@aquapulse.gov.in', role: 'health_officer', assignedVillages: 7, isActive: true, lastLogin: '30 min ago', phone: '+91-9801234567' },
];

const MOCK_SERVICES: ServiceHealth[] = [
    { name: 'API Server', status: 'healthy', responseMs: 42, detail: 'FastAPI v0.104.1 · 4 workers', icon: Server },
    { name: 'PostgreSQL', status: 'healthy', responseMs: 8, detail: '15.4 · 847 active connections', icon: Database },
    { name: 'Redis Cache', status: 'healthy', responseMs: 2, detail: '7.2.4 · 12.4 MB used', icon: Cpu },
    { name: 'Celery Workers', status: 'degraded', responseMs: 0, detail: '3/4 workers active · 1 restarting', icon: Settings },
    { name: 'WebSocket Server', status: 'healthy', responseMs: 18, detail: '47 active connections', icon: Wifi },
    { name: 'ML Pipeline', status: 'healthy', responseMs: 124, detail: 'XGBoost + RF + GBM ensemble', icon: BrainCircuit },
];

const CLAUDE_USAGE_DATA = Array.from({ length: 30 }, (_, i) => {
    const date = new Date('2026-03-13');
    date.setDate(date.getDate() - (29 - i));
    const isToday = i === 29;
    return {
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        tokens: isToday ? 84200 : Math.floor(20000 + Math.random() * 80000),
        alerts: Math.floor(2 + Math.random() * 15),
        legal: Math.floor(0 + Math.random() * 4),
    };
});

const MOCK_ALERTS: Alert[] = [
    { id: 'a1', villageId: 'v1', villageName: 'Dharangaon', severity: 'critical', type: 'outbreak_risk', message: 'Risk score crossed CRITICAL threshold (87/100). Cholera outbreak predicted with 91% confidence.', time: '4 min ago', isAcknowledged: false },
    { id: 'a2', villageId: 'v1', villageName: 'Dharangaon', severity: 'critical', type: 'contamination_detected', message: 'TDS reading 1,410 ppm — 4.7× above safe limit. Industrial effluent pattern detected.', time: '12 min ago', isAcknowledged: false },
    { id: 'a3', villageId: 'v4', villageName: 'Bhadgaon', severity: 'high', type: 'sensor_offline', message: '2 of 4 sensor nodes offline. Coverage gap in northern sector.', time: '28 min ago', isAcknowledged: false },
    { id: 'a4', villageId: 'v4', villageName: 'Bhadgaon', severity: 'high', type: 'outbreak_risk', message: 'Hepatitis A risk elevated to HIGH (71/100). Waghur Dam source shows turbidity anomaly.', time: '1 hr ago', isAcknowledged: false },
    { id: 'a5', villageId: 'v2', villageName: 'Pachora', severity: 'medium', type: 'sensor_anomaly', message: 'pH reading 6.1 — below safe threshold. Potential acidification event.', time: '2 hr ago', isAcknowledged: true },
];

const SYSTEM_LOG_LINES = [
    { level: 'INFO', time: '15:34:52', msg: 'Prediction engine: Dharangaon risk score updated 81→87 (critical threshold crossed)' },
    { level: 'CRITICAL', time: '15:34:51', msg: 'OUTBREAK ALERT: Dharangaon cholera risk 91% confidence — health officer notified' },
    { level: 'INFO', time: '15:34:48', msg: 'Sensor JS-DH-001 reading: TDS=1410ppm pH=6.1 Temp=28.4°C Turbidity=18.2NTU' },
    { level: 'INFO', time: '15:34:45', msg: 'Forensics engine: industrial_effluent pattern confirmed (94% confidence) for village_id=v1' },
    { level: 'INFO', time: '15:34:42', msg: 'Legal document generated: CPCB complaint CPCB/MH/2026/0892 for Dharangaon' },
    { level: 'WARNING', time: '15:32:10', msg: 'Sensor JS-DH-004 offline — battery critically low (12%). Last reading 2h ago.' },
    { level: 'INFO', time: '15:30:00', msg: 'Celery worker celery@worker-3 restarting after OOM kill (512MB limit)' },
    { level: 'WARNING', time: '15:29:55', msg: 'Celery worker count degraded: 3/4 active. Auto-scaling triggered.' },
    { level: 'INFO', time: '15:28:31', msg: 'WebSocket: 47 active connections (peak today: 52)' },
    { level: 'INFO', time: '15:25:00', msg: 'Claude API: 84,200 tokens used today ($0.253 estimated cost)' },
    { level: 'DEBUG', time: '15:20:14', msg: 'React Query cache invalidated for ["predictions","v1"] via WebSocket event' },
    { level: 'INFO', time: '15:18:40', msg: 'User priya.sharma acknowledged alert a3 (sensor_offline, Bhadgaon)' },
    { level: 'ERROR', time: '14:55:12', msg: 'Mapbox tile request timeout (2 retries, 3rd attempt succeeded) — latency spike' },
    { level: 'INFO', time: '14:50:00', msg: 'ML model retrain scheduled for 02:00 IST — 1,247 new readings since last train' },
    { level: 'INFO', time: '14:30:00', msg: 'Demo scenario reset completed — all village data restored to baseline' },
];

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, trend, delta }: {
    label: string; value: string | number; sub: string;
    icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'flat'; delta?: string;
}) {
    return (
        <div className="rounded-xl bg-navy-800 border border-navy-600 p-4 hover:border-navy-500 transition-all duration-200 hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {delta && (
                    <span className={`text-xs font-mono font-medium flex items-center gap-0.5 ${trend === 'up' ? 'text-coral' : trend === 'down' ? 'text-teal-400' : 'text-slate-500'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {delta}
                    </span>
                )}
            </div>
            <div className="font-mono text-2xl font-bold text-white mb-0.5 tabular-nums">{value}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className="text-xs text-slate-500">{sub}</div>
        </div>
    );
}

function StatusDot({ status }: { status: ServiceStatus }) {
    const cfg = {
        healthy: { color: 'bg-teal-400', glow: '0 0 6px rgba(29,158,117,0.8)' },
        degraded: { color: 'bg-amber-400', glow: '0 0 6px rgba(239,159,39,0.8)' },
        down: { color: 'bg-coral', glow: '0 0 6px rgba(226,75,74,0.8)' },
    }[status];
    return (
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.color} ${status !== 'healthy' ? 'animate-pulse' : ''}`}
            style={{ boxShadow: cfg.glow }} />
    );
}

function BatteryBar({ pct }: { pct: number }) {
    const color = pct < 20 ? '#e24b4a' : pct < 50 ? '#ef9f27' : '#1d9e75';
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="font-mono text-xs" style={{ color }}>{pct}%</span>
        </div>
    );
}

function SignalBars({ signal }: { signal: number }) {
    const bars = [25, 50, 75, 100];
    const color = signal === 0 ? '#475569' : signal < 40 ? '#e24b4a' : signal < 70 ? '#ef9f27' : '#1d9e75';
    return (
        <div className="flex items-end gap-0.5 h-4">
            {bars.map((threshold, i) => (
                <div key={i}
                    className="w-1 rounded-sm transition-all"
                    style={{
                        height: `${(i + 1) * 25}%`,
                        backgroundColor: signal >= threshold ? color : 'rgba(255,255,255,0.1)',
                    }}
                />
            ))}
        </div>
    );
}



// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ alerts, onAcknowledge, villages, apiUsage }: { alerts: Alert[]; onAcknowledge: (id: string) => void; villages: Village[]; apiUsage: ApiUsageResponse | null }) {
    const onlineSensors = MOCK_SENSORS.filter(s => s.status === 'online').length;
    const offlineSensors = MOCK_SENSORS.filter(s => s.status === 'offline').length;
    const todayTokens = apiUsage?.usage_by_day?.[0]?.total_tokens || 0;
    const unacked = alerts.filter(a => !a.isAcknowledged).length;

    const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; icon: React.ReactNode }> = {
        info: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: <Activity className="w-4 h-4" /> },
        low: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: <Activity className="w-4 h-4" /> },
        medium: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <AlertTriangle className="w-4 h-4" /> },
        high: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: <AlertTriangle className="w-4 h-4" /> },
        critical: { color: 'text-coral', bg: 'bg-coral/10', icon: <Zap className="w-4 h-4" /> },
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 shadow-xl text-xs">
                <p className="text-slate-400 font-mono mb-1">{label}</p>
                <p className="text-white font-bold font-mono">{payload[0]?.value?.toLocaleString()} tokens</p>
                <p className="text-slate-400">${((payload[0]?.value || 0) * 0.003 / 1000).toFixed(3)}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* KPI Row — 5 cards: 2-col mobile, 3-col tablet, 5-col desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                <KpiCard label="Total Villages" value={6} sub="Jalgaon District, MH" icon={MapPin} color="#00d4ff" trend="flat" />
                <KpiCard label="Active Sensors" value={`${onlineSensors}/${MOCK_SENSORS.length}`} sub={`${offlineSensors} offline right now`} icon={Radio} color={offlineSensors > 0 ? '#ef9f27' : '#1d9e75'} trend={offlineSensors > 0 ? 'up' : 'flat'} delta={offlineSensors > 0 ? `${offlineSensors} down` : undefined} />
                <KpiCard label="Health Officers" value={MOCK_USERS.filter(u => u.isActive).length} sub={`${MOCK_USERS.length} total registered`} icon={Users2} color="#7f77dd" trend="flat" />
                <KpiCard label="Active Alerts" value={unacked} sub="Unacknowledged system-wide" icon={Bell} color={unacked > 2 ? '#e24b4a' : '#ef9f27'} trend="up" delta={`+${unacked} today`} />
                <KpiCard label="Gemini Tokens" value={`${(todayTokens / 1000).toFixed(1)}K`} sub={`~$${(todayTokens * 0.003 / 1000).toFixed(2)} today`} icon={BrainCircuit} color="#7f77dd" trend="up" delta="today" />
            </div>

            {/* Village map placeholder + System health side-by-side */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Map placeholder */}
                <div className="xl:col-span-2 rounded-xl bg-navy-800 border border-navy-600 overflow-hidden" style={{ minHeight: 320 }}>
                    <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <h2 className="text-sm font-semibold text-white">Village Distribution Map</h2>
                            <span className="text-xs text-slate-500">Jalgaon District, Maharashtra</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-coral" /> Critical</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> High</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Medium</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Baseline</span>
                        </div>
                    </div>
                    {/* Mapbox integration point: replace with react-map-gl VillageMap component */}
                    <div style={{ height: 280, position: 'relative' }}>
                        <VillageMap
                            villages={villages}
                            height={280}
                            riskScores={villages.reduce((acc, v) => ({ ...acc, [v.id]: 0 }), {})}
                        />
                    </div>
                </div>

                {/* System Health */}
                <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                    <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-teal-400" />
                            <h2 className="text-sm font-semibold text-white">Service Health</h2>
                        </div>
                        <button className="text-xs text-slate-500 hover:text-cyan-400 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="divide-y divide-navy-700">
                        {MOCK_SERVICES.map((svc) => {
                            const SvcIcon = svc.icon;
                            return (
                                <div key={svc.name} className="px-4 py-3 flex items-center gap-3 hover:bg-navy-700/30 transition-colors">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${svc.status === 'healthy' ? 'bg-teal-400/10' : svc.status === 'degraded' ? 'bg-amber-400/10' : 'bg-coral/10'
                                        }`}>
                                        <SvcIcon className={`w-3.5 h-3.5 ${svc.status === 'healthy' ? 'text-teal-400' : svc.status === 'degraded' ? 'text-amber-400' : 'text-coral'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <StatusDot status={svc.status} />
                                            <span className="text-xs font-medium text-white">{svc.name}</span>
                                            {svc.responseMs > 0 && (
                                                <span className="font-mono text-[10px] text-slate-500">{svc.responseMs}ms</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{svc.detail}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="px-4 py-2 border-t border-navy-600 text-[10px] text-slate-600 font-mono">
                        Auto-refresh every 30s · Last: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Alerts + Claude Usage */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Active Alerts */}
                <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                    <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-coral" />
                            <h2 className="text-sm font-semibold text-white">System-wide Alerts</h2>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-coral/20 text-coral font-mono font-semibold">
                                {alerts.filter(a => !a.isAcknowledged).length}
                            </span>
                        </div>
                        <span className="text-xs text-slate-500">All villages</span>
                    </div>
                    <div className="divide-y divide-navy-700">
                        {alerts.map((alert) => {
                            const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; bg: string; icon: React.ReactNode }> = {
                                info: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: <Activity className="w-3.5 h-3.5" /> },
                                low: { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: <Activity className="w-3.5 h-3.5" /> },
                                medium: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                                high: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                                critical: { color: 'text-coral', bg: 'bg-coral/10', icon: <Zap className="w-3.5 h-3.5" /> },
                            };
                            const cfg = SEVERITY_CONFIG[alert.severity];
                            return (
                                <div key={alert.id} className={`px-4 py-2.5 flex items-start gap-2.5 hover:bg-navy-700/30 transition-colors ${alert.isAcknowledged ? 'opacity-40' : ''}`}>
                                    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                        <span className={cfg.color}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-xs font-semibold text-white">{alert.villageName}</span>
                                            <span className={`text-[10px] font-mono uppercase font-bold ${cfg.color}`}>{alert.severity}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-1">{alert.message}</p>
                                        <p className="text-[10px] text-slate-600 font-mono">{alert.time}</p>
                                    </div>
                                    {!alert.isAcknowledged && (
                                        <button onClick={() => onAcknowledge(alert.id)}
                                            className="shrink-0 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-teal-400 hover:bg-teal-400/10 border border-navy-500 hover:border-teal-400/30 transition-all font-medium">
                                            ACK
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Gemini API Usage Chart */}
                <div className="rounded-xl bg-navy-800 border border-navy-600 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-purple-400" />
                            <h2 className="text-sm font-semibold text-white">Gemini API Usage</h2>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-sm font-bold text-purple-400">{(todayTokens / 1000).toFixed(1)}K</p>
                            <p className="text-xs text-slate-500">tokens today</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={apiUsage?.usage_by_day?.slice(0, 14).reverse() || []} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={2} tickFormatter={(val) => val ? val.substring(5) : ''} />
                            <YAxis tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 shadow-xl text-xs">
                                            <p className="text-slate-400 font-mono mb-1">{label}</p>
                                            <p className="text-white font-bold font-mono">{payload[0]?.value?.toLocaleString()} tokens</p>
                                            <p className="text-slate-400">${((Number(payload[0]?.value) || 0) * 0.003 / 1000).toFixed(3)} est.</p>
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="total_tokens" fill="#7f77dd" radius={[2, 2, 0, 0]} opacity={0.8} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-navy-600">
                        <div className="text-center">
                            <p className="font-mono text-sm font-bold text-white">{apiUsage?.usage_by_day?.reduce((sum, day) => sum + day.total_tokens, 0).toLocaleString() || 0}</p>
                            <p className="text-xs text-slate-500">Tokens total</p>
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-sm font-bold text-white">{apiUsage?.usage_by_day?.reduce((sum, day) => sum + day.documents_generated, 0).toLocaleString() || 0}</p>
                            <p className="text-xs text-slate-500">Docs gen.</p>
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-sm font-bold text-white">${((apiUsage?.usage_by_day?.reduce((sum, day) => sum + day.total_tokens, 0) || 0) * 0.003 / 1000).toFixed(2)}</p>
                            <p className="text-xs text-slate-500">Est. cost</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sensor Fleet Summary */}
            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-sm font-semibold text-white">Sensor Fleet Status</h2>
                        <span className="text-xs text-slate-500">— offline nodes shown first</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 text-teal-400"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> {onlineSensors} Online</span>
                        <span className="flex items-center gap-1.5 text-coral"><span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" /> {offlineSensors} Offline</span>
                        <span className="flex items-center gap-1.5 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {MOCK_SENSORS.filter(s => s.status === 'pending').length} Pending</span>
                    </div>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-navy-700 bg-navy-900/50">
                                {['Hardware ID', 'Name', 'Village', 'Sensor Types', 'Status', 'Approved', 'Last Seen', 'Battery', 'Signal'].map(col => (
                                    <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {[...MOCK_SENSORS].sort((a, b) => {
                                const order: Record<SensorStatus, number> = { offline: 0, pending: 1, online: 2 };
                                return order[a.status] - order[b.status];
                            }).map((sensor) => (
                                <tr key={sensor.id} className={`hover:bg-navy-700/40 transition-colors group ${sensor.status === 'offline' ? 'bg-coral/3' : ''}`}>
                                    <td className="px-4 py-2.5">
                                        <span className="font-mono text-xs text-cyan-400">{sensor.hardwareId}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs text-white font-medium">{sensor.name}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs text-slate-400">{sensor.village}</span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex flex-wrap gap-1">
                                            {sensor.sensorTypes.map(t => (
                                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-navy-700 text-slate-400 font-mono border border-navy-600">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${sensor.status === 'online' ? 'bg-teal-400/10 text-teal-400' :
                                            sensor.status === 'offline' ? 'bg-coral/10 text-coral' : 'bg-amber-400/10 text-amber-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sensor.status === 'online' ? 'bg-teal-400' :
                                                sensor.status === 'offline' ? 'bg-coral animate-pulse' : 'bg-amber-400 animate-pulse'
                                                }`} />
                                            {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {sensor.isApproved
                                            ? <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                            : <XCircle className="w-4 h-4 text-amber-400" />}
                                    </td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{sensor.lastSeen}</td>
                                    <td className="px-4 py-2.5"><BatteryBar pct={sensor.battery} /></td>
                                    <td className="px-4 py-2.5"><SignalBars signal={sensor.signal} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
    const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleActive = (id: string) => {
        // Backend integration point: PATCH /api/admin/users/{id}
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
        const user = users.find(u => u.id === id);
        toast.success(`${user?.name} ${user?.isActive ? 'deactivated' : 'activated'}`);
    };

    const resetPassword = (id: string) => {
        // Backend integration point: POST /api/admin/users/{id}/reset-password
        const user = users.find(u => u.id === id);
        toast.success(`Password reset email sent to ${user?.email}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search officers..."
                            className="bg-navy-800 border border-navy-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/40 transition-all w-64"
                        />
                    </div>
                    <span className="text-xs text-slate-500">{filtered.length} officers</span>
                </div>
                <button
                    onClick={() => setShowNewUserModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/20 transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Officer
                </button>
            </div>

            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-navy-600 bg-navy-900/50">
                                {['Officer', 'Email', 'Assigned Villages', 'Status', 'Last Login', 'Actions'].map(col => (
                                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {filtered.map((user) => (
                                <tr key={user.id} className="hover:bg-navy-700/40 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/60 to-cyan-500/60 border border-navy-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                                                <div className="h-full rounded-full bg-cyan-400/60" style={{ width: `${(user.assignedVillages / 10) * 100}%` }} />
                                            </div>
                                            <span className="font-mono text-xs text-slate-300">{user.assignedVillages}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${user.isActive ? 'bg-teal-400/10 text-teal-400' : 'bg-slate-500/10 text-slate-500'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.lastLogin}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" title="Edit">
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => toggleActive(user.id)}
                                                className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {user.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => resetPassword(user.id)}
                                                className="p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
                                                title="Reset password"
                                            >
                                                <KeyRound className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-navy-600 flex items-center justify-between text-xs text-slate-500">
                    <span>{filtered.length} of {users.length} officers</span>
                    <span>{users.filter(u => u.isActive).length} active · {users.filter(u => !u.isActive).length} inactive</span>
                </div>
            </div>

            {/* New User Modal */}
            {showNewUserModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNewUserModal(false)}>
                    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-white">Register New Health Officer</h3>
                            <button onClick={() => setShowNewUserModal(false)} className="text-slate-500 hover:text-slate-300">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Backend integration point: POST /api/admin/users */}
                        <div className="space-y-4">
                            {[
                                { label: 'Full Name', placeholder: 'Dr. Firstname Lastname', type: 'text' },
                                { label: 'Email Address', placeholder: 'firstname.lastname@aquapulse.gov.in', type: 'email' },
                                { label: 'Mobile Number', placeholder: '+91-XXXXXXXXXX', type: 'tel' },
                                { label: 'Initial Password', placeholder: 'Min. 8 characters', type: 'password' },
                            ].map(field => (
                                <div key={field.label}>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">{field.label}</label>
                                    <input
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1.5">Assign Villages</label>
                                <select multiple className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400/40 h-24 scrollbar-thin">
                                    {['Dharangaon', 'Pachora', 'Erandol', 'Bhadgaon', 'Chalisgaon', 'Jamner'].map(v => (
                                        <option key={v} value={v.toLowerCase()}>{v}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple villages</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        toast.success('Health officer account created. Credentials sent via email.');
                                        setShowNewUserModal(false);
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/20 transition-colors"
                                >
                                    Create Account
                                </button>
                                <button onClick={() => setShowNewUserModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-navy-700 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sensors Tab ──────────────────────────────────────────────────────────────

function SensorsTab() {
    const [sensors, setSensors] = useState<SensorNode[]>(MOCK_SENSORS);
    const [showRegModal, setShowRegModal] = useState(false);
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [newSensorApiKey, setNewSensorApiKey] = useState('');
    const [apiKeyCopied, setApiKeyCopied] = useState(false);
    const [filterStatus, setFilterStatus] = useState<SensorStatus | 'all'>('all');
    const [filterVillage, setFilterVillage] = useState('all');

    const filtered = sensors.filter(s => {
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchVillage = filterVillage === 'all' || s.village === filterVillage;
        return matchStatus && matchVillage;
    });

    const villages = Array.from(new Set(sensors.map(s => s.village)));

    const approveSensor = (id: string) => {
        // Backend integration point: PATCH /api/admin/sensors/{id}/approve
        setSensors(prev => prev.map(s => s.id === id ? { ...s, isApproved: true } : s));
        toast.success('Sensor approved. It will begin sending readings within 60 seconds.');
    };

    const handleRegisterSensor = () => {
        // Backend integration point: POST /api/admin/sensors/register
        const mockKey = `jsk_live_${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`;
        setNewSensorApiKey(mockKey);
        setShowRegModal(false);
        setShowApiKeyModal(true);
    };

    const copyApiKey = () => {
        navigator.clipboard.writeText(newSensorApiKey).catch(() => { });
        setApiKeyCopied(true);
        setTimeout(() => setApiKeyCopied(false), 3000);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                        className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-400/40">
                        <option value="all">All Statuses</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="pending">Pending</option>
                    </select>
                    <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)}
                        className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-cyan-400/40">
                        <option value="all">All Villages</option>
                        {villages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <span className="text-xs text-slate-500">{filtered.length} sensors</span>
                </div>
                <button
                    onClick={() => setShowRegModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-400 text-sm font-medium hover:bg-teal-400/20 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Register Sensor
                </button>
            </div>

            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-navy-600 bg-navy-900/50">
                                {['Hardware ID', 'Name', 'Village', 'Sensor Types', 'Status', 'Approved', 'Last Seen', 'Battery', 'Signal', 'Actions'].map(col => (
                                    <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {[...filtered].sort((a, b) => {
                                const order: Record<SensorStatus, number> = { offline: 0, pending: 1, online: 2 };
                                return order[a.status] - order[b.status];
                            }).map((sensor) => (
                                <tr key={sensor.id} className={`hover:bg-navy-700/40 transition-colors group ${sensor.status === 'offline' ? 'bg-coral/3' : ''}`}>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-cyan-400">{sensor.hardwareId}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-white font-medium">{sensor.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{sensor.village}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {sensor.sensorTypes.map(t => (
                                                <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-navy-700 text-slate-400 font-mono border border-navy-600">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${sensor.status === 'online' ? 'bg-teal-400/10 text-teal-400' :
                                            sensor.status === 'offline' ? 'bg-coral/10 text-coral' : 'bg-amber-400/10 text-amber-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${sensor.status === 'online' ? 'bg-teal-400' :
                                                sensor.status === 'offline' ? 'bg-coral animate-pulse' : 'bg-amber-400 animate-pulse'
                                                }`} />
                                            {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {sensor.isApproved
                                            ? <CheckCircle2 className="w-4 h-4 text-teal-400" />
                                            : (
                                                <button onClick={() => approveSensor(sensor.id)}
                                                    className="text-xs px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400/20 transition-colors font-medium">
                                                    Approve
                                                </button>
                                            )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{sensor.lastSeen}</td>
                                    <td className="px-4 py-3"><BatteryBar pct={sensor.battery} /></td>
                                    <td className="px-4 py-3"><SignalBars signal={sensor.signal} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" title="View details">
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 transition-colors" title="Download QR">
                                                <QrCode className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Register Sensor Modal */}
            {showRegModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowRegModal(false)}>
                    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-semibold text-white">Register New Sensor Node</h3>
                            <button onClick={() => setShowRegModal(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Hardware ID', placeholder: 'JS-XX-XXX (printed on device)', helper: 'Found on the physical sensor label' },
                                { label: 'Sensor Name', placeholder: 'e.g. Dharangaon Main Intake', helper: 'Descriptive name for this location' },
                            ].map(f => (
                                <div key={f.label}>
                                    <label className="block text-xs font-medium text-slate-300 mb-1">{f.label}</label>
                                    <input type="text" placeholder={f.placeholder}
                                        className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-teal-400/40 transition-all" />
                                    <p className="text-xs text-slate-500 mt-1">{f.helper}</p>
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Assign to Village</label>
                                <select className="w-full bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-400/40">
                                    {['Dharangaon', 'Pachora', 'Erandol', 'Bhadgaon', 'Chalisgaon', 'Jamner'].map(v => (
                                        <option key={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">Sensor Capabilities</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['TDS', 'Temperature', 'pH', 'Turbidity', 'Flow Rate', 'Humidity'].map(cap => (
                                        <label key={cap} className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                                            <input type="checkbox" className="accent-teal-400 w-3.5 h-3.5" defaultChecked={['TDS', 'Temperature'].includes(cap)} />
                                            {cap}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleRegisterSensor}
                                    className="flex-1 py-2 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-400 text-sm font-medium hover:bg-teal-400/20 transition-colors">
                                    Register & Generate API Key
                                </button>
                                <button onClick={() => setShowRegModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-navy-700 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* API Key Modal — shown ONCE after registration */}
            {showApiKeyModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-navy-800 border border-teal-400/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        style={{ boxShadow: '0 0 40px rgba(29,158,117,0.15)' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-white">Sensor Registered Successfully</h3>
                                <p className="text-xs text-teal-400">Save the API key — it will not be shown again</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 mb-4 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300">
                                This API key is shown <strong>only once</strong>. Copy it now and store it securely. The sensor firmware must be flashed with this key before deployment.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">API Key</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-navy-900 border border-navy-600 rounded-lg px-3 py-2.5 font-mono text-xs text-cyan-400 overflow-x-auto scrollbar-thin">
                                    {newSensorApiKey}
                                </div>
                                <button
                                    onClick={copyApiKey}
                                    className={`shrink-0 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${apiKeyCopied
                                        ? 'bg-teal-400/10 border-teal-400/30 text-teal-400' : 'bg-navy-700 border-navy-500 text-slate-300 hover:text-white hover:border-cyan-400/30'
                                        }`}
                                >
                                    {apiKeyCopied ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* QR Code placeholder */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">QR Code for Field Deployment</label>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-900 border border-navy-600">
                                <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shrink-0">
                                    {/* Backend integration point: GET /api/admin/sensors/{id}/qr — returns base64 QR PNG */}
                                    <div className="w-20 h-20 bg-navy-900 rounded grid grid-cols-4 grid-rows-4 gap-0.5 p-1">
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-navy-900' : 'bg-white'}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400">Print and attach to sensor enclosure for field identification.</p>
                                    <button
                                        onClick={() => toast.success('QR code downloaded as PNG')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-navy-700 border border-navy-500 hover:border-navy-400 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download QR PNG
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="keyConfirm" className="accent-teal-400 w-4 h-4" />
                            <label htmlFor="keyConfirm" className="text-xs text-slate-400 cursor-pointer">
                                I have securely saved the API key and downloaded the QR code
                            </label>
                        </div>

                        <button
                            onClick={() => {
                                setShowApiKeyModal(false);
                                toast.success('Sensor registration complete. Awaiting first reading.');
                            }}
                            className="w-full mt-4 py-2.5 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-400 text-sm font-medium hover:bg-teal-400/20 transition-colors"
                        >
                            Close & Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── System Health Tab ────────────────────────────────────────────────────────

function SystemTab() {
    const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'DEBUG'>('ALL');
    const [autoScroll, setAutoScroll] = useState(true);
    const [retraining, setRetraining] = useState(false);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoScroll && logRef.current) {
            logRef.current.scrollTop = 0;
        }
    }, [autoScroll]);

    const filteredLogs = SYSTEM_LOG_LINES.filter(l => logFilter === 'ALL' || l.level === logFilter);

    const logColor: Record<string, string> = {
        DEBUG: 'text-slate-500',
        INFO: 'text-blue-400',
        WARNING: 'text-amber-400',
        ERROR: 'text-coral',
        CRITICAL: 'text-coral font-bold',
    };

    const triggerRetrain = () => {
        // Backend integration point: POST /api/admin/ml/retrain
        setRetraining(true);
        toast.success('ML retraining job queued. Job ID: celery-task-8f4a2b1c. ETA: ~12 minutes.');
        setTimeout(() => setRetraining(false), 5000);
    };

    return (
        <div className="space-y-4">
            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {MOCK_SERVICES.map((svc) => {
                    const SvcIcon = svc.icon;
                    return (
                        <div key={svc.name}
                            className={`rounded-xl p-4 border transition-all ${svc.status === 'healthy' ? 'bg-navy-800 border-navy-600' :
                                svc.status === 'degraded' ? 'bg-amber-400/5 border-amber-400/25' : 'bg-coral/5 border-coral/25'
                                }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${svc.status === 'healthy' ? 'bg-teal-400/10' :
                                    svc.status === 'degraded' ? 'bg-amber-400/10' : 'bg-coral/10'
                                    }`}>
                                    <SvcIcon className={`w-4 h-4 ${svc.status === 'healthy' ? 'text-teal-400' :
                                        svc.status === 'degraded' ? 'text-amber-400' : 'text-coral'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status={svc.status} />
                                        <span className="text-sm font-medium text-white">{svc.name}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{svc.detail}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className={`px-2 py-0.5 rounded-md font-medium ${svc.status === 'healthy' ? 'bg-teal-400/10 text-teal-400' :
                                    svc.status === 'degraded' ? 'bg-amber-400/10 text-amber-400' : 'bg-coral/10 text-coral'
                                    }`}>
                                    {svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
                                </span>
                                {svc.responseMs > 0 && (
                                    <span className="font-mono text-slate-500">{svc.responseMs}ms response</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ML Models + Retrain */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-xl bg-navy-800 border border-navy-600 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                        <h2 className="text-sm font-semibold text-white">ML Model Registry</h2>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: 'Outbreak Prediction Model', version: 'v2.4.1', trained: '2026-03-10', accuracy: 94.2, predictions: 1847, type: 'XGBoost + RF + GBM Ensemble' },
                            { name: 'Contamination Forensics Model', version: 'v1.8.3', trained: '2026-03-08', accuracy: 91.7, predictions: 423, type: 'Pattern Classification CNN' },
                        ].map((model) => (
                            <div key={model.name} className="p-3 rounded-lg bg-navy-900 border border-navy-700">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-xs font-semibold text-white">{model.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{model.type}</p>
                                    </div>
                                    <span className="font-mono text-xs text-purple-400">{model.version}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-white">{model.accuracy}%</p>
                                        <p className="text-[10px] text-slate-500">Accuracy</p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm font-bold text-white">{model.predictions.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500">Predictions</p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-xs font-bold text-white">{model.trained}</p>
                                        <p className="text-[10px] text-slate-500">Trained</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={triggerRetrain}
                        disabled={retraining}
                        className="w-full mt-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed
              bg-purple-400/10 border-purple-400/30 text-purple-400 hover:bg-purple-400/20"
                    >
                        {retraining ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Queuing retrain job...</>
                        ) : (
                            <><RefreshCw className="w-4 h-4" /> Retrain Both Models Now</>
                        )}
                    </button>
                </div>

                {/* Claude Usage Summary */}
                <div className="rounded-xl bg-navy-800 border border-navy-600 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                        <h2 className="text-sm font-semibold text-white">Claude API — 30-Day Usage</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={CLAUDE_USAGE_DATA.slice(-14)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={2} />
                            <YAxis tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                            <Tooltip content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-2 shadow-xl text-xs">
                                        <p className="text-slate-400 font-mono mb-1">{label}</p>
                                        <p className="text-white font-bold font-mono">{Number(payload[0]?.value).toLocaleString()} tokens</p>
                                        <p className="text-slate-400">${((Number(payload[0]?.value) || 0) * 0.003 / 1000).toFixed(3)}</p>
                                    </div>
                                );
                            }} />
                            <Bar dataKey="tokens" fill="#7f77dd" radius={[2, 2, 0, 0]} opacity={0.8} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        {[
                            { label: 'Tokens this month', value: '1.24M', sub: 'Claude 3.5 Sonnet' },
                            { label: 'Estimated cost', value: '$3.72', sub: '@$0.003/1K tokens' },
                            { label: 'Health alerts gen.', value: '847', sub: 'Via alert_generator' },
                            { label: 'Legal docs gen.', value: '23', sub: 'Affidavits + complaints' },
                        ].map(stat => (
                            <div key={stat.label} className="p-2.5 rounded-lg bg-navy-900 border border-navy-700">
                                <p className="font-mono text-sm font-bold text-white">{stat.value}</p>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                                <p className="text-[10px] text-slate-600">{stat.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* System Log Viewer */}
            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-600 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <h2 className="text-sm font-semibold text-white">System Logs</h2>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                        {['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL', 'DEBUG'].map(level => (
                            <button key={level}
                                onClick={() => setLogFilter(level as any)}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold transition-colors ${logFilter === level
                                    ? 'bg-navy-600 text-white border border-navy-400' : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-navy-600'
                                    }`}>
                                {level}
                            </button>
                        ))}
                        <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-2">
                            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="accent-cyan-400 w-3 h-3" />
                            Auto-scroll
                        </label>
                    </div>
                </div>
                <div ref={logRef} className="h-64 overflow-y-auto scrollbar-thin bg-navy-950 p-3 font-mono text-xs space-y-0.5"
                    style={{ background: '#080d1a' }}>
                    {filteredLogs.map((line, i) => (
                        <div key={i} className="flex items-start gap-3 hover:bg-navy-800/30 px-1 py-0.5 rounded transition-colors">
                            <span className="text-slate-600 shrink-0">{line.time}</span>
                            <span className={`shrink-0 w-14 ${logColor[line.level] || 'text-slate-400'}`}>[{line.level}]</span>
                            <span className={logColor[line.level] || 'text-slate-400'}>{line.msg}</span>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && (
                        <div className="flex items-center justify-center h-full text-slate-600">
                            No {logFilter} level logs in buffer
                        </div>
                    )}
                </div>
                <div className="px-4 py-2 border-t border-navy-700 flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span>Showing last {filteredLogs.length} of {SYSTEM_LOG_LINES.length} lines (200 max buffer)</span>
                    <span>FastAPI backend · {new Date().toISOString()}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Demo Controls Tab ────────────────────────────────────────────────────────

const DEMO_SCENARIOS = [
    {
        id: 1,
        title: 'Dharangaon Cholera Outbreak',
        subtitle: 'Full 6-minute pipeline: sensor spike → AI prediction → forensics → legal filing → health alerts',
        description: 'Simulates industrial effluent contamination from Tapti River upstream. TDS climbs from 320→1410 ppm over 45 minutes, triggering cholera prediction at 91% confidence, forensics identifies source at 3.2km upstream, CPCB complaint auto-filed.',
        icon: Factory,
        color: '#e24b4a',
        duration: '~6 minutes',
        steps: [
            'Inject TDS anomaly readings (JS-DH-001)',
            'Trigger ML ensemble prediction (XGBoost: 89, RF: 91, GBM: 87)',
            'Run forensics classification (industrial_effluent, 94%)',
            'Generate legal affidavit + CPCB complaint',
            'Send health officer alerts (SMS + app)',
            'Update village risk score to CRITICAL (87)',
        ],
    },
    {
        id: 2,
        title: 'Early Detection Timeline',
        subtitle: 'Show 14-hour early warning advantage over traditional surveillance',
        description: 'Demonstrates how AquaPulse AI detects contamination 14 hours before first clinical symptoms appear. Gradual TDS rise in Pachora triggers medium alert at 8hr mark, escalating to high at 11hr. Traditional surveillance would only detect at symptom onset.',
        icon: Activity,
        color: '#ef9f27',
        duration: '~4 minutes',
        steps: [
            'Baseline readings (Pachora borewell, normal)',
            'Gradual TDS rise begins (fertilizer runoff pattern)',
            'Anomaly detection triggers (T+8hr simulated)',
            'Medium risk alert sent to Dr. Priya Sharma',
            'Risk escalates to HIGH — field visit recommended',
            'Compare: traditional detection would be T+22hr',
        ],
    },
    {
        id: 3,
        title: 'Intervention Success Story',
        subtitle: 'Before/after: contamination caught → intervention → risk returns to baseline',
        description: 'Shows a successful intervention workflow — Bhadgaon contamination detected, health officer dispatched, water supply shut down, alternative supply arranged, legal notice served to polluter, risk score returns to baseline over 72 hours.',
        icon: Shield,
        color: '#1d9e75',
        duration: '~3 minutes',
        steps: [
            'Contamination event detected (Bhadgaon)',
            'Health officer notified + field team dispatched',
            'Water supply shut down (manual override logged)',
            'Legal notice served to upstream polluter',
            'Alternative supply arranged (water tanker fleet)',
            'TDS normalizes — risk returns to BASELINE',
        ],
    },
];

function DemoTab() {
    const [activeScenario, setActiveScenario] = useState<number | null>(null);
    const [scenarioStatus, setScenarioStatus] = useState<Record<number, 'idle' | 'running' | 'complete'>>({ 1: 'idle', 2: 'idle', 3: 'idle' });
    const [eventFeed, setEventFeed] = useState<DemoEvent[]>([]);
    const [completedSteps, setCompletedSteps] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
    const [resetting, setResetting] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === '1') triggerScenario(1);
            if (e.key === '2') triggerScenario(2);
            if (e.key === '3') triggerScenario(3);
            if (e.key === 'r' || e.key === 'R') handleReset();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const triggerScenario = (n: 1 | 2 | 3) => {
        if (scenarioStatus[n] === 'running') return;
        // Backend integration point: POST /api/admin/demo/scenario/{n}
        setActiveScenario(n);
        setScenarioStatus(prev => ({ ...prev, [n]: 'running' }));
        setCompletedSteps(prev => ({ ...prev, [n]: 0 }));
        setEventFeed([]);
        toast.success(`Scenario ${n} triggered. Watch the live feed below.`);

        const scenario = DEMO_SCENARIOS[n - 1];
        scenario.steps.forEach((step, i) => {
            setTimeout(() => {
                const event: DemoEvent = {
                    id: `${n}-${i}`,
                    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    type: i < 2 ? 'sensor' : i < 4 ? 'prediction' : i < 5 ? 'legal' : 'alert',
                    description: step,
                    status: 'complete',
                };
                setEventFeed(prev => [event, ...prev]);
                setCompletedSteps(prev => ({ ...prev, [n]: i + 1 }));

                if (i === scenario.steps.length - 1) {
                    setScenarioStatus(prev => ({ ...prev, [n]: 'complete' }));
                    toast.success(`Scenario ${n} complete! All pipeline steps executed successfully.`);
                }
            }, (i + 1) * 3000);
        });
    };

    const handleReset = () => {
        // Backend integration point: POST /api/admin/demo/reset
        setResetting(true);
        toast.info('Resetting all demo data to baseline...');
        setTimeout(() => {
            setActiveScenario(null);
            setScenarioStatus({ 1: 'idle', 2: 'idle', 3: 'idle' });
            setEventFeed([]);
            setCompletedSteps({ 1: 0, 2: 0, 3: 0 });
            setResetting(false);
            toast.success('All demo data reset to baseline state.');
        }, 2000);
    };

    const eventTypeConfig: Record<string, { color: string; bg: string; label: string }> = {
        sensor: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'SENSOR' },
        prediction: { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'PREDICT' },
        legal: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'LEGAL' },
        alert: { color: 'text-coral', bg: 'bg-coral/10', label: 'ALERT' },
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-white">Demo Scenario Controls</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Trigger live demo scenarios for stakeholder presentations · Keyboard: 1, 2, 3, R</p>
                </div>
                <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-60 bg-navy-800 border-navy-600 text-slate-400 hover:text-white hover:border-navy-400"
                >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Reset All Demo Data
                </button>
            </div>

            {/* Scenario Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {DEMO_SCENARIOS.map((scenario) => {
                    const SIcon = scenario.icon;
                    const status = scenarioStatus[scenario.id];
                    const steps = completedSteps[scenario.id];
                    const totalSteps = scenario.steps.length;

                    return (
                        <div
                            key={scenario.id}
                            className={`rounded-xl border p-5 transition-all ${activeScenario === scenario.id && status === 'running' ? 'bg-navy-800 border-cyan-400/30'
                                : status === 'complete' ? 'bg-teal-400/3 border-teal-400/20' : 'bg-navy-800 border-navy-600 hover:border-navy-500'
                                }`}
                            style={activeScenario === scenario.id && status === 'running'
                                ? { boxShadow: '0 0 20px rgba(0,212,255,0.1)' }
                                : {}}
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: `${scenario.color}15`, border: `1px solid ${scenario.color}30` }}>
                                    <SIcon className="w-5 h-5" style={{ color: scenario.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-mono text-slate-500">Scenario {scenario.id}</span>
                                        {status === 'running' && (
                                            <span className="flex items-center gap-1 text-xs text-cyan-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                                Running...
                                            </span>
                                        )}
                                        {status === 'complete' && (
                                            <span className="flex items-center gap-1 text-xs text-teal-400">
                                                <CheckCircle2 className="w-3 h-3" /> Complete
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-white leading-tight">{scenario.title}</h3>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{scenario.subtitle}</p>

                            {/* Progress bar when running */}
                            {status === 'running' && (
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                        <span>Step {steps} of {totalSteps}</span>
                                        <span className="font-mono">{Math.round((steps / totalSteps) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-navy-600 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${(steps / totalSteps) * 100}%`, backgroundColor: scenario.color }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Steps list */}
                            <div className="space-y-1.5 mb-4">
                                {scenario.steps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                        <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${i < steps
                                            ? 'bg-teal-400/20 text-teal-400'
                                            : i === steps && status === 'running' ? 'bg-cyan-400/20 text-cyan-400' : 'bg-navy-700 text-slate-600'
                                            }`}>
                                            {i < steps
                                                ? <CheckCircle2 className="w-2.5 h-2.5" />
                                                : i === steps && status === 'running'
                                                    ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                                    : <span className="text-[9px] font-mono">{i + 1}</span>
                                            }
                                        </span>
                                        <span className={i < steps ? 'text-teal-400/70' : i === steps && status === 'running' ? 'text-cyan-400' : 'text-slate-500'}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-600 font-mono">Est. duration: {scenario.duration}</span>
                            </div>

                            <button
                                onClick={() => triggerScenario(scenario.id as 1 | 2 | 3)}
                                disabled={status === 'running'}
                                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                                style={{
                                    backgroundColor: status === 'running' ? `${scenario.color}10` : `${scenario.color}18`,
                                    border: `1px solid ${scenario.color}${status === 'running' ? '50' : '35'}`,
                                    color: scenario.color,
                                }}
                            >
                                {status === 'running' ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Running scenario {scenario.id}...</>
                                ) : status === 'complete' ? (
                                    <><RefreshCw className="w-4 h-4" /> Re-run Scenario {scenario.id}</>
                                ) : (
                                    <><Play className="w-4 h-4" /> Trigger Scenario {scenario.id}</>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Live Event Feed */}
            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="px-4 py-3 border-b border-navy-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${eventFeed.length > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}
                            style={eventFeed.length > 0 ? { boxShadow: '0 0 6px #00d4ff' } : {}} />
                        <h2 className="text-sm font-semibold text-white">Live Pipeline Event Feed</h2>
                        {eventFeed.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 font-mono">{eventFeed.length} events</span>
                        )}
                    </div>
                    <span className="text-xs text-slate-500">WebSocket stream · ws://backend/ws/live</span>
                </div>

                <div className="min-h-[200px] max-h-80 overflow-y-auto scrollbar-thin">
                    {eventFeed.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <Play className="w-8 h-8 text-slate-700 mb-3" />
                            <p className="text-sm text-slate-500">No active scenario</p>
                            <p className="text-xs text-slate-600 mt-1">Trigger a scenario above to see the real-time pipeline execution feed</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-navy-700">
                            {eventFeed.map((event) => {
                                const cfg = eventTypeConfig[event.type] || eventTypeConfig.sensor;
                                return (
                                    <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-navy-700/30 transition-colors animate-slide-up">
                                        <span className="font-mono text-xs text-slate-600 shrink-0 mt-0.5">{event.time}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${cfg.bg} ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-300">{event.description}</p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                <span>Keyboard shortcuts:</span>
                {[['1', 'Scenario 1'], ['2', 'Scenario 2'], ['3', 'Scenario 3'], ['R', 'Reset']].map(([key, label]) => (
                    <span key={key} className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded bg-navy-800 border border-navy-600 font-mono text-slate-400">{key}</kbd>
                        <span>{label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── Villages Tab (Admin) ─────────────────────────────────────────────────────

function AdminVillagesTab() {
    const VILLAGES = [
        { id: 'v1', name: 'Dharangaon', district: 'Jalgaon', population: 28400, riskScore: 87, riskLevel: 'critical' as RiskLevel, sensors: 4, officers: 1, lastReading: '1 min ago' },
        { id: 'v2', name: 'Pachora', district: 'Jalgaon', population: 47200, riskScore: 62, riskLevel: 'medium' as RiskLevel, sensors: 5, officers: 1, lastReading: '5 min ago' },
        { id: 'v3', name: 'Erandol', district: 'Jalgaon', population: 19800, riskScore: 28, riskLevel: 'low' as RiskLevel, sensors: 3, officers: 1, lastReading: '8 min ago' },
        { id: 'v4', name: 'Bhadgaon', district: 'Jalgaon', population: 14600, riskScore: 71, riskLevel: 'high' as RiskLevel, sensors: 4, officers: 1, lastReading: '12 min ago' },
        { id: 'v5', name: 'Chalisgaon', district: 'Jalgaon', population: 62100, riskScore: 18, riskLevel: 'baseline' as RiskLevel, sensors: 6, officers: 2, lastReading: '3 min ago' },
        { id: 'v6', name: 'Jamner', district: 'Jalgaon', population: 31700, riskScore: 45, riskLevel: 'medium' as RiskLevel, sensors: 4, officers: 1, lastReading: '18 min ago' },
    ];

    const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; border: string; label: string }> = {
        baseline: { color: '#1d9e75', bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)', label: 'Baseline' },
        low: { color: '#639922', bg: 'rgba(99,153,34,0.12)', border: 'rgba(99,153,34,0.3)', label: 'Low Risk' },
        medium: { color: '#ef9f27', bg: 'rgba(239,159,39,0.12)', border: 'rgba(239,159,39,0.3)', label: 'Medium' },
        high: { color: '#d85a30', bg: 'rgba(216,90,48,0.12)', border: 'rgba(216,90,48,0.3)', label: 'High Risk' },
        critical: { color: '#e24b4a', bg: 'rgba(226,75,74,0.12)', border: 'rgba(226,75,74,0.3)', label: 'Critical' },
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">All Villages — System-wide</h2>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-medium hover:bg-cyan-400/20 transition-colors">
                    <Plus className="w-4 h-4" /> Add Village
                </button>
            </div>
            <div className="rounded-xl bg-navy-800 border border-navy-600 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-navy-600 bg-navy-900/50">
                                {['Village', 'District', 'Population', 'Risk Score', 'Risk Level', 'Sensors', 'Officers', 'Last Reading', 'Actions'].map(col => (
                                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-700">
                            {VILLAGES.sort((a, b) => b.riskScore - a.riskScore).map((v) => {
                                const cfg = RISK_CONFIG[v.riskLevel];
                                return (
                                    <tr key={v.id} className="hover:bg-navy-700/40 transition-colors group">
                                        <td className="px-4 py-3 text-sm font-medium text-white">{v.name}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{v.district}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{v.population.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 rounded-full bg-navy-600 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${v.riskScore}%`, backgroundColor: cfg.color }} />
                                                </div>
                                                <span className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{v.riskScore}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                                                style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{v.sensors}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-300">{v.officers}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{v.lastReading}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" title="View details">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors" title="Edit village">
                                                    <Edit className="w-3.5 h-3.5" />
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

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
    const [wsConnected, setWsConnected] = useState(true);
    const [villages, setVillages] = useState<Village[]>([]);
    const [apiUsage, setApiUsage] = useState<ApiUsageResponse | null>(null);

    useEffect(() => {
        const wsTimer = setTimeout(() => setWsConnected(true), 800);
        return () => clearTimeout(wsTimer);
    }, []);

    useEffect(() => {
        villagesApi.listAll({ per_page: 50 }).then(res => setVillages(res.items)).catch(console.error);
        adminApi.getApiUsage().then(setApiUsage).catch(console.error);
    }, []);

    const handleAcknowledge = (alertId: string) => {
        // Backend integration point: PUT /api/admin/alerts/{id}/acknowledge
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isAcknowledged: true } : a));
        toast.success('Alert acknowledged');
    };

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab alerts={alerts} onAcknowledge={handleAcknowledge} villages={villages} apiUsage={apiUsage} />;
            case 'users': return <UsersTab />;
            case 'sensors': return <SensorsTab />;
            case 'villages': return <AdminVillagesTab />;
            case 'system': return <SystemTab />;
            case 'demo': return <DemoTab />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            {renderTab()}
        </div>
    );
}