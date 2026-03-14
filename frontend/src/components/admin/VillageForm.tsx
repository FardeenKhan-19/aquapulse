'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { villageSchema, type VillageFormData } from '@/lib/utils/validators';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { villagesApi } from '@/lib/api/villages';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface VillageFormProps {
    onClose: () => void;
}

export function VillageForm({ onClose }: VillageFormProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, formState: { errors } } = useForm<VillageFormData>({
        resolver: zodResolver(villageSchema),
        defaultValues: { name: '', district: '', state: '', gps_lat: 0, gps_lng: 0, population: 0, primary_water_source: '' },
    });

    const createVillage = useMutation({
        mutationFn: (data: VillageFormData) => villagesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['villages'] });
            toast.success('Village created');
            onClose();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create village'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface border border-accent/30 rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Add Village</h2>
                <form onSubmit={handleSubmit((data) => createVillage.mutate(data))} className="space-y-3">
                    {[
                        { name: 'name' as const, label: 'Village Name' },
                        { name: 'district' as const, label: 'District' },
                        { name: 'state' as const, label: 'State' },
                        { name: 'primary_water_source' as const, label: 'Water Source' },
                    ].map((f) => (
                        <div key={f.name}>
                            <label className="block text-xs text-text-secondary mb-1">{f.label}</label>
                            <input {...register(f.name)} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                            {errors[f.name] && <p className="text-xs text-coral mt-1">{errors[f.name]?.message}</p>}
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Latitude</label>
                            <input type="number" step="any" {...register('gps_lat')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Longitude</label>
                            <input type="number" step="any" {...register('gps_lng')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Population</label>
                        <input type="number" {...register('population')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                        {errors.population && <p className="text-xs text-coral mt-1">{errors.population.message}</p>}
                    </div>
                    <button type="submit" disabled={createVillage.isPending} className="w-full py-2.5 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50 text-primary text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                        {createVillage.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {createVillage.isPending ? 'Creating...' : 'Create Village'}
                    </button>
                </form>
            </div>
        </div>
    );
}
