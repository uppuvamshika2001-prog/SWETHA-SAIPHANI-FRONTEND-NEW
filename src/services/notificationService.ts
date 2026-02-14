import { api } from '@/services/api';
import { Notification } from '@/types';

export const notificationService = {
    async getNotifications(): Promise<Notification[]> {
        try {
            const response = await api.get<any>('/notifications');
            // Normalize response if needed, assuming standard array or { items: [] }
            const items = Array.isArray(response) ? response : (response.items || response.data || []);
            return items;
        } catch (error: any) {
            // If the endpoint is missing (404), return empty list to prevent UI breakage
            if (error.status === 404 || (error.message && error.message.includes('not found'))) {
                return [];
            }
            throw error;
        }
    },

    async getUnreadCount(): Promise<number> {
        try {
            const response = await api.get<{ count: number }>('/notifications/unread-count');
            return response.count;
        } catch (error: any) {
            if (error.status === 404 || (error.message && error.message.includes('not found'))) {
                return 0;
            }
            throw error;
        }
    },

    async markAsRead(id: string): Promise<void> {
        await api.patch<{ success: boolean }>(`/notifications/${id}/read`, {});
    },

    async markAllAsRead(): Promise<void> {
        await api.patch<{ success: boolean }>('/notifications/read-all', {});
    },

    // Helper for deleting if needed
    async deleteNotification(id: string): Promise<void> {
        await api.delete(`/notifications/${id}`);
    }
};
