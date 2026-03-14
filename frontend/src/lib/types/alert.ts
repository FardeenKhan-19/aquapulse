export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AlertType =
    | 'outbreak_risk'
    | 'sensor_offline'
    | 'contamination_detected'
    | 'legal_filed'
    | 'water_quality_normal'
    | 'sensor_anomaly';

export interface Alert {
    id: string;
    village_id: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    message: string;
    is_acknowledged: boolean;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
    created_at: string;
}
