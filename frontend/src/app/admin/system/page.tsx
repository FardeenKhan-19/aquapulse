'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type SystemHealth, type ModelInfo } from '@/lib/api/admin';
import { analyticsApi, type TokenUsage } from '@/lib/api/analytics';
import { PageHeader } from '@/components/layout/PageHeader';
import { SystemHealthPanel } from '@/components/admin/SystemHealthPanel';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { Loader2, RotateCcw, RefreshCw } from 'lucide-react';

export default function SystemPage() {
    const { data: models } = useQuery({ queryKey: ['admin', 'models'], queryFn: adminApi.getModels, staleTime: 60000 });
    const { data: tokenUsage } = useQuery({ queryKey: ['analytics', 'token-usage'], queryFn: () => analyticsApi.getTokenUsage(30), staleTime: 60000 });
    const { data: logs, refetch: refetchLogs } = useQuery({ queryKey: ['admin', 'logs'], queryFn: () => adminApi.getLogs({ limit: 200 }), staleTime: 15000 });
    const [logLevel, setLogLevel] = useState('all');
    const [autoScroll, setAutoScroll] = useState(true);

    const filteredLogs = (logs || []).filter(
        (l) => logLevel === 'all' || l.toLowerCase().includes(logLevel.toLowerCase())
    );

    const getLogColor = (line: string) => {
        if (line.includes('ERROR') || line.includes('CRITICAL')) return 'text-coral';
        if (line.includes('WARNING')) return 'text-amber';
        if (line.includes('INFO')) return 'text-cyan';
        return 'text-text-muted';
    };

    const totalTokens = (tokenUsage || []).reduce((sum, d) => sum + d.tokens_used, 0);
    const estimatedCost = (totalTokens / 1000) * 0.003;

    return (
        <div className="space-y-6">
            <PageHeader title="System" description="Infrastructure health, models, and monitoring" />

            <SystemHealthPanel />

            <div className="bg-surface border border-accent/30 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Claude API Usage (30 days)</h3>
                <p className="text-xs text-text-muted mb-4">Total: {totalTokens.toLocaleString()} tokens · Est. cost: ${estimatedCost.toFixed(2)}</p>
                {tokenUsage && (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={tokenUsage}>
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #0f3460', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }} />
                            <Bar dataKey="tokens_used" fill="#7f77dd" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {models && (
                <div className="bg-surface border border-accent/30 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-4">ML Models</h3>
                    <div className="space-y-3">
                        {models.map((m) => (
                            <div key={m.name} className="flex items-center justify-between p-3 bg-primary rounded-lg">
                                <div>
                                    <p className="text-xs font-medium text-text-primary">{m.name}</p>
                                    <p className="text-[10px] text-text-muted">v{m.version} · Trained: {m.training_date?.slice(0, 10) || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-teal">{(m.accuracy * 100).toFixed(1)}%</span>
                                    <button
                                        onClick={() => {
                                            adminApi.retrainModel(m.name).then((r) => toast.success(`Retrain started: ${r.job_id}`));
                                        }}
                                        className="px-3 py-1 text-[10px] font-medium text-amber bg-amber/10 hover:bg-amber/20 rounded transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3 inline mr-1" /> Retrain
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
                    <h3 className="text-sm font-semibold text-text-primary">System Logs</h3>
                    <div className="flex items-center gap-2">
                        <select value={logLevel} onChange={(e) => setLogLevel(e.target.value)}
                            className="px-2 py-1 text-xs bg-primary border border-accent/50 rounded text-text-primary"
                        >
                            <option value="all">All Levels</option>
                            <option value="DEBUG">Debug</option>
                            <option value="INFO">Info</option>
                            <option value="WARNING">Warning</option>
                            <option value="ERROR">Error</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-text-muted">
                            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-cyan" />
                            Auto-scroll
                        </label>
                        <button onClick={() => refetchLogs()} className="p-1 text-text-muted hover:text-text-primary"><RefreshCw className="w-3.5 h-3.5" /></button>
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto p-4 bg-primary font-mono text-[11px] leading-5 scrollbar-thin">
                    {filteredLogs.map((line, i) => (
                        <div key={i} className={cn('whitespace-pre-wrap', getLogColor(line))}>{line}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
