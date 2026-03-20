import { createContext, useContext, useState, useCallback, useEffect, ReactNode, FC } from 'react';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

// Types
export interface LabOrder {
    id: string;
    patientId: string;
    orderedById: string;
    orderedByRole?: string | null;
    doctorId?: string | null;
    testName: string;
    testCode: string | null;
    priority: string;
    status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_PENDING' | 'READY_FOR_SAMPLE_COLLECTION';
    notes: string | null;
    patient: { firstName: string; lastName: string };
    orderedBy: { firstName: string; lastName: string };
    doctor?: { firstName: string; lastName: string } | null;
    bill?: {
        status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
        id: string;
    } | null;
    result?: LabResult | null;
    isWalkInLab: boolean;
    visitId: string | null;
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
    testId?: string;
    doctorId?: string;
    priority?: 'normal' | 'urgent' | 'stat';
    notes?: string;
    isWalkInLab?: boolean;
    visitId?: string;
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
    isReportVisibleToPatient?: boolean;
}

interface LabContextType {
    // State
    labOrders: LabOrder[];
    myLabOrders: LabOrder[];
    loading: boolean;
    error: string | null;

    // Actions
    fetchLabOrders: (status?: string, date?: Date) => Promise<void>;
    fetchMyLabOrders: (date?: Date) => Promise<void>;
    createLabOrder: (input: CreateLabOrderInput) => Promise<LabOrder>;
    updateOrderStatus: (orderId: string, status: string) => Promise<LabOrder>;
    confirmPayment: (orderId: string) => Promise<LabOrder>;
    deleteLabOrder: (orderId: string) => Promise<void>;
    submitResult: (input: CreateLabResultInput) => Promise<LabResult>;
    uploadFile: (file: File) => Promise<{ url: string; filename: string }>;
    refreshOrders: () => Promise<void>;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [myLabOrders, setMyLabOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetchedOrders, setHasFetchedOrders] = useState(false);
    const [hasFetchedMyOrders, setHasFetchedMyOrders] = useState(false);

    // Fetch all lab orders (for lab technicians)
    const fetchLabOrders = useCallback(async (status?: string, date?: Date) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (status) params.append('status', status);

            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                params.append('startDate', start.toISOString());
                params.append('endDate', end.toISOString());
            }

            const response = await api.get<{ items: LabOrder[] }>(`/lab/orders?${params}`);
            console.log("Lab Orders API Response:", response);
            // Result is now either inside .data.items (via api.get wrapper) or direct
            const items = (response as any).items || response;
            setLabOrders(Array.isArray(items) ? items : []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch lab orders');
            console.error('[LabContext] fetchLabOrders error:', err);
        } finally {
            setLoading(false);
            setHasFetchedOrders(true);
        }
    }, []);

    // Fetch doctor's own orders
    const fetchMyLabOrders = useCallback(async (date?: Date) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '50' });
            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                params.append('startDate', start.toISOString());
                params.append('endDate', end.toISOString());
            }

            const response = await api.get<{ items: LabOrder[] }>(`/lab/orders/my-orders?${params}`);
            const items = (response as any).items || response;
            setMyLabOrders(Array.isArray(items) ? items : []);
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
        if (user?.role === 'doctor' || user?.role === 'admin') {
            fetchMyLabOrders();
        }
        return order;
    }, [fetchLabOrders, fetchMyLabOrders, user]);

    // Update order status
    const updateOrderStatus = useCallback(async (orderId: string, status: string): Promise<LabOrder> => {
        const order = await api.patch<LabOrder>(`/lab/orders/${orderId}/status`, { status });
        // Refresh lists
        fetchLabOrders();
        return order;
    }, [fetchLabOrders]);

    // Confirm lab payment
    const confirmPayment = useCallback(async (orderId: string): Promise<LabOrder> => {
        const order = await api.confirmLabPayment(orderId);
        // Refresh lists
        fetchLabOrders();
        return order;
    }, [fetchLabOrders]);

    // Delete a lab order
    const deleteLabOrder = useCallback(async (orderId: string): Promise<void> => {
        await api.delete(`/lab/orders/${orderId}`);
        // Refresh lists
        fetchLabOrders();
        if (user?.role === 'doctor' || user?.role === 'admin') {
            fetchMyLabOrders();
        }
    }, [fetchLabOrders, fetchMyLabOrders, user]);

    // Submit lab result
    const submitResult = useCallback(async (input: CreateLabResultInput): Promise<LabResult> => {
        const result = await api.post<LabResult>('/lab/results', input);
        // Refresh lists
        fetchLabOrders();
        if (user?.role === 'doctor' || user?.role === 'admin') {
            fetchMyLabOrders();
        }
        return result;
    }, [fetchLabOrders, fetchMyLabOrders, user]);

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
        const promises: Promise<void>[] = [fetchLabOrders()];
        if (user?.role === 'doctor' || user?.role === 'admin') {
            promises.push(fetchMyLabOrders());
        }
        await Promise.all(promises);
    }, [fetchLabOrders, fetchMyLabOrders, user]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

    // Auto-refresh every 5 seconds for live data on pending tests & dashboard
    useEffect(() => {
        if (!user || authLoading) return;
        if (user.role === 'lab_technician' || user.role === 'admin' || user.role === 'receptionist') {
            const interval = setInterval(() => {
                fetchLabOrders();
            }, 5000); // 5 seconds
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]);

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
            confirmPayment,
            deleteLabOrder,
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
