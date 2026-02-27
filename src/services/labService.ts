import { api } from '@/services/api';
import { LabOrder, LabTest } from '@/types';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

export const labService = {
    async getLabOrders(params?: { patientId?: string; status?: string; startDate?: string; endDate?: string }): Promise<LabOrder[]> {
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
            priority: order.priority.toLowerCase() as any,
            status: order.status.toLowerCase() as any,
            ordered_at: order.createdAt,
            completed_at: order.result?.completedAt,
            notes: order.notes,
            bill: order.bill,
            tests: [{
                test_id: order.id, // Using order ID as test ID for now since it's 1:1
                test_name: order.testName,
                result: order.result?.result?.parameters?.map((p: any) => `${p.name}: ${p.value} ${p.unit || ''}`).join(', '),
                status: order.status.toLowerCase() as any
            }]
        }));

        return result;
    },

    async getLabTests(): Promise<LabTest[]> {
        return await api.get<LabTest[]>('/lab/tests');
    },

    async createTest(test: Omit<LabTest, 'id'>): Promise<LabTest> {
        return await api.post<LabTest>('/lab/tests', test);
    },

    async updateTest(id: string, test: Partial<LabTest>): Promise<LabTest> {
        return await api.put<LabTest>(`/lab/tests/${id}`, test);
    },

    async deleteTest(id: string): Promise<void> {
        await api.delete(`/lab/tests/${id}`);
    },

    async updateOrderStatus(id: string, status: string): Promise<any> {
        apiCache.invalidate('/lab');
        return api.patch(`/lab/orders/${id}/status`, { status });
    },

    async deleteLabResult(resultId: string): Promise<void> {
        await api.delete(`/lab/results/${resultId}`);
        apiCache.invalidate('/lab');
    }
};

