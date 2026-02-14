import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType =
  | 'active' | 'inactive' | 'suspended' | 'on_leave'
  | 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  | 'pending' | 'paid' | 'partial'
  | 'ordered' | 'sample_collected' | 'processing' | 'payment_pending' | 'ready_for_sample_collection'
  | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired'
  | 'available' | 'occupied' | 'maintenance' | 'reserved'
  | 'routine' | 'urgent' | 'stat'
  | 'dispensed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // General statuses
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-muted' },
  suspended: { label: 'Suspended', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  on_leave: { label: 'On Leave', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },

  // Appointment statuses
  scheduled: { label: 'Scheduled', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  checked_in: { label: 'Checked In', className: 'bg-primary/20 text-primary border-primary/30' },
  in_progress: { label: 'In Progress', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  completed: { label: 'Completed', className: 'bg-success/20 text-success border-success/30' },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border-muted' },
  no_show: { label: 'No Show', className: 'bg-destructive/20 text-destructive border-destructive/30' },

  // Billing statuses
  pending: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  paid: { label: 'Paid', className: 'bg-success/20 text-success border-success/30' },
  partial: { label: 'Partial', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },

  // Lab statuses
  ordered: { label: 'Ordered', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  ready_for_sample_collection: { label: 'Ready for Collection', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  payment_pending: { label: 'Payment Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  sample_collected: { label: 'Sample Collected', className: 'bg-primary/20 text-primary border-primary/30' },
  processing: { label: 'Processing', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },

  // Inventory statuses
  in_stock: { label: 'In Stock', className: 'bg-success/20 text-success border-success/30' },
  low_stock: { label: 'Low Stock', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  expired: { label: 'Expired', className: 'bg-destructive/20 text-destructive border-destructive/30' },

  // Bed statuses
  available: { label: 'Available', className: 'bg-success/20 text-success border-success/30' },
  occupied: { label: 'Occupied', className: 'bg-primary/20 text-primary border-primary/30' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  reserved: { label: 'Reserved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },

  // Priority
  routine: { label: 'Routine', className: 'bg-muted text-muted-foreground border-muted' },
  urgent: { label: 'Urgent', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  stat: { label: 'STAT', className: 'bg-destructive/20 text-destructive border-destructive/30' },

  // Pharmacy
  dispensed: { label: 'Dispensed', className: 'bg-success/20 text-success border-success/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = (status || '').toLowerCase() as StatusType;
  const config = statusConfig[normalizedStatus] || { label: status, className: 'bg-muted text-muted-foreground border-muted' };

  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
