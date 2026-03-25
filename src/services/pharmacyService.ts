import { api } from '@/services/api';
import { Medicine, PharmacyOrder } from '@/types';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export const pharmacyService = {
    async getMedicines(params?: any): Promise<Medicine[]> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });
        }
        const endpoint = `/pharmacy/medicines${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        // Skip cache for search queries
        if (!params || Object.keys(params).length === 0) {
            const cacheKey = getCacheKey('/pharmacy/medicines');
            const cached = apiCache.get<Medicine[]>(cacheKey);
            if (cached) return cached;
        }

        const response: any = await api.get(endpoint);
        const result = Array.isArray(response) ? response : (response.items || response.data || []);
        
        if (!params || Object.keys(params).length === 0) {
            const cacheKey = getCacheKey('/pharmacy/medicines');
            apiCache.set(cacheKey, result, CACHE_TTL.MEDICINES);
        }
        return result;
    },

    async createMedicine(medicine: {
        name: string;
        genericName?: string;
        manufacturer?: string;
        categoryId?: number;
        unit?: string;
        distributorName: string;
        batchNumber: string;
        manufacturingDate?: string;
        expiryDate: string;
        purchasePrice: number;
        salePrice: number;
        mrp?: number;
        gst?: number;
        stockQuantity: number;
        reorderLevel: number;
        invoiceNumber?: string;
        amountPaid?: number;
        paymentDate?: string;
        paymentMethod?: string;
    }): Promise<Medicine> {
        // Invalidate cache after creation
        apiCache.invalidate('/pharmacy/medicines');
        const response: any = await api.post('/pharmacy/medicines', medicine);
        return response;
    },

    async getPurchases(params?: any): Promise<any> {
        return api.get('/pharmacy/purchases', { params });
    },

    async getDistributorReport(): Promise<any> {
        return api.get('/pharmacy/distributor-report');
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

    async getDispensedHistory(params?: { startDate?: string; endDate?: string }): Promise<any[]> {
        const response: any = await api.get('/pharmacy/dispensed-history', { params });
        return Array.isArray(response) ? response : (response.items || response.data || []);
    },

    async getPharmacyStats(): Promise<any> {
        return api.get('/pharmacy/stats');
    },

    async deleteBill(id: string): Promise<any> {
        apiCache.invalidate('/pharmacy/bills');
        return api.delete(`/pharmacy/bills/${id}`);
    },

    async processReturn(data: any) {
        return api.post('/pharmacy/returns', data);
    },

    async getReturns(params: any) {
        return api.get('/pharmacy/returns', { params });
    },

    async processStockReturn(data: any) {
        return api.post('/pharmacy/stock-returns', data);
    },

    async getStockReturns(params: any) {
        return api.get('/pharmacy/stock-returns', { params });
    },
    
    async getMarginReport(params: { startDate?: string; endDate?: string }): Promise<any> {
        return api.get('/pharmacy/margin-reports', { params });
    },

    async createPurchase(data: any, file?: File): Promise<any> {
        const formData = new FormData();
        formData.append('distributorName', data.distributorName);
        formData.append('invoiceNumber', data.invoiceNumber);
        if (data.purchaseDate) formData.append('purchaseDate', data.purchaseDate);
        formData.append('items', JSON.stringify(data.items));
        if (file) formData.append('invoice', file);
        return api.post('/pharmacy/purchases', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    async updatePurchase(id: string, data: any, file?: File): Promise<any> {
        const formData = new FormData();
        if (data.distributorName) formData.append('distributorName', data.distributorName);
        if (data.invoiceNumber) formData.append('invoiceNumber', data.invoiceNumber);
        if (data.purchaseDate) formData.append('purchaseDate', data.purchaseDate);
        if (file) formData.append('invoice', file);
        return api.put(`/pharmacy/purchases/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    async deletePurchase(id: string): Promise<any> {
        return api.delete(`/pharmacy/purchases/${id}`);
    },

    async recordPayment(purchaseId: string, data: any): Promise<any> {
        return api.post(`/pharmacy/purchases/${purchaseId}/payments`, data);
    },

    async getPurchasePayments(purchaseId: string): Promise<any> {
        return api.get(`/pharmacy/purchases/${purchaseId}/payments`);
    },
    
    async getCategories(): Promise<any[]> {
        const response: any = await api.get('/pharmacy/categories');
        return Array.isArray(response) ? response : (response.data || response.items || []);
    },

    async createCategory(name: string): Promise<any> {
        return api.post('/pharmacy/categories', { name });
    },

    async deleteCategory(id: string): Promise<any> {
        return api.delete(`/pharmacy/categories/${id}`);
    }
};
