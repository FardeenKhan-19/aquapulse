import type { User } from '@/lib/types/user';
import type { Village } from '@/lib/types/village';
import type { SensorNode, SensorReading } from '@/lib/types/sensor';
import type { OutbreakPrediction } from '@/lib/types/prediction';
import type { ForensicsReport } from '@/lib/types/forensics';
import type { LegalDocument } from '@/lib/types/legal';
import type { Alert } from '@/lib/types/alert';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// ─── Mock Users ──────────────────────────────────────────────
export const mockAdminUser = {
    id: 'demo-admin-001',
    email: 'admin@aquapulse.in',
    full_name: 'Dr. Priya Sharma',
    phone: '+91 98765 43210',
    role: 'admin' as const,
    is_active: true,
    assigned_village_ids: [] as string[],
    last_login: new Date().toISOString(),
    created_at: '2024-01-15T08:00:00Z',
    updated_at: new Date().toISOString(),
} as User;

export const mockHealthOfficer = {
    id: 'demo-ho-001',
    email: 'officer@aquapulse.in',
    full_name: 'Ravi Kumar',
    phone: '+91 98765 12345',
    role: 'health_officer' as const,
    is_active: true,
    assigned_village_ids: ['v-001', 'v-002', 'v-003', 'v-004'],
    last_login: new Date().toISOString(),
    created_at: '2024-02-20T10:00:00Z',
    updated_at: new Date().toISOString(),
} as User;

