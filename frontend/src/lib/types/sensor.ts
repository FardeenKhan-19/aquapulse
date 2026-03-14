export interface SensorNode {
    id: string;
    hardware_id: string;
    name: string;
    village_id: string;
    gps_lat: number;
    gps_lng: number;
    sensor_types: string[];
    is_active: boolean;
    is_approved: boolean;
    last_seen: string | null;
    calibration_data: Record<string, unknown>;
    deployment_date: string | null;
    battery_level?: number;
    signal_strength?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SensorReading {
    id: string;
    sensor_node_id: string;
    village_id: string;
    timestamp: string;
    tds_ppm: number | null;
    temperature_c: number | null;
    turbidity_ntu: number | null;
    ph: number | null;
    humidity_pct: number | null;
    flow_rate_lpm: number | null;
    is_anomaly: boolean;
    anomaly_score: number;
}

export interface RegisterSensorPayload {
    hardware_id: string;
    name: string;
    village_id: string;
    gps_lat: number;
    gps_lng: number;
    sensor_types: string[];
    calibration_data?: Record<string, unknown>;
}

export interface SensorRegistrationResponse {
    sensor: SensorNode;
    api_key: string;
    qr_code_base64: string;
}
