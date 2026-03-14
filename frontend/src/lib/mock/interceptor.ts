import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
    DEMO_MODE,
    mockVillages, mockSensors, mockReadings, mockPredictions, mockPredictionHistory,
    mockForensics, mockLegalDocs, mockAlerts, mockAnalyticsSummary,
    mockSystemHealth, mockModels, mockTokenUsage, mockLogs, mockUsers,
    mockChatSuggestions, mockRiskScores, mockHealthOfficer, mockAdminUser,
} from '@/lib/mock/data';

type MockResponse = { data: unknown; status: number };

function paginated<T>(items: T[], params: Record<string, string>) {
    const page = parseInt(params.page || '1');
    const perPage = parseInt(params.per_page || '20');
    const search = params.search?.toLowerCase();
    let filtered = items;
    if (search) {
        filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(search));
    }
    const start = (page - 1) * perPage;
    return {
        items: filtered.slice(start, start + perPage),
        total: filtered.length,
        page,
        per_page: perPage,
        total_pages: Math.ceil(filtered.length / perPage),
    };
}

function getParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const queryString = url.split('?')[1];
    if (queryString) {
        queryString.split('&').forEach((p) => {
            const [k, v] = p.split('=');
            params[decodeURIComponent(k)] = decodeURIComponent(v);
        });
    }
    return params;
}

function matchRoute(url: string, pattern: string): string | null {
    const cleanUrl = url.split('?')[0];
    const urlParts = cleanUrl.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    if (urlParts.length !== patternParts.length) return null;
    let param: string | null = null;
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            param = urlParts[i];
        } else if (patternParts[i] !== urlParts[i]) {
            return null;
        }
    }
    return param ?? '';
}

function handleMockRequest(url: string, method: string, _data?: unknown): MockResponse | null {
    const path = url.replace(/^.*\/api\//, '');
    const params = getParams(url);

    // Auth
    if (path.startsWith('auth/refresh')) return { data: { access_token: 'demo-token', user: mockHealthOfficer }, status: 200 };
    if (path.startsWith('auth/me')) return { data: mockHealthOfficer, status: 200 };

    // Villages
    if (path === 'villages' || path.startsWith('villages?')) return { data: paginated(mockVillages, params), status: 200 };
    const villageId = matchRoute(path, 'villages/:id');
    if (villageId) {
        const villageReadingsId = matchRoute(path, 'villages/:id/readings');
        if (villageReadingsId !== null && path.includes('readings')) return { data: mockReadings, status: 200 };
        const v = mockVillages.find((v) => v.id === villageId);
        return { data: v || mockVillages[0], status: 200 };
    }

    // Predictions
    if (path.startsWith('predictions/latest/')) {
        const vid = path.replace('predictions/latest/', '');
        return { data: mockPredictions.find((p) => p.village_id === vid) || mockPredictions[0], status: 200 };
    }
    if (path.startsWith('predictions') && !path.includes('what-if')) {
        return { data: paginated([...mockPredictions, ...mockPredictionHistory], params), status: 200 };
    }
    if (path.includes('what-if')) {
        return { data: { ...mockPredictions[0], risk_score: 45 + Math.random() * 40 }, status: 200 };
    }

    // Forensics
    if (path === 'forensics' || path.startsWith('forensics?')) return { data: paginated(mockForensics, params), status: 200 };
    if (path.startsWith('forensics/village/')) {
        const vid = path.replace('forensics/village/', '');
        return { data: mockForensics.filter((f) => f.village_id === vid), status: 200 };
    }
    const forensicsId = matchRoute(path, 'forensics/:id');
    if (forensicsId) return { data: mockForensics.find((f) => f.id === forensicsId) || mockForensics[0], status: 200 };

    // Legal
    if (path === 'legal' || path.startsWith('legal?')) return { data: paginated(mockLegalDocs, params), status: 200 };
    if (path.startsWith('legal/village/')) {
        const vid = path.replace('legal/village/', '');
        return { data: mockLegalDocs.filter((d) => d.village_id === vid), status: 200 };
    }
    const legalId = matchRoute(path, 'legal/:id');
    if (legalId) return { data: mockLegalDocs.find((d) => d.id === legalId) || mockLegalDocs[0], status: 200 };

    // Alerts
    if (path.startsWith('alerts')) {
        return { data: paginated(mockAlerts, params), status: 200 };
    }

    // Sensors
    if (path === 'sensors' || path.startsWith('sensors?')) return { data: paginated(mockSensors, params), status: 200 };
    const sensorId = matchRoute(path, 'sensors/:id');
    if (sensorId && !path.includes('readings')) return { data: mockSensors.find((s) => s.id === sensorId) || mockSensors[0], status: 200 };
    if (sensorId && path.includes('readings')) return { data: mockReadings, status: 200 };

    // Analytics
    if (path.startsWith('analytics/summary')) return { data: mockAnalyticsSummary, status: 200 };
    if (path.startsWith('analytics/token-usage')) return { data: mockTokenUsage, status: 200 };

    // Admin
    if (path.startsWith('admin/users') && method === 'GET') {
        const userId = matchRoute(path, 'admin/users/:id');
        if (userId) return { data: mockUsers.find((u) => u.id === userId) || mockUsers[0], status: 200 };
        return { data: paginated(mockUsers, params), status: 200 };
    }
    if (path.startsWith('admin/health')) return { data: mockSystemHealth, status: 200 };
    if (path.startsWith('admin/models')) return { data: mockModels, status: 200 };
    if (path.startsWith('admin/logs')) return { data: mockLogs, status: 200 };
    if (path.startsWith('admin/retrain')) return { data: { job_id: 'demo-job-' + Date.now() }, status: 200 };

    // Chatbot
    if (path.startsWith('chatbot/suggestions')) return { data: mockChatSuggestions, status: 200 };
    if (path.startsWith('chatbot/sessions')) return { data: { items: [] }, status: 200 };
    if (path.startsWith('chatbot/ask') || path.startsWith('chatbot/send')) {
        return {
            data: {
                role: 'assistant',
                content: '**Dharangaon** currently has a **HIGH** risk score of **78.4**. The AI model predicts a potential cholera outbreak within 48 hours. Key contributing factors include:\n\n| Factor | SHAP Value |\n|--------|------------|\n| TDS Level | +0.34 |\n| Turbidity | +0.21 |\n| Previous Outbreaks | +0.18 |\n| Population Density | +0.15 |\n\nA CPCB complaint has been filed (Ref: CPCB/MH/2024/W-4521). I recommend issuing a boil-water advisory immediately.',
                timestamp: new Date().toISOString(),
            },
            status: 200,
        };
    }

    // Demo
    if (path.startsWith('demo/')) return { data: { status: 'ok' }, status: 200 };

    return null;
}

export function installMockInterceptor(apiClient: { interceptors: { request: { use: Function }; response: { use: Function } } }) {
    if (!DEMO_MODE) return;

    apiClient.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const url = `${config.baseURL || ''}${config.url || ''}`;
            const method = (config.method || 'get').toUpperCase();
            const result = handleMockRequest(url, method, config.data);

            if (result) {
                // Cancel the real request and return mock data
                const mockAdapter = () =>
                    Promise.resolve({
                        data: result.data,
                        status: result.status,
                        statusText: 'OK',
                        headers: {},
                        config,
                    } as AxiosResponse);
                config.adapter = mockAdapter;
            }
            return config;
        },
        (error: unknown) => Promise.reject(error)
    );
}