// ─── Mock Villages ───────────────────────────────────────────
export const mockVillages = [
    {
        id: 'v-001', name: 'Dharangaon', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 21.0122, gps_lng: 75.2839, population: 23450,
        primary_water_source: 'Pipeline + Borewells',
        assigned_health_officer_ids: ['demo-ho-001'],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 'v-002', name: 'Bhusawal', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 21.0463, gps_lng: 75.7856, population: 18720,
        primary_water_source: 'River Tapi',
        assigned_health_officer_ids: ['demo-ho-001'],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 'v-003', name: 'Pachora', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 20.6641, gps_lng: 75.3547, population: 12340,
        primary_water_source: 'Handpumps',
        assigned_health_officer_ids: ['demo-ho-001'],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 'v-004', name: 'Raver', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 21.2475, gps_lng: 76.0340, population: 8950,
        primary_water_source: 'Open Well',
        assigned_health_officer_ids: ['demo-ho-001'],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 'v-005', name: 'Amalner', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 21.0416, gps_lng: 75.0579, population: 31200,
        primary_water_source: 'Pipeline',
        assigned_health_officer_ids: ['demo-ho-002'],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 'v-006', name: 'Chopda', district: 'Jalgaon', state: 'Maharashtra',
        gps_lat: 21.2481, gps_lng: 75.3012, population: 15600,
        primary_water_source: 'Borewells',
        assigned_health_officer_ids: [] as string[],
        risk_threshold_low: 30, risk_threshold_medium: 55, risk_threshold_high: 75, risk_threshold_critical: 90,
        created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
] as Village[];

// ─── Mock Sensors ────────────────────────────────────────────
export const mockSensors = [
    {
        id: 's-001', hardware_id: 'ESP32-TDS-001', name: 'Dharangaon Main Pipeline',
        village_id: 'v-001', gps_lat: 21.0125, gps_lng: 75.2842,
        sensor_types: ['tds', 'temperature', 'ph', 'turbidity'],
        is_active: true, is_approved: true,
        last_seen: new Date(Date.now() - 60000).toISOString(),
        deployment_date: '2024-03-15T00:00:00Z',
        battery_level: 87,
        calibration_data: { tds_offset: 2.1, ph_offset: -0.05 },
        created_at: '2024-03-15T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 's-002', hardware_id: 'ESP32-TDS-002', name: 'Dharangaon Borewell #3',
        village_id: 'v-001', gps_lat: 21.0130, gps_lng: 75.2850,
        sensor_types: ['tds', 'temperature'],
        is_active: true, is_approved: true,
        last_seen: new Date(Date.now() - 120000).toISOString(),
        deployment_date: '2024-04-01T00:00:00Z',
        battery_level: 45,
        calibration_data: { tds_offset: 1.8 },
        created_at: '2024-04-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 's-003', hardware_id: 'ESP32-TDS-003', name: 'Bhusawal River Intake',
        village_id: 'v-002', gps_lat: 21.0465, gps_lng: 75.7860,
        sensor_types: ['tds', 'temperature', 'ph', 'turbidity', 'flow_rate'],
        is_active: true, is_approved: true,
        last_seen: new Date(Date.now() - 30000).toISOString(),
        deployment_date: '2024-02-01T00:00:00Z',
        battery_level: 92,
        calibration_data: {},
        created_at: '2024-02-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 's-004', hardware_id: 'ESP32-TDS-004', name: 'Pachora Handpump #1',
        village_id: 'v-003', gps_lat: 20.6645, gps_lng: 75.3550,
        sensor_types: ['tds', 'temperature'],
        is_active: false, is_approved: true,
        last_seen: new Date(Date.now() - 86400000).toISOString(),
        deployment_date: '2024-05-01T00:00:00Z',
        battery_level: 12,
        calibration_data: {},
        created_at: '2024-05-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
    {
        id: 's-005', hardware_id: 'ESP32-TDS-005', name: 'Raver Village Tank',
        village_id: 'v-004', gps_lat: 21.2478, gps_lng: 76.0345,
        sensor_types: ['tds', 'ph'],
        is_active: true, is_approved: false,
        last_seen: null,
        deployment_date: null,
        battery_level: 100,
        calibration_data: {},
        created_at: '2024-06-01T00:00:00Z', updated_at: new Date().toISOString(),
    },
] as SensorNode[];

// ─── Mock Sensor Readings ────────────────────────────────────
function generateReadings(count: number, villageId: string): SensorReading[] {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => {
        const tds = 280 + Math.sin(i * 0.3) * 120 + Math.random() * 40;
        const isAnomaly = tds > 500;
        return {
            id: `reading-${villageId}-${i}`,
            sensor_id: `s-001`,
            sensor_node_id: `s-001`,
            village_id: villageId,
            timestamp: new Date(now - i * 900000).toISOString(),
            tds_ppm: Math.round(tds * 10) / 10,
            temperature_c: 24 + Math.random() * 8,
            turbidity_ntu: 3 + Math.random() * 15,
            ph: 6.5 + Math.random() * 1.5,
            humidity_pct: 55 + Math.random() * 30,
            flow_rate_lpm: 2 + Math.random() * 5,
            is_anomaly: isAnomaly,
            anomaly_score: isAnomaly ? 0.85 + Math.random() * 0.15 : Math.random() * 0.3,
        } as SensorReading;
    });
}

export const mockReadings = generateReadings(50, 'v-001');

// ─── Mock Predictions ────────────────────────────────────────
export const mockPredictions = [
    {
        id: 'pred-001', village_id: 'v-001',
        risk_score: 78.4, risk_level: 'high' as const,
        predicted_disease: 'cholera', disease_confidence: 0.82,
        affected_population_estimate: 3400, onset_hours_estimate: 48,
        model_version: '2.1.0', predicted_at: new Date(Date.now() - 3600000).toISOString(),
        shap_values: {
            tds_ppm: 0.34, temperature_c: 0.12, turbidity_ntu: 0.21,
            ph: -0.08, population: 0.15, rainfall_mm: 0.09,
            prev_outbreaks: 0.18, sanitation_score: -0.11,
            humidity_pct: 0.05, flow_rate_lpm: -0.03,
        },
        ensemble_scores: { xgboost: 81.2, random_forest: 75.8, gradient_boost: 78.1 },
    },
    {
        id: 'pred-002', village_id: 'v-002',
        risk_score: 42.1, risk_level: 'medium' as const,
        predicted_disease: 'gastroenteritis', disease_confidence: 0.65,
        affected_population_estimate: 1200, onset_hours_estimate: 96,
        model_version: '2.1.0', predicted_at: new Date(Date.now() - 7200000).toISOString(),
        shap_values: {
            tds_ppm: 0.18, temperature_c: 0.08, turbidity_ntu: 0.11,
            ph: -0.04, population: 0.06, rainfall_mm: 0.14,
        },
        ensemble_scores: { xgboost: 44.5, random_forest: 39.8, gradient_boost: 42.0 },
    },
    {
        id: 'pred-003', village_id: 'v-003',
        risk_score: 22.7, risk_level: 'low' as const,
        predicted_disease: null, disease_confidence: null,
        affected_population_estimate: null, onset_hours_estimate: null,
        model_version: '2.1.0', predicted_at: new Date(Date.now() - 1800000).toISOString(),
        shap_values: { tds_ppm: 0.04, temperature_c: 0.02, ph: -0.01 },
        ensemble_scores: { xgboost: 24.1, random_forest: 20.5, gradient_boost: 23.4 },
    },
] as OutbreakPrediction[];

// Prediction history for chart
export const mockPredictionHistory = Array.from({ length: 30 }, (_, i) => ({
    id: `pred-hist-${i}`,
    village_id: 'v-001',
    risk_score: 30 + Math.sin(i * 0.4) * 25 + Math.random() * 15 + (i > 20 ? 20 : 0),
    risk_level: 'medium' as const,
    predicted_disease: i > 22 ? 'cholera' : null,
    disease_confidence: i > 22 ? 0.7 + Math.random() * 0.2 : null,
    affected_population_estimate: null,
    onset_hours_estimate: null,
    model_version: '2.1.0',
    predicted_at: new Date(Date.now() - (29 - i) * 86400000).toISOString(),
    shap_values: {},
    ensemble_scores: {},
})) as OutbreakPrediction[];

// ─── Mock Forensics ──────────────────────────────────────────
export const mockForensics = [
    {
        id: 'for-001', village_id: 'v-001',
        contamination_source: 'industrial_effluent' as const, source_confidence: 0.89,
        contamination_start_timestamp: new Date(Date.now() - 7200000).toISOString(),
        tds_peak: 782,
        upstream_distance_km: 3.2,
        pattern_signature: { spike_rate: 'rapid', duration_hours: 4, chemical_profile: 'heavy_metals' },
        supporting_evidence: { satellite_verified: true, local_reports: 2, industrial_units_nearby: 3 },
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'for-002', village_id: 'v-002',
        contamination_source: 'sewage_overflow' as const, source_confidence: 0.72,
        contamination_start_timestamp: new Date(Date.now() - 86400000).toISOString(),
        tds_peak: 520,
        upstream_distance_km: 1.1,
        pattern_signature: { spike_rate: 'gradual', coliform_detected: true },
        supporting_evidence: { rainfall_mm_24h: 85 },
        created_at: new Date(Date.now() - 43200000).toISOString(),
    },
] as ForensicsReport[];

// ─── Mock Legal Documents ────────────────────────────────────
export const mockLegalDocs = [
    {
        id: 'leg-001', village_id: 'v-001', forensics_report_id: 'for-001',
        document_type: 'cpcb_complaint' as const,
        document_content: '## COMPLAINT TO CENTRAL POLLUTION CONTROL BOARD\n\n**Subject:** Industrial Effluent Contamination of Water Supply\n\n**Village:** Dharangaon, District Jalgaon\n\n### Facts of the Case\n\n1. On the date specified, IoT sensors operated by AquaPulse AI detected a significant spike in Total Dissolved Solids (TDS) levels reaching 782 ppm.\n2. AI forensic analysis has identified the contamination source as industrial effluent with 89% confidence.\n3. The contamination source is estimated to be 3.2 km upstream.\n\n### Relief Sought\n\nImmediate inspection and action against the polluting industrial unit under Section 17 of the Water Act, 1974.',
        filing_status: 'filed' as const,
        filed_at: new Date(Date.now() - 1800000).toISOString(),
        filing_reference: 'CPCB/MH/2024/W-4521',
        generated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'leg-002', village_id: 'v-001', forensics_report_id: 'for-001',
        document_type: 'health_alert' as const,
        document_content: '## PUBLIC HEALTH ALERT\n\n**Village:** Dharangaon\n**Risk Level:** HIGH\n**Predicted Disease:** Cholera\n\n### Advisory\n\n- Boil all drinking water before consumption\n- Avoid water from the main pipeline until further notice\n- Report any cases of diarrhea or vomiting to the PHC immediately',
        filing_status: 'acknowledged' as const,
        filed_at: new Date(Date.now() - 2400000).toISOString(),
        filing_reference: null,
        generated_at: new Date(Date.now() - 3000000).toISOString(),
    },
    {
        id: 'leg-003', village_id: 'v-002', forensics_report_id: 'for-002',
        document_type: 'legal_affidavit' as const,
        document_content: '## LEGAL AFFIDAVIT\n\nI, the undersigned Health Officer, do hereby affirm that the water quality data collected by IoT sensors shows contamination levels exceeding safe limits...',
        filing_status: 'generated' as const,
        filed_at: null,
        filing_reference: null,
        generated_at: new Date(Date.now() - 43200000).toISOString(),
    },
] as LegalDocument[];

// ─── Mock Alerts ─────────────────────────────────────────────
export const mockAlerts = [
    {
        id: 'alert-001', village_id: 'v-001',
        alert_type: 'contamination_detected' as const, severity: 'critical' as const,
        message: 'CRITICAL: Industrial effluent contamination detected in Dharangaon main pipeline. TDS peaked at 782 ppm.',
        is_acknowledged: false,
        acknowledged_by: null, acknowledged_at: null,
        created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        id: 'alert-002', village_id: 'v-001',
        alert_type: 'anomaly_detected' as const, severity: 'high' as const,
        message: 'Risk score for Dharangaon has exceeded 75 (current: 78.4). Cholera outbreak predicted within 48 hours.',
        is_acknowledged: false,
        acknowledged_by: null, acknowledged_at: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: 'alert-003', village_id: 'v-002',
        alert_type: 'contamination_detected' as const, severity: 'medium' as const,
        message: 'Sewage overflow detected in Bhusawal water supply. TDS levels elevated to 520 ppm.',
        is_acknowledged: true,
        acknowledged_by: 'demo-ho-001', acknowledged_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
        id: 'alert-004', village_id: 'v-003',
        alert_type: 'sensor_offline' as const, severity: 'low' as const,
        message: 'Sensor ESP32-TDS-004 at Pachora Handpump #1 has been offline for 24 hours. Battery level: 12%.',
        is_acknowledged: false,
        acknowledged_by: null, acknowledged_at: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'alert-005', village_id: 'v-001',
        alert_type: 'contamination_detected' as const, severity: 'info' as const,
        message: 'CPCB complaint filed for Dharangaon contamination event. Reference: CPCB/MH/2024/W-4521.',
        is_acknowledged: true,
        acknowledged_by: 'demo-ho-001', acknowledged_at: new Date(Date.now() - 600000).toISOString(),
        created_at: new Date(Date.now() - 1200000).toISOString(),
    },
] as Alert[];

// ─── Mock Analytics Summary ──────────────────────────────────
export const mockAnalyticsSummary = {
    villages_monitored: 6,
    active_alerts: 3,
    total_sensors: 5,
    health_officers_count: 4,
    highest_risk_village: { id: 'v-001', name: 'Dharangaon', risk_score: 78.4 },
    cases_prevented_this_month: 142,
    claude_tokens_used_today: 48250,
};

// ─── Mock System Health ──────────────────────────────────────
export const mockSystemHealth = {
    api_server: { status: 'healthy', response_time_ms: 12 },
    database: { status: 'healthy', response_time_ms: 3 },
    redis: { status: 'healthy', response_time_ms: 1 },
    celery_workers: { status: 'ok', active_workers: 4 },
    websocket: { status: 'connected', connections: 12 },
};

export const mockModels = [
    { name: 'outbreak_predictor', version: '2.1.0', accuracy: 0.943, training_date: '2024-09-15T00:00:00Z' },
    { name: 'forensics_classifier', version: '1.8.2', accuracy: 0.891, training_date: '2024-08-20T00:00:00Z' },
    { name: 'anomaly_detector', version: '3.0.1', accuracy: 0.967, training_date: '2024-10-01T00:00:00Z' },
];

export const mockTokenUsage = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
    tokens_used: 30000 + Math.random() * 40000,
}));

