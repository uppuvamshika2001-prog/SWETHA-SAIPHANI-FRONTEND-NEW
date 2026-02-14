import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, FileText, Loader2, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { billingService, Bill } from "@/services/billingService";
import { toast } from "sonner";
import { printInvoice } from "@/utils/printInvoice";

interface BillDetailsDialogProps {
    children?: React.ReactNode;
    billId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function BillDetailsDialog({
    children,
    billId,
    open,
    onOpenChange
}: BillDetailsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showOpen && billId) {
            fetchBillDetails();
        }
    }, [showOpen, billId]);

    const fetchBillDetails = async () => {
        setLoading(true);
        try {
            const data = await billingService.getBillById(billId);
            setBill(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load bill details");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View Bill</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Invoice Details</DialogTitle>
                    <DialogDescription>
                        Invoice #: {bill?.billNumber || "..."}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : bill ? (
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Date</span>
                                <div className="font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(bill.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Status</span>
                                <div>
                                    <StatusBadge status={bill.status.toLowerCase() as any} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Patient</span>
                                <div className="font-medium">
                                    {bill.patient.firstName} {bill.patient.lastName}
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="font-semibold text-sm">Bill Items</span>
                            </div>
                            <div className="divide-y max-h-[200px] overflow-y-auto">
                                {bill.items.map((item, index) => (
                                    <div key={index} className="p-3 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium">{item.description}</p>
                                        </div>
                                        <div className="font-medium">
                                            ₹{item.total}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-muted/50 p-4 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{bill.subtotal}</span>
                                </div>
                                {bill.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{bill.discount}</span>
                                    </div>
                                )}
                                {bill.gstAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>GST (18%)</span>
                                        <span>₹{bill.gstAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span>Total</span>
                                    <span>₹{bill.grandTotal}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center text-muted-foreground">
                        Bill not found
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t mt-2">
                    <Button variant="outline" onClick={() => setShowOpen(false)}>Close</Button>
                    {bill && (
                        <Button onClick={() => printInvoice(bill)}>
                            <Printer className="h-4 w-4 mr-2" /> Print
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
