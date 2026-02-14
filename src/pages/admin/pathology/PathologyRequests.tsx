import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, FlaskConical, CheckCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { labService } from "@/services/labService";
import { useToast } from "@/hooks/use-toast";

export default function PathologyRequests() {
    const [searchParams] = useSearchParams();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await labService.getLabOrders();
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch lab orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setUpdating(id);
        try {
            await labService.updateOrderStatus(id, newStatus);
            toast({
                title: "Status Updated",
                description: `Order status changed to ${newStatus.replace('_', ' ')}`,
                className: "bg-green-600 text-white"
            });
            // Refresh data
            const data = await labService.getLabOrders();
            setRequests(data);
        } catch (error) {
            console.error("Update failed", error);
            toast({
                title: "Update Failed",
                description: "Could not update order status.",
                variant: "destructive"
            });
        } finally {
            setUpdating(null);
        }
    };

    const statusFilter = searchParams.get('status');
    const priorityFilter = searchParams.get('priority');

    const filteredRequests = requests.filter(o => {
        // Base filter: Only show active orders (not cancelled)
        // If status filter is 'pending', show ordered, sample_collected, processing
        if (o.status === 'cancelled') return false;

        // If viewing COMPLETED results, use the Results page instead.
        // But if no filter, show everything except cancelled?
        // Let's stick to "Requests" meaning NOT completed.
        if (o.status === 'completed') return false;

        // Apply URL filters
        if (priorityFilter && o.priority !== priorityFilter) return false;

        // If status filter is 'pending', show ordered or sample_collected
        if (statusFilter === 'pending') {
            return o.status === 'ordered' || o.status === 'sample_collected';
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
        {
            key: "tests",
            header: "Tests",
            render: (o: any) => (
                <div className="flex flex-wrap gap-1">
                    {o.tests?.map((t: any) => (
                        <Badge key={t.test_id} variant="secondary" className="text-xs">
                            {t.test_name}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            key: "priority",
            header: "Priority",
            render: (o: any) => (
                <span className={`uppercase font-bold text-xs ${o.priority === 'urgent' ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                    {o.priority}
                </span>
            )
        },
        { key: "status", header: "Status", render: (o: any) => <StatusBadge status={o.status} /> },
        {
            key: "actions",
            header: "Actions",
            render: (o: any) => {
                const isUpdating = updating === o.id;

                if (o.status === 'ordered') {
                    return (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleStatusUpdate(o.id, 'sample_collected')}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3 mr-1" />}
                            Collect Sample
                        </Button>
                    );
                }
                if (o.status === 'sample_collected') {
                    return (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={() => handleStatusUpdate(o.id, 'processing')}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Loader2 className="h-3 w-3 mr-1" />}
                            Start Processing
                        </Button>
                    );
                }
                if (o.status === 'processing') {
                    return (
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(o.id, 'completed')}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                            Complete
                        </Button>
                    );
                }
                return <span className="text-xs text-muted-foreground">-</span>;
            }
        },
    ];

    const getTitle = () => {
        if (priorityFilter === 'urgent') return 'Urgent Requests';
        if (statusFilter === 'pending') return 'Pending Requests';
        return 'Test Requests';
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6" />
                        {getTitle()}
                    </h1>
                    <p className="text-muted-foreground">Manage incoming laboratory test orders</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredRequests.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-destructive">Urgent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {filteredRequests.filter(r => r.priority === 'urgent').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Incoming Orders</CardTitle>
                        <CardDescription>
                            Process orders by updating their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredRequests}
                            columns={columns}
                            emptyMessage="No pending requests found."
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
