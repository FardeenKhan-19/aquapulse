'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { PageHeader } from '@/components/layout/PageHeader';
import { SensorNodeCard } from '@/components/sensors/SensorNodeCard';
import { SensorRegistrationForm } from '@/components/admin/SensorRegistrationForm';
import { Plus, Search } from 'lucide-react';

export default function SensorsPage() {
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('');
    const { data, isLoading } = useQuery({ queryKey: ['admin', 'sensors'], queryFn: () => sensorsApi.list({ per_page: 50 }), staleTime: 30000 });

    const sensors = (data?.items || []).filter((s) => !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || s.hardware_id.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div>
            <PageHeader title="Sensors" description="Manage sensor fleet">
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search sensors..." className="pl-10 pr-4 py-2 bg-surface border border-accent/50 rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-cyan/50 w-48" />
                    </div>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan hover:bg-cyan/90 text-primary text-sm font-medium rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        Register Sensor
                    </button>
                </div>
            </PageHeader>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-surface animate-pulse rounded-xl" />)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sensors.map((s) => <SensorNodeCard key={s.id} sensor={s} />)}
                </div>
            )}

            {showForm && <SensorRegistrationForm onClose={() => setShowForm(false)} />}
        </div>
    );
}
