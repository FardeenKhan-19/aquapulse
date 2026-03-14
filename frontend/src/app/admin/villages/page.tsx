'use client';

import { useState } from 'react';
import { useAllVillages } from '@/lib/hooks/useVillages';
import { PageHeader } from '@/components/layout/PageHeader';
import { VillageForm } from '@/components/admin/VillageForm';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function AdminVillagesPage() {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const { data, isLoading } = useAllVillages({ per_page: 50, search: search || undefined });
    const villages = data?.items || [];

    return (
        <div>
            <PageHeader title="Villages" description="Manage all villages in the system">
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2 bg-surface border border-accent/50 rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-cyan/50 w-48" />
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan hover:bg-cyan/90 text-primary text-sm font-medium rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Village
                    </button>
                </div>
            </PageHeader>

            {isLoading ? (
                <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-surface animate-pulse rounded-lg" />)}</div>
            ) : (
                <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-accent/20">
                                    <th className="text-left py-3 px-4 text-text-muted font-medium">Village</th>
                                    <th className="text-left py-3 px-4 text-text-muted font-medium">District</th>
                                    <th className="text-left py-3 px-4 text-text-muted font-medium">State</th>
                                    <th className="text-right py-3 px-4 text-text-muted font-medium">Population</th>
                                    <th className="text-left py-3 px-4 text-text-muted font-medium">Water Source</th>
                                    <th className="text-center py-3 px-4 text-text-muted font-medium">Officers</th>
                                    <th className="text-center py-3 px-4 text-text-muted font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {villages.map((v) => (
                                    <tr key={v.id} className="border-b border-accent/10 hover:bg-accent/10 transition-colors">
                                        <td className="py-3 px-4"><Link href={`/admin/villages/${v.id}`} className="text-text-primary hover:text-cyan font-medium">{v.name}</Link></td>
                                        <td className="py-3 px-4 text-text-secondary">{v.district}</td>
                                        <td className="py-3 px-4 text-text-secondary">{v.state}</td>
                                        <td className="py-3 px-4 text-right font-mono text-text-primary">{v.population.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-text-secondary">{v.primary_water_source}</td>
                                        <td className="py-3 px-4 text-center font-mono text-text-primary">{v.assigned_health_officer_ids.length}</td>
                                        <td className="py-3 px-4 text-center"><Link href={`/admin/villages/${v.id}`} className="text-cyan hover:text-cyan/80 text-xs font-medium">Manage →</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showForm && <VillageForm onClose={() => setShowForm(false)} />}
        </div>
    );
}
