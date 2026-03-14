'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sensorRegistrationSchema, type SensorRegistrationFormData } from '@/lib/utils/validators';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sensorsApi } from '@/lib/api/sensors';
import { useAllVillages } from '@/lib/hooks/useVillages';
import { QRCodeDisplay } from '@/components/sensors/QRCodeDisplay';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import type { SensorRegistrationResponse } from '@/lib/types/sensor';

interface SensorRegistrationFormProps {
    onClose: () => void;
}

export function SensorRegistrationForm({ onClose }: SensorRegistrationFormProps) {
    const queryClient = useQueryClient();
    const { data: villagesData } = useAllVillages({ per_page: 100 });
    const [registrationResult, setRegistrationResult] = useState<SensorRegistrationResponse | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SensorRegistrationFormData>({
        resolver: zodResolver(sensorRegistrationSchema),
        defaultValues: { hardware_id: '', name: '', village_id: '', gps_lat: 0, gps_lng: 0, sensor_types: [] },
    });

    const sensorTypes = ['tds', 'temperature', 'turbidity', 'ph', 'humidity', 'flow_rate'];
    const selectedTypes = watch('sensor_types');

    const registerSensor = useMutation({
        mutationFn: (data: SensorRegistrationFormData) => sensorsApi.register(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sensors'] });
            setRegistrationResult(result);
            toast.success('Sensor registered successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to register sensor');
        },
    });

    const toggleSensorType = (type: string) => {
        const next = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type];
        setValue('sensor_types', next);
    };

    if (registrationResult) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-surface border border-accent/30 rounded-xl w-full max-w-md p-6">
                    <h2 className="text-lg font-semibold text-teal text-center mb-4">Sensor Registered Successfully</h2>
                    <QRCodeDisplay
                        sensorName={registrationResult.sensor.name}
                        apiKey={registrationResult.api_key}
                        qrCodeBase64={registrationResult.qr_code_base64}
                    />
                    <div className="mt-6">
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="accent-cyan" />
                            I have saved the API key securely
                        </label>
                        <button
                            onClick={onClose}
                            disabled={!confirmed}
                            className="w-full mt-3 py-2.5 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/30 disabled:cursor-not-allowed text-primary text-sm font-semibold rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-surface border border-accent/30 rounded-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Register New Sensor</h2>
                <form onSubmit={handleSubmit((data) => registerSensor.mutate(data))} className="space-y-4">
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Hardware ID</label>
                        <input {...register('hardware_id')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                        {errors.hardware_id && <p className="text-xs text-coral mt-1">{errors.hardware_id.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Sensor Name</label>
                        <input {...register('name')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50" />
                        {errors.name && <p className="text-xs text-coral mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Village</label>
                        <select {...register('village_id')} className="w-full px-3 py-2 bg-primary border border-accent/50 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-cyan/50">
                            <option value="">Select village</option>
                            {(villagesData?.items || []).map((v) => <option key={v.id} value={v.id}>{v.name} ({v.district})</option>)}
                        </select>
                        {errors.village_id && <p className="text-xs text-coral mt-1">{errors.village_id.message}</p>}
                    </div>
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
                        <label className="block text-xs text-text-secondary mb-1">Sensor Types</label>
                        <div className="flex flex-wrap gap-2">
                            {sensorTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleSensorType(type)}
                                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedTypes.includes(type) ? 'bg-cyan/20 text-cyan font-medium' : 'bg-accent/20 text-text-secondary hover:bg-accent/30'
                                        }`}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        {errors.sensor_types && <p className="text-xs text-coral mt-1">{errors.sensor_types.message}</p>}
                    </div>
                    <button type="submit" disabled={registerSensor.isPending} className="w-full py-2.5 bg-cyan hover:bg-cyan/90 disabled:bg-cyan/50 text-primary text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                        {registerSensor.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {registerSensor.isPending ? 'Registering...' : 'Register Sensor'}
                    </button>
                </form>
            </div>
        </div>
    );
}