export const mockLogs = [
    '[2024-10-15 10:32:15] INFO  api.sensors: Received reading from ESP32-TDS-001 (Dharangaon) TDS=342.1',
    '[2024-10-15 10:32:16] INFO  ml.predictor: Running prediction for village v-001',
    '[2024-10-15 10:32:17] WARNING ml.predictor: Risk score 78.4 exceeds threshold 75 for Dharangaon',
    '[2024-10-15 10:32:17] INFO  alerts: Generated CRITICAL alert for village v-001',
    '[2024-10-15 10:32:18] INFO  forensics: Starting contamination source analysis for v-001',
    '[2024-10-15 10:32:22] INFO  forensics: Source identified: industrial_effluent (89% confidence)',
    '[2024-10-15 10:32:23] INFO  legal: Generating CPCB complaint document',
    '[2024-10-15 10:32:25] INFO  websocket: Broadcasting prediction update to 12 clients',
    '[2024-10-15 10:33:00] INFO  api.sensors: Received reading from ESP32-TDS-003 (Bhusawal) TDS=298.5',
    '[2024-10-15 10:33:01] INFO  ml.predictor: Running prediction for village v-002',
    '[2024-10-15 10:34:00] ERROR api.sensors: Connection timeout from ESP32-TDS-004 (Pachora)',
    '[2024-10-15 10:34:01] WARNING alerts: Sensor ESP32-TDS-004 offline > 24h, battery 12%',
];

