import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

// Types
export interface LabOrder {
    id: string;
    patientId: string;
    orderedById: string;
    testName: string;
    testCode: string | null;
    priority: string;
    status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_PENDING' | 'READY_FOR_SAMPLE_COLLECTION';
    notes: string | null;
    patient: { firstName: string; lastName: string };
    orderedBy: { firstName: string; lastName: string };
    bill?: {
        status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
        id: string;
    } | null;
    result?: LabResult | null;
    createdAt: string;
}

export interface LabResult {
    id: string;
    orderId: string;
    technicianId: string;
    result: {
        parameters: Array<{
            name: string;
            value: string;
            unit?: string;
            normalRange?: string;
        }>;
    };
    interpretation: string | null;
    attachments: string[] | null;
    completedAt: string;
}

export interface CreateLabOrderInput {
    patientId: string;
    testName: string;
    testCode?: string;
    priority?: 'normal' | 'urgent' | 'stat';
    notes?: string;
}

export interface CreateLabResultInput {
    orderId: string;
    result: {
        parameters: Array<{
            name: string;
            value: string;
            unit?: string;
            normalRange?: string;
        }>;
    };
    interpretation?: string;
    attachments?: string[];
}

interface LabContextType {
    // State
    labOrders: LabOrder[];
    myLabOrders: LabOrder[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchLabOrders: (status?: string) => Promise<void>;
    fetchMyLabOrders: () => Promise<void>;
    createLabOrder: (input: CreateLabOrderInput) => Promise<LabOrder>;
    updateOrderStatus: (orderId: string, status: string) => Promise<LabOrder>;
    submitResult: (input: CreateLabResultInput) => Promise<LabResult>;
    uploadFile: (file: File) => Promise<{ url: string; filename: string }>;
    refreshOrders: () => Promise<void>;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [myLabOrders, setMyLabOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetchedOrders, setHasFetchedOrders] = useState(false);
    const [hasFetchedMyOrders, setHasFetchedMyOrders] = useState(false);

    // Fetch all lab orders (for lab technicians)
    const fetchLabOrders = useCallback(async (status?: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (status) params.append('status', status);

            const response = await api.get<{ items: LabOrder[] }>(`/lab/orders?${params}`);
            setLabOrders(response.items || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch lab orders');
            console.error('[LabContext] fetchLabOrders error:', err);
        } finally {
            setLoading(false);
            setHasFetchedOrders(true);
        }
    }, []);

    // Fetch doctor's own orders
    const fetchMyLabOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<{ items: LabOrder[] }>('/lab/orders/my-orders?limit=50');
            setMyLabOrders(response.items || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch my lab orders');
            console.error('[LabContext] fetchMyLabOrders error:', err);
        } finally {
            setLoading(false);
            setHasFetchedMyOrders(true);
        }
    }, []);

    // Create a new lab order
    const createLabOrder = useCallback(async (input: CreateLabOrderInput): Promise<LabOrder> => {
        const order = await api.post<LabOrder>('/lab/orders', input);
        // Refresh lists
        fetchLabOrders();
        fetchMyLabOrders();
        return order;
    }, [fetchLabOrders, fetchMyLabOrders]);

    // Update order status
    const updateOrderStatus = useCallback(async (orderId: string, status: string): Promise<LabOrder> => {
        const order = await api.patch<LabOrder>(`/lab/orders/${orderId}/status`, { status });
        // Refresh lists
        fetchLabOrders();
        return order;
    }, [fetchLabOrders]);

    // Submit lab result
    const submitResult = useCallback(async (input: CreateLabResultInput): Promise<LabResult> => {
        const result = await api.post<LabResult>('/lab/results', input);
        // Refresh lists
        fetchLabOrders();
        fetchMyLabOrders();
        return result;
    }, [fetchLabOrders, fetchMyLabOrders]);

    // Upload result file
    const uploadFile = useCallback(async (file: File): Promise<{ url: string; filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        return await api.post<{ url: string; filename: string }>('/upload', formData);
    }, []);

    // Refresh all orders (manual refresh resets hasFetched)
    const refreshOrders = useCallback(async () => {
        setHasFetchedOrders(false);
        setHasFetchedMyOrders(false);
        await Promise.all([fetchLabOrders(), fetchMyLabOrders()]);
    }, [fetchLabOrders, fetchMyLabOrders]);

    // Auto-fetch on mount based on user role (with hasFetched guard)
    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // Reset state if user logs out
        if (!user) {
            setLabOrders([]);
            setMyLabOrders([]);
            setHasFetchedOrders(false);
            setHasFetchedMyOrders(false);
            return;
        }

        // Fetch my orders for doctor/admin (only if not already fetched)
        if ((user.role === 'doctor' || user.role === 'admin') && !hasFetchedMyOrders) {
            fetchMyLabOrders();
        }

        // Fetch all orders for lab tech/admin/receptionist (only if not already fetched)
        if ((user.role === 'lab_technician' || user.role === 'admin' || user.role === 'receptionist') && !hasFetchedOrders) {
            fetchLabOrders();
        }
    }, [user, authLoading, hasFetchedOrders, hasFetchedMyOrders, fetchLabOrders, fetchMyLabOrders]);

    return (
        <LabContext.Provider value={{
            labOrders,
            myLabOrders,
            loading,
            error,
            fetchLabOrders,
            fetchMyLabOrders,
            createLabOrder,
            updateOrderStatus,
            submitResult,
            uploadFile,
            refreshOrders,
        }}>
            {children}
        </LabContext.Provider>
    );
};

export const useLab = (): LabContextType => {
    const context = useContext(LabContext);
    if (!context) {
        throw new Error('useLab must be used within a LabProvider');
    }
    return context;
};
