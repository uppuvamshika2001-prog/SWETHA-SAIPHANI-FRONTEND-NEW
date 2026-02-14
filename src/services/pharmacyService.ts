import { api } from '@/services/api';
import { Medicine, PharmacyOrder } from '@/types';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export const pharmacyService = {
    async getMedicines(): Promise<Medicine[]> {
        const cacheKey = getCacheKey('/pharmacy/medicines');
        const cached = apiCache.get<Medicine[]>(cacheKey);
        if (cached) return cached;

        const response: any = await api.get('/pharmacy/medicines');
        const result = Array.isArray(response) ? response : (response.items || response.data || []);
        apiCache.set(cacheKey, result, CACHE_TTL.MEDICINES);
        return result;
    },

    async createMedicine(medicine: {
        name: string;
        genericName?: string;
        manufacturer?: string;
        category?: string;
        pricePerUnit: number;
        stockQuantity?: number;
        reorderLevel?: number;
        expiryDate?: string;
        batchNumber?: string;
        gst?: number;
    }): Promise<Medicine> {
        // Invalidate cache after creation
        apiCache.invalidate('/pharmacy/medicines');
        const response: any = await api.post('/pharmacy/medicines', medicine);
        return response;
    },

    async deleteMedicine(id: string): Promise<any> {
        apiCache.invalidate('/pharmacy/medicines');
        return api.delete(`/pharmacy/medicines/${id}`);
    },

    async getBills(): Promise<PharmacyOrder[]> {
        const cacheKey = getCacheKey('/pharmacy/bills');
        const cached = apiCache.get<PharmacyOrder[]>(cacheKey);
        if (cached) return cached;

        const response: any = await api.get('/pharmacy/bills');
        const result = Array.isArray(response) ? response : (response.items || response.data || []);
        apiCache.set(cacheKey, result, CACHE_TTL.BILLS);
        return result;
    },

    async getMedicalRecordById(id: string): Promise<any> {
        return api.get<any>(`/medical-records/${id}`);
    },

    async searchMedicalRecords(query: string): Promise<any[]> {
        return api.get<any[]>(`/medical-records?search=${encodeURIComponent(query)}`);
    },

    async dispenseMedicalRecord(id: string): Promise<any> {
        // Invalidate pharmacy caches after dispensing
        apiCache.invalidate('/pharmacy');
        return api.put<any>(`/medical-records/${id}/dispense`, {});
    },

    async getPendingPrescriptions(): Promise<any[]> {
        const response: any = await api.get('/pharmacy/pending');
        return Array.isArray(response) ? response : (response.items || response.data || []);
    },

    async deleteBill(id: string): Promise<any> {
        apiCache.invalidate('/pharmacy/bills');
        return api.delete(`/pharmacy/bills/${id}`);
    }
};

