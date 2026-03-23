import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '@/lib/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// In the browser, use relative paths so requests go through Next.js rewrites (avoids CORS).
// On the server (SSR), use the full URL to reach the backend directly.
const effectiveBaseURL = typeof window !== 'undefined' ? '/api' : `${API_BASE_URL}/api`;

const apiClient = axios.create({
    baseURL: effectiveBaseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60s to allow Render free tier to wake up
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

export function setAccessToken(token: string | null) {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

function onTokenRefreshed(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            response.data = (response.data as ApiResponse<unknown>).data;
        }
        return response;
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        resolve(apiClient(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshUrl = typeof window !== 'undefined'
                    ? '/api/auth/refresh'
                    : `${API_BASE_URL}/api/auth/refresh`;
                const refreshResponse = await axios.post(
                    refreshUrl,
                    {},
                    { withCredentials: true }
                );
                const newToken = refreshResponse.data?.data?.access_token || refreshResponse.data?.access_token;
                if (newToken) {
                    setAccessToken(newToken);
                    onTokenRefreshed(newToken);
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    return apiClient(originalRequest);
                }
                throw new Error('No token in refresh response');
            } catch (refreshError) {
                setAccessToken(null);
                refreshSubscribers = [];
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        const apiError: ApiError = {
            message: error.response?.data?.message || error.message || 'An unexpected error occurred',
            error_code: (error.response?.data as unknown as Record<string, string>)?.error_code,
            status: error.response?.status,
        };

        return Promise.reject(apiError);
    }
);

// Install mock interceptor for demo mode
import { installMockInterceptor } from '@/lib/mock/interceptor';
installMockInterceptor(apiClient);

export default apiClient;
