import { AppRole } from '@/types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';


export interface User {
    id: string;
    email: string;
    role: AppRole;
    full_name?: string;
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        role: string; // Backend returns uppercase string
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    };
}

class ApiService {
    private getHeaders() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Correlation-ID': `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        };
        const token = localStorage.getItem('accessToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        console.log(`[API] ${response.url} returned ${response.status}`);
        if (!response.ok) {
            let errorData: any = {};
            try {
                errorData = await response.json();
                // Log the full error response for debugging
                console.error('[API Error Response]', JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.error('[API] Could not parse error response as JSON');
            }

            // Helper function to extract error message from various backend formats
            const extractErrorMessage = (data: any): string | null => {
                if (!data) return null;
                // Try common error message locations
                if (typeof data.message === 'string') return data.message;
                if (typeof data.error === 'string') return data.error;
                if (data.error?.message) return data.error.message;
                if (data.errors && Array.isArray(data.errors) && data.errors[0]?.message) {
                    return data.errors.map((e: any) => e.message).join(', ');
                }
                if (data.detail) return data.detail; // FastAPI format
                if (data.msg) return data.msg;
                return null;
            };

            const errorMessage = extractErrorMessage(errorData);

            // Handle specific HTTP status codes
            switch (response.status) {
                case 400:
                    throw new Error(errorMessage || 'Bad request. Please check your input.');

                case 401: {
                    // Check if this is from an auth endpoint (login/register) - don't redirect
                    const isAuthEndpoint = response.url.includes('/auth/login') ||
                        response.url.includes('/auth/register');

                    if (isAuthEndpoint) {
                        throw new Error(errorMessage || 'Invalid email or password');
                    }

                    // For other 401s (session expired), redirect to appropriate login page
                    const currentPath = window.location.pathname;
                    const isOnLoginPage = currentPath.includes('/login') || currentPath === '/';

                    if (!isOnLoginPage) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');

                        // Determine correct login page based on current path
                        let loginPath = '/';
                        if (currentPath.startsWith('/admin')) loginPath = '/admin/login';
                        else if (currentPath.startsWith('/doctor')) loginPath = '/doctor/login';
                        else if (currentPath.startsWith('/reception')) loginPath = '/reception/login';
                        else if (currentPath.startsWith('/pharmacy')) loginPath = '/pharmacy/login';
                        else if (currentPath.startsWith('/lab')) loginPath = '/lab/login';
                        else if (currentPath.startsWith('/patient')) loginPath = '/patient/login';

                        console.log(`[API 401] Session expired, redirecting to ${loginPath}`);

                        // Show toast notification (dynamic import to avoid circular deps)
                        toast.error("Session expired. Please login again.");

                        // Small delay to allow toast to show
                        setTimeout(() => {
                            window.location.href = loginPath;
                        }, 100);
                    }
                    throw new Error(errorMessage || 'Session expired. Please login again.');
                }

                case 403:
                    throw new Error(errorMessage || 'Access denied. You do not have permission.');

                case 404:
                    throw new Error(errorMessage || 'Resource not found.');

                case 409:
                    throw new Error(errorMessage || 'User already exists. Please login instead.');

                case 422:
                    throw new Error(errorMessage || 'Validation error. Please check your input.');

                case 429: {
                    // Rate limit exceeded - show toast and DO NOT retry
                    console.warn('[API 429] Rate limit exceeded');
                    toast.error("Too many attempts. Please wait a moment and try again.");
                    throw new Error(errorMessage || 'Too many requests. Please wait a moment and try again.');
                }

                case 500:
                    console.error('[API] Server Error 500 - Backend issue detected');
                    throw new Error(errorMessage || 'Server error. Please try again later or contact support.');

                case 502:
                case 503:
                case 504:
                    throw new Error(errorMessage || 'Server is temporarily unavailable. Please try again.');

                default:
                    throw new Error(errorMessage || `Request failed with status ${response.status}`);
            }
        }
        if (response.status === 204) {
            return {} as T;
        }
        const res = await response.json();
        // Some endpoints return { status: 'success', data: ... }, others just data.
        // We'll normalize this. If 'data' property exists and looks like a wrapper, return 'data'.
        if (res && res.status === 'success' && res.data !== undefined) {
            return res.data as T;
        }
        return res as T;
    }

    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(endpoint: string, body: any): Promise<T> {
        const headers = this.getHeaders();
        let requestBody = body;

        console.log(`[API Request] POST ${endpoint}`, body instanceof FormData ? 'FormData' : 'JSON');

        // Handle FormData
        if (body instanceof FormData) {
            delete headers['Content-Type']; // Let browser set multipart boundary
            requestBody = body;
        } else {
            requestBody = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: requestBody,
        });
        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, body: any): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(endpoint: string, body: any): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    // Auth specific methods
    async login(email: string, password: string): Promise<AuthResponse> {
        // Use generic post, but wrapped response is handled inside handleResponse
        return this.post<AuthResponse>('/auth/login', { email, password });
    }

    async register(email: string, password: string, firstName: string, lastName: string, role: string) {
        return this.post<AuthResponse>('/auth/register', {
            email,
            password,
            firstName,
            lastName,
            role: role.toUpperCase()
        });
    }

    async getMe(): Promise<{ userId: string; email: string; role: string }> {
        return this.get<{ userId: string; email: string; role: string }>('/auth/me');
    }

    async logout(refreshToken: string) {
        return this.post<void>('/auth/logout', { refreshToken });
    }
    async updateProfile(data: any) {
        return this.patch<any>('/users/me', data);
    }

    async changePassword(data: any) {
        return this.post<void>('/auth/change-password', data);
    }
}

export const api = new ApiService();
