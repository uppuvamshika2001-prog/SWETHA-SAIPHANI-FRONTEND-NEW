import { AppRole } from '@/types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL  ;


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
    private refreshPromise: Promise<void> | null = null;

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

    private async refreshAccessToken(refreshToken: string): Promise<void> {
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async () => {
            try {
                console.log('[API] Attempting to refresh access token...');
                const response = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!response.ok) {
                    throw new Error('Refresh failed');
                }

                const res = await response.json();
                const tokens = (res && res.status === 'success' && res.data !== undefined) ? res.data : res;

                localStorage.setItem('accessToken', tokens.accessToken);
                localStorage.setItem('refreshToken', tokens.refreshToken);
                console.log('[API] Token refreshed successfully');
            } catch (error) {
                console.error('[API] Token refresh failed', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                throw error;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    private async handleResponse<T>(response: Response, retryRequest?: () => Promise<T>): Promise<T> {
        console.log(`[API] ${response.url} returned ${response.status}`);

        const isAuthEndpoint = response.url.includes('/auth/login') ||
            response.url.includes('/auth/register') ||
            response.url.includes('/auth/refresh');


        if (response.status === 401) {
            if (!isAuthEndpoint) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken && retryRequest) {
                    try {
                        await this.refreshAccessToken(refreshToken);
                        return await retryRequest();
                    } catch (error) {
                        console.error('[API] Silent refresh failed, redirecting to login');
                    }
                }

                // Redirect to appropriate login page if refresh not possible or failed
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath.includes('/login') || currentPath === '/';

                console.log(`[API] 401 Check - Path: ${currentPath}, isAuthEndpoint: ${isAuthEndpoint}, isOnLoginPage: ${isOnLoginPage}`);

                if (!isOnLoginPage) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');

                    let loginPath = '/';
                    if (currentPath.startsWith('/admin')) loginPath = '/admin/login';
                    else if (currentPath.startsWith('/doctor')) loginPath = '/doctor/login';
                    else if (currentPath.startsWith('/reception')) loginPath = '/reception/login';
                    else if (currentPath.startsWith('/pharmacy')) loginPath = '/pharmacy/login';
                    else if (currentPath.startsWith('/lab')) loginPath = '/lab/login';
                    else if (currentPath.startsWith('/patient')) loginPath = '/patient/login';

                    console.log(`[API 401] Session expired, redirecting to ${loginPath}`);
                    toast.error("Session expired. Please login again.");

                    setTimeout(() => {
                        window.location.href = loginPath;
                    }, 100);
                } else {
                    console.log('[API] 401 intercepted, but user is on login page. Initializing generic error.');
                }
            } else {
                console.log('[API] 401 on Auth Endpoint - skipping auto-redirect logic');
            }
        }

        if (!response.ok) {
            let errorData: any = {};
            try {
                errorData = await response.json();
                console.error('[API Error Response]', JSON.stringify(errorData, null, 2));
            } catch (e) {
                console.error('[API] Could not parse error response as JSON');
            }

            const extractErrorMessage = (data: any): string | null => {
                if (!data) return null;
                if (typeof data.message === 'string') return data.message;
                if (typeof data.error === 'string') return data.error;
                if (data.error?.message) return data.error.message;
                if (data.errors && Array.isArray(data.errors) && data.errors[0]?.message) {
                    return data.errors.map((e: any) => e.message).join(', ');
                }
                if (data.detail) return data.detail;
                if (data.msg) return data.msg;
                return null;
            };

            const errorMessage = extractErrorMessage(errorData);

            switch (response.status) {
                case 400: throw new Error(errorMessage || 'Bad request. Please check your input.');
                case 401:
                    if (isAuthEndpoint) {
                        // User requested specific "Incorrect password" message.
                        // If backend returns generic "Invalid email or password", override it.
                        if (!errorMessage || errorMessage.toLowerCase().includes('invalid email or password')) {
                            throw new Error('Incorrect password');
                        }
                        throw new Error(errorMessage);
                    }
                    throw new Error(errorMessage || 'Session expired. Please login again.');
                case 403: throw new Error(errorMessage || 'Access denied. You do not have permission.');
                case 404:
                    if (isAuthEndpoint) {
                        // Map 404 on login to "Invalid email"
                        if (!errorMessage || errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('invalid')) {
                            throw new Error('Invalid email');
                        }
                        throw new Error(errorMessage);
                    }
                    throw new Error(errorMessage || 'Resource not found.');
                case 409: throw new Error(errorMessage || 'User already exists. Please login instead.');
                case 422: throw new Error(errorMessage || 'Validation error. Please check your input.');
                case 429:
                    toast.error("Too many attempts. Please wait a moment and try again.");
                    throw new Error(errorMessage || 'Too many requests. Please wait a moment and try again.');
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

        if (response.status === 204) return {} as T;
        const res = await response.json();
        if (res && res.status === 'success' && res.data !== undefined) {
            return res.data as T;
        }
        return res as T;
    }

    async get<T>(endpoint: string): Promise<T> {
        const execute = async () => {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            return this.handleResponse<T>(response, execute);
        };
        return execute();
    }

    async post<T>(endpoint: string, body: any): Promise<T> {
        const execute = async () => {
            const headers = this.getHeaders();
            let requestBody;
            if (body instanceof FormData) {
                delete headers['Content-Type'];
                requestBody = body;
            } else {
                requestBody = JSON.stringify(body);
            }

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: requestBody,
            });
            return this.handleResponse<T>(response, execute);
        };
        return execute();
    }

    async patch<T>(endpoint: string, body: any): Promise<T> {
        const execute = async () => {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });
            return this.handleResponse<T>(response, execute);
        };
        return execute();
    }

    async put<T>(endpoint: string, body: any): Promise<T> {
        const execute = async () => {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });
            return this.handleResponse<T>(response, execute);
        };
        return execute();
    }

    async delete<T>(endpoint: string): Promise<T> {
        const execute = async () => {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return this.handleResponse<T>(response, execute);
        };
        return execute();
    }

    // Auth specific methods
    async login(email: string, password: string): Promise<AuthResponse> {
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
