import apiClient from './client';

export interface AnalyticsSummary {
    villages_monitored: number;
    active_alerts: number;
    highest_risk_village: {
        id: string;
        name: string;
        risk_score: number;
        risk_level: string;
    } | null;
    cases_prevented_this_month: number;
    total_sensors: number;
    health_officers_count: number;
    claude_tokens_used_today: number;
}

export interface TokenUsage {
    date: string;
    tokens_used: number;
    health_alerts: number;
    legal_affidavits: number;
    chatbot_messages: number;
}

export const analyticsApi = {
    getSummary: async (): Promise<AnalyticsSummary> => {
        const response = await apiClient.get<AnalyticsSummary>('/analytics/summary');
        return response.data;
    },

    getTokenUsage: async (days: number = 30): Promise<TokenUsage[]> => {
        const response = await apiClient.get<TokenUsage[]>('/analytics/token-usage', { params: { days } });
        return response.data;
    },
};
