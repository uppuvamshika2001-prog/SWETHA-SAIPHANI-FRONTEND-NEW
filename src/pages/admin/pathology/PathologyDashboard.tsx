import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Clock, CheckCircle, AlertTriangle, ClipboardList, FileText, Activity, ArrowRight, Loader2 } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { labService } from "@/services/labService";
import { LabOrder } from "@/types";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { format } from "date-fns";
import { StatsCardSkeleton } from "@/components/ui/skeleton";

export default function PathologyDashboard() {
    const navigate = useNavigate();
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const orders = await labService.getLabOrders();
                setLabOrders(orders || []);
            } catch (error) {
                console.error("Failed to fetch lab orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate stats
    const pendingCount = labOrders.filter(o => o.status === 'ordered' || o.status === 'sample_collected').length;

    const completedToday = labOrders.filter(o => {
        if (o.status !== 'completed' || !o.completed_at) return false;
        return new Date(o.completed_at).toDateString() === new Date().toDateString();
    }).length;
    const urgentCount = labOrders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length;

    const modules = [
        {
            title: 'Test Requests',
            description: 'Manage incoming lab orders',
            icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
            path: '/admin/pathology/requests',
            color: 'bg-blue-100',
        },
        {
            title: 'Test Results',
            description: 'View completed reports',
            icon: <FileText className="h-6 w-6 text-green-600" />,
            path: '/admin/pathology/results',
            color: 'bg-green-100',
        },
        {
            title: 'Reports',
            description: 'Lab analytics & stats',
            icon: <Activity className="h-6 w-6 text-purple-600" />,
            path: '/admin/pathology/reports',
            color: 'bg-purple-100',
        },
    ];

    const recentOrdersColumns = [
        { key: "order_id", header: "Order ID" },
        { key: "patient_name", header: "Patient" },
        { key: "tests", header: "Test", render: (o: LabOrder) => o.tests?.[0]?.test_name || 'N/A' },
        { key: "priority", header: "Priority", render: (o: LabOrder) => <StatusBadge status={o.priority} /> },
        { key: "status", header: "Status", render: (o: LabOrder) => <StatusBadge status={o.status} /> },
        { key: "ordered_at", header: "Date", render: (o: LabOrder) => format(new Date(o.ordered_at), 'dd MMM yyyy') },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FlaskConical className="h-6 w-6" />
                        Pathology Dashboard
                    </h1>
                    <p className="text-muted-foreground">Overview of laboratory operations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <>
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                        </>
                    ) : (
                        <>
                            <StatsCard
                                title="Pending Tests"
                                value={pendingCount}
                                icon={<Clock className="h-5 w-5" />}
                                description="Awaiting processing"
                                variant="warning"
                                onClick={() => navigate('/admin/pathology/requests?status=pending')}
                            />

                            <StatsCard
                                title="Completed Today"
                                value={completedToday}
                                icon={<CheckCircle className="h-5 w-5" />}
                                description="Tests finished today"
                                variant="success"
                                onClick={() => navigate('/admin/pathology/results?date=today')}
                            />
                            <StatsCard
                                title="Urgent"
                                value={urgentCount}
                                icon={<AlertTriangle className="h-5 w-5" />}
                                description="High priority pending"
                                variant="destructive"
                                onClick={() => navigate('/admin/pathology/requests?priority=urgent')}
                            />
                        </>
                    )}
                </div>

                {/* Module Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary" onClick={() => navigate(module.path)}>
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`p-3 rounded-lg ${module.color}`}>
                                    {module.icon}
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{module.title}</CardTitle>
                                    <CardDescription>{module.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="ghost" className="w-full justify-between group">
                                    Access Module
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Lab Orders</CardTitle>
                            <CardDescription>Latest test requests from doctors</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/admin/pathology/requests')}>
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={labOrders.slice(0, 5)}
                            columns={recentOrdersColumns}
                            emptyMessage="No lab orders found"
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

