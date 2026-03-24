import { AppRole } from '@/types';
import { toast } from 'sonner';
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@/config/api';
const API_URL = API_BASE_URL.replace(/\/+$/, '') + '/api';


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
    private instance: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: any[] = [];

    constructor() {
        this.instance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            }
        });

        this.setupInterceptors();
    }

    private processQueue(error: any | null, token: string | null = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    private setupInterceptors() {
        // Request Interceptor
        this.instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
                // Add tracking headers
                config.headers['X-Correlation-ID'] = `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response Interceptor
        this.instance.interceptors.response.use(
            (response) => {
                // Backend standard response: { status: 'success', data: ... }
                const res = response.data;
                if (res && res.status === 'success' && res.data !== undefined) {
                    return res.data;
                }
                return res;
            },
            async (error: AxiosError) => {
                const originalRequest: any = error.config;
                const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
                    originalRequest?.url?.includes('/auth/register') ||
                    originalRequest?.url?.includes('/auth/refresh');

                if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({
                                resolve: (token: string) => {
                                    originalRequest.headers.Authorization = `Bearer ${token}`;
                                    resolve(this.instance(originalRequest));
                                },
                                reject: (err: any) => reject(err)
                            });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        console.log('[API] Attempting to refresh access token...');
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (!refreshToken) throw new Error('No refresh token');

                        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        // Handle standard project response structure
                        const resData = response.data;
                        const tokens = (resData && resData.status === 'success' && resData.data !== undefined) ? resData.data : resData;

                        const { accessToken, refreshToken: newRefreshToken } = tokens;
                        
                        localStorage.setItem('accessToken', accessToken);
                        if (newRefreshToken) {
                            localStorage.setItem('refreshToken', newRefreshToken);
                        }

                        console.log('[API] Token refreshed successfully');
                        this.instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                        
                        // CRITICAL: Update the original request's Authorization header with the new token
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                        
                        this.processQueue(null, accessToken);
                        
                        // Retry the original request with the new token
                        return this.instance(originalRequest);
                    } catch (refreshError) {
                        console.error('[API] Token refresh failed', refreshError);
                        this.processQueue(refreshError, null);
                        this.handleLogout();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                // Enhanced Error Extracting (inherited from original fetch implementation)
                let errorMessage = 'An error occurred';
                const errorData: any = error.response?.data;
                
                if (errorData) {
                    if (typeof errorData.message === 'string') errorMessage = errorData.message;
                    else if (typeof errorData.error === 'string') errorMessage = errorData.error;
                    else if (errorData.error?.message) errorMessage = errorData.error.message;
                    else if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorMessage = errorData.errors.map((e: any) => e.message).join(', ');
                    }
                }

                // Map specific error statuses (similar to old fetch handler)
                if (error.response?.status === 401 && isAuthEndpoint) {
                    if (errorMessage.toLowerCase().includes('password')) errorMessage = 'Incorrect password';
                } else if (error.response?.status === 404 && isAuthEndpoint) {
                    errorMessage = 'Invalid email';
                }

                return Promise.reject(new Error(errorMessage));
            }
        );
    }

    private handleLogout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        const currentPath = window.location.pathname;
        const isOnLoginPage = currentPath.includes('/login') || currentPath === '/';

        if (!isOnLoginPage) {
            let loginPath = '/';
            if (currentPath.startsWith('/admin')) loginPath = '/admin/login';
            else if (currentPath.startsWith('/doctor')) loginPath = '/doctor/login';
            else if (currentPath.startsWith('/reception')) loginPath = '/reception/login';
            else if (currentPath.startsWith('/pharmacy')) loginPath = '/pharmacy/login';
            else if (currentPath.startsWith('/lab')) loginPath = '/lab/login';
            else if (currentPath.startsWith('/patient')) loginPath = '/patient/login';

            toast.error("Session expired. Please login again.");
            setTimeout(() => {
                window.location.href = loginPath;
            }, 100);
        }
    }

    async get<T>(endpoint: string, options?: { params?: any; signal?: any; headers?: any }): Promise<T> {
        return this.instance.get(endpoint, { 
            params: options?.params,
            signal: options?.signal,
            headers: options?.headers
        });
    }

    async post<T>(endpoint: string, body: any, options?: { signal?: any; headers?: any }): Promise<T> {
        return this.instance.post(endpoint, body, {
            signal: options?.signal,
            headers: options?.headers
        });
    }

    async patch<T>(endpoint: string, body: any, options?: { signal?: any; headers?: any }): Promise<T> {
        return this.instance.patch(endpoint, body, {
            signal: options?.signal,
            headers: options?.headers
        });
    }

    async put<T>(endpoint: string, body: any, options?: { signal?: any; headers?: any }): Promise<T> {
        return this.instance.put(endpoint, body, {
            signal: options?.signal,
            headers: options?.headers
        });
    }

    async delete<T>(endpoint: string, options?: { params?: any; signal?: any; headers?: any }): Promise<T> {
        return this.instance.delete(endpoint, {
            params: options?.params,
            signal: options?.signal,
            headers: options?.headers
        });
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

    async confirmLabPayment(id: string) {
        return this.patch<any>(`/lab/orders/${id}/confirm-payment`, {});
    }
    // Expose raw axios instance (with interceptors) for edge cases
    getAxiosInstance(): AxiosInstance {
        return this.instance;
    }
}

export const api = new ApiService();
