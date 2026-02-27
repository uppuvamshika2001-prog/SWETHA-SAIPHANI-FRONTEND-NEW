import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Download, Printer, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { labService } from "@/services/labService";
import { LabResultDetailsDialog } from "@/components/lab/LabResultDetailsDialog";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";
import { useToast } from "@/components/ui/use-toast";

export default function PathologyResults() {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await labService.getLabOrders();
            setResults(data);
        } catch (error) {
            console.error("Failed to fetch lab orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleViewDetails = (order: any) => {
        // Map data to match LabOrder type expected by dialog if needed, 
        // or ensure LabResultDetailsDialog handles the service response format.
        // The service returns data that mostly matches.
        // We might need to map it carefully.
        // check LabResultDetailsDialog props.
        setSelectedOrder(order);
        setDetailsOpen(true);
    };

    const handleDownload = (order: any) => {
        // Use the utility
        downloadLabReportPDF(order);
    };

    const handleDeleteResult = async (order: any) => {
        if (!order.tests || order.tests.length === 0) return;
        const testId = order.tests[0].test_id; // Using the first test's ID since we mapped order ID to test ID

        if (window.confirm("Are you sure you want to delete this test result? This action cannot be undone.")) {
            try {
                // To delete the result, we need the actual result ID rather than the order ID.
                // However, the test ID we map on the frontend is the order ID. 
                // But wait, the backend endpoint `deleteResult(id)` expects the Result ID.
                // Assuming we can pass the order ID to another endpoint to get the result ID, or we need to fix it.
                // Let's check how deleteLabResult works: it takes resultId.
                // Since the labService getLabOrders doesn't expose result.id, we might need an order update or rely on a new parameter.

                // For now, assume test_id holds the right ID or we fetch it.
                // Actually the API mapped test_id = order.id. So we need to delete by Result ID.
                // Wait, if we don't have Result ID, we can't easily call DELETE /results/:id
                // Let me rewrite the delete action to pass the order ID to a new deleteByOrderId endpoint, OR I can fetch the order first.
                // Let me fetch the order by ID, get the result ID, then delete it.
                const fullOrder = await labService.getLabOrders({ patientId: order.patient_id }).then(res => res.find(o => o.id === order.id));
                const resultId = fullOrder && fullOrder.id ? (fullOrder as any).result?.id : null;
                // Wait, labService.getLabOrders maps the data and hides result.id. 
                // Alternatively, I can just use order.test_id if backend was changed to find by orderId, OR I could use the test_id = order.id.
                // Let's use the order ID and delete the result by fetching the order details via API directly here.

                const response = await fetch(`/api/lab/orders/${order.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const orderData = await response.json();

                if (orderData.data && orderData.data.result && orderData.data.result.id) {
                    await labService.deleteLabResult(orderData.data.result.id);
                    toast({
                        title: "Result Deleted",
                        description: "The pathology test result has been successfully deleted.",
                    });
                    fetchData();
                } else {
                    toast({
                        title: "Delete Failed",
                        description: "Could not find the associated result.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error("Failed to delete result:", error);
                toast({
                    title: "Delete Failed",
                    description: "An error occurred while deleting the result.",
                    variant: "destructive"
                });
            }
        }
    };

    const dateFilter = searchParams.get('date');

    const filteredResults = results.filter(o => {
        if (o.status !== 'completed') return false;

        if (dateFilter === 'today') {
            if (!o.completed_at) return false;
            return new Date(o.completed_at).toDateString() === new Date().toDateString();
        }

        return true;
    });

    const columns: any[] = [
        { key: "order_id", header: "Order ID", render: (o: any) => <span className="font-mono text-xs">{o.order_id}</span> },
        {
            key: "patient_name",
            header: "Patient",
            render: (o: any) => (
                <div>
                    <div className="font-medium">{o.patient_name}</div>
                    <div className="text-xs text-muted-foreground">ID: {o.patient_id}</div>
                </div>
            )
        },
        { key: "test_name", header: "Test" }, // Added Test Name
        { key: "status", header: "Status", render: (o: any) => <StatusBadge status={o.status} /> },
        { key: "completed_at", header: "Completed Date", render: (o: any) => o.completed_at ? new Date(o.completed_at).toLocaleDateString() : '-' },
        {
            key: "actions",
            header: "Actions",
            render: (o: any) => (
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleViewDetails(o)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleDownload(o)}>
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteResult(o)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        {dateFilter === 'today' ? "Today's Results" : "Test Results"}
                    </h1>
                    <p className="text-muted-foreground">Completed pathology reports</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Result Archive</CardTitle>
                        <CardDescription>
                            {dateFilter === 'today' ? "Reports finalized today" : "History of generated pathology reports"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredResults}
                            columns={columns}
                            emptyMessage="No completed results found"
                            loading={loading}
                        />
                    </CardContent>
                </Card>

                {/* Details Dialog */}
                {selectedOrder && (
                    <LabResultDetailsDialog
                        open={detailsOpen}
                        onOpenChange={setDetailsOpen}
                        order={selectedOrder}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
