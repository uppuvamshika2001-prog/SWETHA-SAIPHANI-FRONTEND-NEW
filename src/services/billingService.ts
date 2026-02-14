import { api } from './api';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export interface BillItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    medicineId?: string;
}

export interface Bill {
    id: string;
    billNumber: string;
    patientId: string;
    patient: {
        firstName: string;
        lastName: string;
        phone?: string;
    };
    items: BillItem[];
    subtotal: number;
    discount: number;
    gstAmount: number;
    gstPercent?: number;
    paidAmount?: number;
    notes?: string;
    grandTotal: number;
    status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
    createdAt: string;
    medicalRecord?: {
        diagnosis: string;
        treatment?: string;
        notes?: string;
    };
}

export const billingService = {
    async getBills(params?: any) {
        const queryString = new URLSearchParams(params).toString();
        const cacheKey = getCacheKey('/billing', params);
        const cached = apiCache.get<{ items: Bill[]; total: number }>(cacheKey);
        if (cached) return cached;

        const result = await api.get<{ items: Bill[]; total: number }>(`/billing?${queryString}`);
        apiCache.set(cacheKey, result, CACHE_TTL.BILLS);
        return result;
    },

    async getBillById(id: string) {
        return api.get<Bill>(`/billing/${id}`);
    },

    async createBill(data: {
        patientId: string;
        items: any[];
        discount?: number;
        notes?: string;
        status?: string;
        gstPercent?: number;
        paidAmount?: number;
    }) {
        return api.post<Bill>('/billing', data);
    },

    async updateStatus(id: string, status: string, paidAmount?: number) {
        return api.patch<Bill>(`/billing/${id}/status`, { status, paidAmount });
    },

    async confirmPayment(id: string, paidAmount: number) {
        return api.patch<Bill>(`/billing/${id}/status`, { status: 'PAID', paidAmount });
    },

    async deleteBill(id: string) {
        return api.delete(`/billing/${id}`);
    }
};
