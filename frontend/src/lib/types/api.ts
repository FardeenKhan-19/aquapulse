export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface ApiError {
    message: string;
    error_code?: string;
    status?: number;
}
