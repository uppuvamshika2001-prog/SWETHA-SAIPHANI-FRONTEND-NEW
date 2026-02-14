import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Users, Activity } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function OPDReports() {
    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        OPD Reports
                    </h1>
                    <p className="text-muted-foreground">Analytics and statistics for OPD</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Daily Footfall"
                        value={145}
                        icon={<Users className="h-5 w-5" />}
                        trend={{ value: 12, isPositive: true }}
                        description="Patients visited today"
                    />
                    <StatsCard
                        title="Consultations"
                        value={128}
                        icon={<Activity className="h-5 w-5" />}
                        description="Successful consultations"
                    />
                    <StatsCard
                        title="Revenue"
                        value="₹45,200"
                        icon={<TrendingUp className="h-5 w-5" />}
                        trend={{ value: 8, isPositive: true }}
                        description="Total OPD revenue today"
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Department Wise Visits</CardTitle>
                            <CardDescription>Patient distribution across departments</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                            Chart Placeholder
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Peak Hours Analysis</CardTitle>
                            <CardDescription>Busiest times during the day</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                            Chart Placeholder
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
