import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, RotateCcw, Download, Eye, CreditCard } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CreateLabOrderDialog } from "@/components/medical/CreateLabOrderDialog";
import { useLab, LabOrder } from "@/contexts/LabContext";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ReceptionLabResults() {
    // Receptionists view ALL lab orders, not just "my" orders
    const { labOrders, loading, fetchLabOrders, updateOrderStatus } = useLab();
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleView = (order: LabOrder) => {
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const columns = [
        {
            key: "id",
            header: "Order ID",
            render: (order: LabOrder) => order.id.slice(0, 8).toUpperCase()
        },
        {
            key: "patient",
            header: "Patient",
            render: (order: LabOrder) => `${order.patient.firstName} ${order.patient.lastName}`
        },
        { key: "testName", header: "Test" },
        {
            key: "priority",
            header: "Priority",
            render: (order: LabOrder) => (
                <Badge variant={order.priority === 'urgent' ? 'destructive' : order.priority === 'stat' ? 'destructive' : 'secondary'}>
                    {order.priority.toUpperCase()}
                </Badge>
            )
        },
        {
            key: "status",
            header: "Status",
            render: (order: LabOrder) => <StatusBadge status={order.status === 'READY_FOR_SAMPLE_COLLECTION' ? 'paid' : order.status.toLowerCase() as any} />
        },
        {
            key: "createdAt",
            header: "Ordered",
            render: (order: LabOrder) => new Date(order.createdAt).toLocaleDateString()
        },
        {
            key: "actions",
            header: "Actions",
            render: (order: LabOrder) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleView(order)}>
                        <Eye className="h-4 w-4 text-slate-500" />
                    </Button>
                    {order.status.toLowerCase() === 'payment_pending' && (
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                            onClick={async () => {
                                try {
                                    await updateOrderStatus(order.id, 'READY_FOR_SAMPLE_COLLECTION');
                                    toast.success("Payment confirmed. Order is ready for sample collection.");
                                } catch (error) {
                                    toast.error("Failed to confirm payment");
                                }
                            }}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Confirm Payment
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <DashboardLayout role="receptionist">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FlaskConical className="h-6 w-6" />
                            Lab Results
                        </h1>
                        <p className="text-muted-foreground">View and manage patient lab results</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => fetchLabOrders()}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <CreateLabOrderDialog />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Lab Orders</CardTitle>
                        <CardDescription>Comprehensive list of all lab tests and results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <DataTable
                                data={labOrders.filter(o => ['payment_pending', 'ready_for_sample_collection'].includes(o.status.toLowerCase()))}
                                columns={columns}
                                emptyMessage="No pending or ready lab orders."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Lab Order Details</DialogTitle>
                        <DialogDescription>
                            Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Patient</p>
                                    <p className="font-medium">{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Test</p>
                                    <p className="font-medium">{selectedOrder.testName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <StatusBadge status={selectedOrder.status.toLowerCase() as any} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Priority</p>
                                    <Badge variant={selectedOrder.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                        {selectedOrder.priority.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p>{selectedOrder.notes}</p>
                                </div>
                            )}

                            {selectedOrder.result && (
                                <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <h4 className="font-semibold text-green-700 dark:text-green-400">Test Results</h4>

                                    {selectedOrder.result.result.parameters.length > 0 && (
                                        <div className="grid gap-2">
                                            {selectedOrder.result.result.parameters.map((param, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded border">
                                                    <span className="font-medium">{param.name}</span>
                                                    <span>
                                                        {param.value} {param.unit && <span className="text-muted-foreground">{param.unit}</span>}
                                                        {param.normalRange && (
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                (Normal: {param.normalRange})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedOrder.result.interpretation && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Interpretation</p>
                                            <p>{selectedOrder.result.interpretation}</p>
                                        </div>
                                    )}

                                    {selectedOrder.result.attachments && selectedOrder.result.attachments.length > 0 && (
                                        <div className="flex gap-2 pt-2">
                                            {selectedOrder.result.attachments.map((url, idx) => (
                                                <Button key={idx} variant="outline" size="sm" asChild>
                                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download Report
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
