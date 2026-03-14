import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';
import { setAccessToken } from '@/lib/api/client';
import type { User, LoginCredentials } from '@/lib/types/user';
import { DEMO_MODE, mockAdminUser, mockHealthOfficer } from '@/lib/mock/data';

interface AuthState {
    user: Pick<User, 'id' | 'email' | 'role' | 'full_name'> | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    setUser: (user: Pick<User, 'id' | 'email' | 'role' | 'full_name'>) => void;
    initialize: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        if (DEMO_MODE) {
            const isAdmin = credentials.email.includes('admin');
            const user = isAdmin ? mockAdminUser : mockHealthOfficer;
            setAccessToken('demo-token');
            set({ user, accessToken: 'demo-token', isAuthenticated: true, isLoading: false, error: null });
            if (typeof window !== 'undefined') {
                localStorage.setItem('demo_role', user.role);
                window.location.href = isAdmin ? '/admin' : '/dashboard';
            }
            return;
        }
        try {
            const response = await authApi.login(credentials);
            const token = response.access_token;
            setAccessToken(token);
            set({
                user: response.user,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (err: unknown) {
            const error = err as { message?: string };
            set({
                isLoading: false,
                error: error.message || 'Login failed',
            });
            throw err;
        }
    },

    logout: async () => {
        if (!DEMO_MODE) {
            try { await authApi.logout(); } catch { /* Continue */ }
        }
        setAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, error: null });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('demo_role');
            window.location.href = '/login';
        }
    },

    refreshToken: async () => {
        try {
            const response = await authApi.refresh();
            const token = response.access_token;
            setAccessToken(token);
            set({
                user: response.user,
                accessToken: token,
                isAuthenticated: true,
            });
        } catch {
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
            });
            setAccessToken(null);
        }
    },

    setUser: (user) => set({ user }),

    initialize: async () => {
        set({ isLoading: true });
        if (DEMO_MODE) {
            // Auto-login based on previously selected role in demo mode
            setAccessToken('demo-token');
            let user = mockHealthOfficer;
            if (typeof window !== 'undefined') {
                const savedRole = localStorage.getItem('demo_role');
                if (savedRole === 'admin') user = mockAdminUser;
            }
            set({ user, accessToken: 'demo-token', isAuthenticated: true, isLoading: false });
            return;
        }
        try {
            const response = await authApi.refresh();
            const token = response.access_token;
            setAccessToken(token);
            set({ user: response.user, accessToken: token, isAuthenticated: true, isLoading: false });
        } catch {
            set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
            setAccessToken(null);
        }
    },

    clearError: () => set({ error: null }),
}));
