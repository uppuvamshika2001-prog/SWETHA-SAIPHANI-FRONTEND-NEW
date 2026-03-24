import React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { AlertCircle, Clock } from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    const titleLower = notification.title.toLowerCase();
    const isOneMonth = titleLower.includes('expire soon') || titleLower.includes('1 month');
    const isThreeMonth = titleLower.includes('3 month') || titleLower.includes('expiring in');

    // Default styles
    let borderColor = 'border-l-4 border-l-blue-500';
    let icon = <div className={cn("h-2 w-2 rounded-full flex-shrink-0 bg-blue-500")} />;

    if (notification.type === 'error' || isOneMonth) {
        borderColor = 'border-l-4 border-l-red-500';
        icon = <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    } else if (notification.type === 'warning' || isThreeMonth) {
        borderColor = 'border-l-4 border-l-yellow-500';
        icon = <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    } else if (notification.type === 'success') {
        borderColor = 'border-l-4 border-l-green-500';
        icon = <div className={cn("h-2 w-2 rounded-full flex-shrink-0 bg-green-500")} />;
    }

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <DropdownMenuItem
            className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer outline-none transition-colors mb-1",
                borderColor,
                !notification.read ? "bg-muted/50" : "bg-transparent",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 w-full">
                {icon}
                <span className={cn("font-medium text-sm leading-none", !notification.read && "font-semibold")}>
                    {notification.title}
                </span>
                {notification.read && <span className="ml-auto text-[10px] text-muted-foreground">Read</span>}
            </div>
            <p className="text-xs text-muted-foreground ml-6 mt-1 line-clamp-2">{notification.message}</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-6 mt-2">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo(notification.createdAt)}</span>
            </div>
        </DropdownMenuItem>
    );
}
