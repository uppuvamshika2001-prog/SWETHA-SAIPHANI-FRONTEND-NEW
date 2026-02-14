import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Eye, Download, Printer } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { labService } from "@/services/labService";
import { LabResultDetailsDialog } from "@/components/lab/LabResultDetailsDialog";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";

export default function PathologyResults() {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await labService.getLabOrders();
                setResults(data);
            } catch (error) {
                console.error("Failed to fetch lab orders:", error);
            } finally {
                setLoading(false);
            }
        };
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
