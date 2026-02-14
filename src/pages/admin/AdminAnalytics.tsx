import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { billingService, Bill } from "@/services/billingService";
import { patientService } from "@/services/patientService";
import { labService } from "@/services/labService";
import { pharmacyService } from "@/services/pharmacyService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { formatCurrency } from "@/utils/format";
import { IndianRupee, TrendingUp, Activity, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { StatsCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [avgDailyRevenue, setAvgDailyRevenue] = useState(0);
    const [totalPatients, setTotalPatients] = useState(0);
    const [revenueByDepartment, setRevenueByDepartment] = useState<{ name: string; value: number; color: string }[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<{ name: string; value: number }[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<{ name: string; opd: number; pharmacy: number; lab: number }[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all data sources in parallel
                const [billsResponse, patientsResponse, labOrders, pharmacyBills, medicalRecords] = await Promise.all([
                    billingService.getBills(),
                    patientService.getPatients(),
                    labService.getLabOrders().catch(() => []),
                    pharmacyService.getBills().catch(() => []),
                    medicalRecordService.getRecords().catch(() => [])
                ]);

                const bills: Bill[] = billsResponse?.items || [];
                const patients = patientsResponse?.items || [];

                // Calculate Total Revenue
                const total = bills.reduce((acc, bill) => acc + (bill.grandTotal || 0), 0);
                setTotalRevenue(total);
                setTotalPatients(patients.length);

                // Calculate Revenue by Department (estimate based on bill items)
                let opdRevenue = 0;
                let pharmacyRevenue = 0;
                let labRevenue = 0;
                let otherRevenue = 0;

                bills.forEach(bill => {
                    (bill.items || []).forEach(item => {
                        const desc = item.description?.toLowerCase() || '';
                        if (desc.includes('consultation') || desc.includes('opd')) {
                            opdRevenue += item.total || 0;
                        } else if (desc.includes('medicine') || desc.includes('tablet') || desc.includes('syrup') || item.medicineId) {
                            pharmacyRevenue += item.total || 0;
                        } else if (desc.includes('test') || desc.includes('lab') || desc.includes('blood') || desc.includes('urine')) {
                            labRevenue += item.total || 0;
                        } else {
                            otherRevenue += item.total || 0;
                        }
                    });
                });

                // Add pharmacy bills revenue
                const pharmTotal = (pharmacyBills || []).reduce((acc: number, b: any) => acc + (b.total_amount || 0), 0);
                pharmacyRevenue += pharmTotal;

                setRevenueByDepartment([
                    { name: 'OPD / Consultation', value: opdRevenue || medicalRecords.length * 500, color: '#0ea5e9' },
                    { name: 'Pharmacy', value: pharmacyRevenue, color: '#22c55e' },
                    { name: 'Pathology / Lab', value: labRevenue || labOrders.length * 300, color: '#f59e0b' },
                    { name: 'Other', value: otherRevenue, color: '#64748b' },
                ].filter(d => d.value > 0));

                // Calculate Daily Revenue (last 7 days)
                const dailyData: { name: string; value: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const day = subDays(new Date(), i);
                    const dayStart = startOfDay(day);
                    const dayEnd = endOfDay(day);
                    const dayTotal = bills.filter(b => {
                        const billDate = new Date(b.createdAt);
                        return billDate >= dayStart && billDate <= dayEnd;
                    }).reduce((acc, b) => acc + (b.grandTotal || 0), 0);
                    dailyData.push({ name: format(day, 'EEE'), value: dayTotal });
                }
                setDailyRevenue(dailyData);

                // Calculate Average Daily Revenue
                const totalDailySum = dailyData.reduce((acc, d) => acc + d.value, 0);
                setAvgDailyRevenue(totalDailySum / 7);

                // Calculate Monthly Revenue (last 6 months - simplified aggregation)
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonth = new Date().getMonth();
                const monthlyData: { name: string; opd: number; pharmacy: number; lab: number }[] = [];

                for (let i = 5; i >= 0; i--) {
                    const monthIdx = (currentMonth - i + 12) % 12;
                    const monthName = months[monthIdx];
                    const monthBills = bills.filter(b => new Date(b.createdAt).getMonth() === monthIdx);

                    let opd = 0, pharm = 0, lab = 0;
                    monthBills.forEach(bill => {
                        (bill.items || []).forEach(item => {
                            const desc = item.description?.toLowerCase() || '';
                            if (desc.includes('consultation') || desc.includes('opd')) {
                                opd += item.total || 0;
                            } else if (item.medicineId || desc.includes('medicine')) {
                                pharm += item.total || 0;
                            } else if (desc.includes('test') || desc.includes('lab')) {
                                lab += item.total || 0;
                            }
                        });
                    });
                    monthlyData.push({ name: monthName, opd, pharmacy: pharm, lab });
                }
                setMonthlyRevenue(monthlyData);

            } catch (error) {
                console.error("Failed to load analytics data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of clinic revenue and performance metrics.
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        <>
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                                    <p className="text-xs text-muted-foreground">From all bills</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Avg. Daily Revenue</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{formatCurrency(avgDailyRevenue)}</div>
                                    <p className="text-xs text-muted-foreground">Last 7 days average</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalPatients.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Registered in system</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{dailyRevenue[dailyRevenue.length - 1]?.value > 0 ? 'Active' : 'Quiet'}</div>
                                    <p className="text-xs text-muted-foreground">Today: {formatCurrency(dailyRevenue[dailyRevenue.length - 1]?.value || 0)}</p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Revenue by Department (Pie Chart) */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Revenue by Department</CardTitle>
                            <CardDescription>Distribution of revenue sources</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {loading ? (
                                <ChartSkeleton height={100} /> // Pie chart skeleton
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={revenueByDepartment}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {revenueByDepartment.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Monthly Revenue Trend (Bar Chart) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Monthly Revenue Trend</CardTitle>
                            <CardDescription>Income stream over the last 6 months</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {loading ? (
                                <ChartSkeleton />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="opd" name="OPD" stackId="a" fill="#0ea5e9" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="pharmacy" name="Pharmacy" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="lab" name="Pathology" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Daily Revenue Trend (Line Chart) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly Revenue Overview</CardTitle>
                        <CardDescription>Daily revenue performance for the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? (
                            <ChartSkeleton />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminAnalytics;

