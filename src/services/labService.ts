import { api } from '@/services/api';
import { LabOrder, LabTest } from '@/types';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export const labService = {
    async getLabOrders(params?: { patientId?: string; status?: string }): Promise<LabOrder[]> {
        const queryString = new URLSearchParams(params as any).toString();
        const cacheKey = getCacheKey(`/lab/orders?${queryString}`);
        // Short cache or no cache for fresh data

        const response = await api.get<{ items: any[] }>(`/lab/orders?${queryString}`);
        const result = response.items.map(order => ({
            id: order.id,
            order_id: `LAB-${order.id.slice(0, 4).toUpperCase()}`,
            patient_id: order.patientId,
            patient_name: `${order.patient.firstName} ${order.patient.lastName}`,
            doctor_id: order.orderedById,
            doctor_name: `Dr. ${order.orderedBy.firstName} ${order.orderedBy.lastName}`,
            test_id: order.testCode || 'N/A',
            test_name: order.testName,
            result: order.result?.result?.parameters?.map((p: any) => `${p.name}: ${p.value} ${p.unit || ''}`).join(', '),
            priority: order.priority.toLowerCase() as any,
            status: order.status, // Raw status to match backend enum
            ordered_at: order.createdAt,
            completed_at: order.result?.completedAt,
            notes: order.notes,
            bill: order.bill
        }));

        return result;
    },

    async getLabTests(): Promise<LabTest[]> {
        return [];
    },

    async updateOrderStatus(id: string, status: string): Promise<any> {
        apiCache.invalidate('/lab');
        return api.patch(`/lab/orders/${id}/status`, { status });
    }
};

