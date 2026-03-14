import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    assigned_village_ids: z.array(z.string()).min(1, 'Assign at least one village'),
});

export const updateUserSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    assigned_village_ids: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
});

export const villageSchema = z.object({
    name: z.string().min(2, 'Village name required'),
    district: z.string().min(2, 'District required'),
    state: z.string().min(2, 'State required'),
    gps_lat: z.coerce.number().min(-90).max(90),
    gps_lng: z.coerce.number().min(-180).max(180),
    population: z.coerce.number().int().positive('Population must be positive'),
    primary_water_source: z.string().min(2, 'Water source required'),
    risk_threshold_low: z.coerce.number().min(0).max(100).optional(),
    risk_threshold_medium: z.coerce.number().min(0).max(100).optional(),
    risk_threshold_high: z.coerce.number().min(0).max(100).optional(),
    risk_threshold_critical: z.coerce.number().min(0).max(100).optional(),
});

export const sensorRegistrationSchema = z.object({
    hardware_id: z.string().min(4, 'Hardware ID required'),
    name: z.string().min(2, 'Sensor name required'),
    village_id: z.string().min(1, 'Select a village'),
    gps_lat: z.coerce.number().min(-90).max(90),
    gps_lng: z.coerce.number().min(-180).max(180),
    sensor_types: z.array(z.string()).min(1, 'Select at least one sensor type'),
});

export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message too long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type VillageFormData = z.infer<typeof villageSchema>;
export type SensorRegistrationFormData = z.infer<typeof sensorRegistrationSchema>;
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;
