'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserFormData } from '@/lib/utils/validators';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useAllVillages } from '@/lib/hooks/useVillages';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface UserFormProps {
    onClose: () => void;
}

export function UserForm({ onClose }: UserFormProps) {
    const queryClient = useQueryClient();
    const { data: villagesData } = useAllVillages({ per_page: 100 });
    const [selectedVillages, setSelectedVillages] = useState<string[]>([]);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { full_name: '', email: '', password: '', phone: '', assigned_village_ids: [] },
    });

    const createUser = useMutation({
        mutationFn: (data: CreateUserFormData) => adminApi.createUser({ ...data, role: 'health_officer', assigned_village_ids: selectedVillages }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            toast.success('User created successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create user');
        },
    });

    const toggleVillage = (id: string) => {
        const next = selectedVillages.includes(id) ? selectedVillages.filter((v) => v !== id) : [...selectedVillages, id];
        setSelectedVillages(next);
        setValue('assigned_village_ids', next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface border border-accent/30 rounded-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Create Health Officer</h2>
                <form onSubmit={handleSubmit((data) => createUser.mutate(data))} className="space-y-4">
                    {[
                        { name: 'full_name' as const, label: 'Full Name', type: 'text' },
                        { name: 'email' as const, label: 'Email', type: 'email' },
                        { name: 'password' as const, label: 'Password', type: 'password' },
                        { name: 'phone' as const, label: 'Phone (optional)', type: 'tel' },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="block text-xs text-text-secondary mb-1">{field.label}</label>
                            <input
                                type={field.type}
                                {...register(field.name)}
                                className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50"
                            />
                            {errors[field.name] && <p className="text-xs text-coral mt-1">{errors[field.name]?.message}</p>}
                        </div>
                    ))}
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Assign Villages</label>
                        <div className="max-h-32 overflow-y-auto bg-primary border border-accent/50 rounded-lg p-2 space-y-1">
                            {(villagesData?.items || []).map((v) => (
                                <label key={v.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/20 cursor-pointer text-xs">
                                    <input type="checkbox" checked={selectedVillages.includes(v.id)} onChange={() => toggleVillage(v.id)} className="accent-cyan" />
                                    <span className="text-text-primary">{v.name}</span>
                                    <span className="text-text-muted">({v.district})</span>
                                </label>
                            ))}
                        </div>
                        {errors.assigned_village_ids && <p className="text-xs text-coral mt-1">{errors.assigned_village_ids.message}</p>}
                    </div>
                    <button type="submit" disabled={createUser.isPending} className="w-full py-2.5 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50 text-primary text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                        {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {createUser.isPending ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            </div>
        </div>
    );
}
