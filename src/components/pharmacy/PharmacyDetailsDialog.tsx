import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pharmacyOrders } from "@/data/mockData";
import { Pill, Calendar, Receipt } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface PharmacyDetailsDialogProps {
    children?: React.ReactNode;
    orderId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function PharmacyDetailsDialog({
    children,
    orderId,
    open,
    onOpenChange
}: PharmacyDetailsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const order = pharmacyOrders.find(o => o.id === orderId) || pharmacyOrders[0];

    if (!order) return null;

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View Details</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Pharmacy Order</DialogTitle>
                    <DialogDescription>
                        Order ID: {order.order_id}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Date</span>
                            <div className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <div>
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            <span className="font-semibold text-sm">Medications</span>
                        </div>
                        <div className="divide-y">
                            {order.items.map((item, index) => (
                                <div key={index} className="p-3 flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{item.medicine_name}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-medium">
                                        ₹{item.total_price.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                            <span className="font-bold text-lg">Total Amount</span>
                            <span className="font-bold text-xl text-blue-600">₹{order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    {order.dispensed_by && (
                        <div className="text-xs text-muted-foreground text-right">
                            Dispensed by: {order.dispensed_by}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
