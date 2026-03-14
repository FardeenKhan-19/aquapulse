export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'health_officer';
    phone: string | null;
    assigned_village_ids: string[];
    is_active: boolean;
    last_login: string | null;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: Pick<User, 'id' | 'email' | 'role' | 'full_name'>;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface CreateUserPayload {
    email: string;
    full_name: string;
    password: string;
    phone?: string;
    role: 'health_officer';
    assigned_village_ids: string[];
}

export interface UpdateUserPayload {
    full_name?: string;
    phone?: string;
    assigned_village_ids?: string[];
    is_active?: boolean;
}
