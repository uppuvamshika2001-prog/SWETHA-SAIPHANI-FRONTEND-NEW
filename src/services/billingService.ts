import { api } from './api';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export interface BillItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit_price?: number;
    total: number;
    discount?: number;
    gst?: number;
    discountAmount?: number;
    discount_amount?: number;
    gstAmount?: number;
    gst_amount?: number;
    gstPercent?: number;
    gst_percent?: number;
    totalAmount?: number;
    total_amount?: number;
    medicineId?: string;
    medicine_id?: string;
    batchNumber?: string;
    batch_number?: string;
    expiryDate?: string;
    expiry_date?: string;
    hsnCode?: string;
    hsn_code?: string;
}

export interface Bill {
    id: string;
    billNumber: string;
    bill_number?: string;
    patientId?: string | null;
    patient_id?: string | null;
    isWalkIn?: boolean;
    is_walk_in?: boolean;
    customerName?: string | null;
    customer_name?: string | null;
    phone?: string | null;
    patient?: {
        firstName: string;
        first_name?: string;
        lastName: string;
        last_name?: string;
        phone?: string;
    } | null;
    items: BillItem[];
    subtotal: number;
    discount: number;
    gstAmount: number;
    gst_amount?: number;
    gstPercent?: number;
    gst_percent?: number;
    paidAmount?: number;
    paid_amount?: number;
    notes?: string;
    grandTotal: number;
    grand_total?: number;
    status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
    createdAt: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
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
        isWalkInLab?: boolean;
    }) {
        const result = await api.post<Bill>('/billing', data);
        apiCache.invalidate('/billing');
        return result;
    },

    async updateStatus(id: string, status: string, paidAmount?: number) {
        const result = await api.patch<Bill>(`/billing/${id}/status`, { status, paidAmount });
        apiCache.invalidate('/billing');
        return result;
    },

    async confirmPayment(id: string, paidAmount: number) {
        const result = await api.patch<Bill>(`/billing/${id}/status`, { status: 'PAID', paidAmount });
        apiCache.invalidate('/billing');
        return result;
    },

    async deleteBill(id: string) {
        const result = await api.delete(`/billing/${id}`);
        apiCache.invalidate('/billing');
        return result;
    },

    async getUnbilledLabOrders(patientId: string) {
        return api.get<any[]>(`/billing/unbilled-lab-orders/${patientId}`);
    },

    async getPatientSummary(patientId: string) {
        return api.get<any>(`/billing/patient-summary/${patientId}`);
    }
};
