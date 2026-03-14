export type ContaminationSource =
    | 'industrial_effluent'
    | 'sewage_overflow'
    | 'fertilizer_runoff'
    | 'pipe_corrosion'
    | 'algal_bloom'
    | 'natural_hardness'
    | 'unknown';

export interface ForensicsReport {
    id: string;
    village_id: string;
    outbreak_prediction_id?: string;
    generated_at?: string;
    contamination_source: ContaminationSource;
    source_confidence: number;
    contamination_start_timestamp: string;
    upstream_distance_km: number | null;
    tds_baseline?: number;
    tds_peak: number;
    tds_rise_rate?: number;
    pattern_signature: Record<string, unknown>;
    supporting_evidence: Record<string, unknown>;
    created_at?: string;
}
