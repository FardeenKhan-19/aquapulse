export interface Village {
    id: string;
    name: string;
    district: string;
    state: string;
    gps_lat: number;
    gps_lng: number;
    population: number;
    primary_water_source: string;
    assigned_health_officer_ids: string[];
    risk_threshold_low: number;
    risk_threshold_medium: number;
    risk_threshold_high: number;
    risk_threshold_critical: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateVillagePayload {
    name: string;
    district: string;
    state: string;
    gps_lat: number;
    gps_lng: number;
    population: number;
    primary_water_source: string;
    risk_threshold_low?: number;
    risk_threshold_medium?: number;
    risk_threshold_high?: number;
    risk_threshold_critical?: number;
}

export interface UpdateVillagePayload extends Partial<CreateVillagePayload> {
    assigned_health_officer_ids?: string[];
}
