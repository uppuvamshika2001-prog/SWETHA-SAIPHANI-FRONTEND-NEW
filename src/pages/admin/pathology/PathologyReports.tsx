import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, FlaskConical, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { labService } from "@/services/labService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatsCardSkeleton } from "@/components/ui/skeleton";

export default function PathologyReports() {
    const [stats, setStats] = useState<any>({
        total: 0,
        completed: 0,
        pending: 0,
        revenue: 0,
        dailyData: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const orders = await labService.getLabOrders();

                const total = orders.length;
                const completed = orders.filter(o => o.status === 'completed').length;
                const pending = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

                // Mock revenue calculation (assuming avg 500 per test if bill not present)
                // In real app, sum up `o.bill?.totalAmount` or similar
                const revenue = orders.reduce((sum, o: any) => {
                    return sum + (o.bill?.grandTotal || o.bill?.total || (o.status === 'completed' ? 500 : 0));
                }, 0);

                // Prepare chart data (Last 7 days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const dailyData = last7Days.map(date => {
                    const dayOrders = orders.filter(o => o.ordered_at.startsWith(date));
                    return {
                        date: new Date(date).toLocaleDateString('en-US', { disableCheckBox: true, weekday: 'short' } as any),
                        tests: dayOrders.length,
                        completed: dayOrders.filter(o => o.status === 'completed').length
                    };
                });

                setStats({ total, completed, pending, revenue, dailyData });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                        <StatsCardSkeleton />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6" />
                        Pathology Reports
                    </h1>
                    <p className="text-muted-foreground">Detailed analytics for pathology department</p>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <span className="text-muted-foreground font-bold">₹</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">+180 new tests</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed}</div>
                            <p className="text-xs text-muted-foreground">Rate: {((stats.completed / (stats.total || 1)) * 100).toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">Requires attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Test Volume (Last 7 Days)</CardTitle>
                            <CardDescription>Daily breakdown of ordered vs completed tests</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="tests" name="Total Ordered" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