// ─── Mock Chat ───────────────────────────────────────────────
export const mockChatSuggestions = [
    'What is the current risk level for Dharangaon?',
    'Show me the contamination source analysis',
    'Which villages need immediate attention?',
    'Explain the SHAP values for the latest prediction',
    'What is the TDS trend over the last 24 hours?',
];

// ─── Mock Users list for admin ───────────────────────────────
export const mockUsers = [
    mockAdminUser,
    mockHealthOfficer,
    {
        id: 'demo-ho-002', email: 'meera@aquapulse.in', full_name: 'Meera Patil',
        phone: '+91 98765 67890', role: 'health_officer' as const, is_active: true,
        assigned_village_ids: ['v-005', 'v-006'],
        last_login: new Date(Date.now() - 3600000).toISOString(),
        created_at: '2024-03-10T00:00:00Z', updated_at: new Date().toISOString(),
    } as User,
    {
        id: 'demo-ho-003', email: 'suresh@aquapulse.in', full_name: 'Suresh Jadhav',
        phone: '+91 98765 11111', role: 'health_officer' as const, is_active: false,
        assigned_village_ids: [] as string[],
        last_login: new Date(Date.now() - 86400000 * 30).toISOString(),
        created_at: '2024-01-20T00:00:00Z', updated_at: new Date().toISOString(),
    } as User,
];

// ─── Risk scores lookup ──────────────────────────────────────
export const mockRiskScores: Record<string, number> = {
    'v-001': 78.4,
    'v-002': 42.1,
    'v-003': 22.7,
    'v-004': 55.2,
    'v-005': 34.8,
    'v-006': 18.3,
};
