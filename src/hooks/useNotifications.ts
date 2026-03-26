import { useState, useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types';
import { toast } from 'sonner';

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const seenIds = useRef<Set<string>>(new Set());
    const initialFetchDone = useRef(false);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);

            // Detect new notifications and trigger toasts
            if (initialFetchDone.current) {
                data.forEach(notification => {
                    if (!seenIds.current.has(notification.id) && !notification.read) {
                        // Priority styling toast based on notification content/type
                        let icon = '🔔';
                        if (notification.type === 'error' || notification.title.toLowerCase().includes('expire soon') || notification.title.toLowerCase().includes('1 month')) icon = '🔴';
                        else if (notification.type === 'warning' || notification.title.toLowerCase().includes('3 month')) icon = '🟡';

                        toast(notification.title, {
                            description: notification.message,
                            icon: icon,
                        });
                    }
                    seenIds.current.add(notification.id);
                });
            } else {
                // Populate seenIds on first fetch
                data.forEach(n => seenIds.current.add(n.id));
                initialFetchDone.current = true;
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead
    };
}
