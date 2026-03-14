export type RiskLevel = 'baseline' | 'low' | 'medium' | 'high' | 'critical';

export interface OutbreakPrediction {
    id: string;
    village_id: string;
    predicted_at: string;
    risk_score: number;
    risk_level: RiskLevel;
    predicted_disease: string | null;
    disease_confidence: number | null;
    affected_population_estimate: number | null;
    onset_hours_estimate: number | null;
    model_version: string;
    shap_values: Record<string, number>;
    ensemble_scores: {
        xgboost: number;
        random_forest: number;
        gradient_boost: number;
    };
}
