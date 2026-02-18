import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Activity, Server, Users, Database, TrendingUp, Loader2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { billingService } from "@/services/billingService";
import { patientService } from "@/services/patientService";
import { labService } from "@/services/labService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

import {
    generatePatientReport,
    generateBillingReport,
    generateLabReport,
    generateConsultationReport,
    generateFullAnalyticsReport
} from "@/utils/reportGenerator";

export default function Reports() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [systemStats, setSystemStats] = useState({
        totalPatients: 0,
        totalBills: 0,
        totalLabOrders: 0,
        totalConsultations: 0,
        totalRevenue: 0,
    });

    const fetchSystemStats = async () => {
        setLoading(true);
        try {
            const queryParams: any = {};
            if (dateRange.from) queryParams.startDate = format(dateRange.from, 'yyyy-MM-dd');
            if (dateRange.to) queryParams.endDate = format(dateRange.to, 'yyyy-MM-dd');

            const [patientsRes, billsRes, labOrders, records] = await Promise.all([
                patientService.getPatients(queryParams),
                billingService.getBills(queryParams),
                labService.getLabOrders(queryParams).catch(() => []),
                medicalRecordService.getRecords(queryParams).catch(() => [])
            ]);

            const bills = billsRes?.items || [];
            const patients = patientsRes?.items || [];
            const totalRevenue = bills.reduce((acc: number, b: any) => acc + (b.grandTotal || 0), 0);

            setSystemStats({
                totalPatients: patients.length,
                totalBills: bills.length,
                totalLabOrders: labOrders.length,
                totalConsultations: records.length,
                totalRevenue,
            });
        } catch (error) {
            console.error("Failed to fetch system stats:", error);
            toast({
                title: "Error",
                description: "Failed to load report data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemStats();
    }, [dateRange]);

    const handleExportReport = async (reportId: string, reportName: string) => {
        setExporting(reportId);
        toast({
            title: "Export Started",
            description: `Generating ${reportName}...`,
        });

        try {
            const queryParams: any = {};
            if (dateRange.from) queryParams.startDate = format(dateRange.from, 'yyyy-MM-dd');
            if (dateRange.to) queryParams.endDate = format(dateRange.to, 'yyyy-MM-dd');

            switch (reportId) {
                case 'patient':
                    const patientsRes = await patientService.getPatients(queryParams);
                    await generatePatientReport(patientsRes.items || []);
                    break;
                case 'billing':
                    const billsRes = await billingService.getBills(queryParams);
                    await generateBillingReport(billsRes.items || []);
                    break;
                case 'lab':
                    const labOrders = await labService.getLabOrders(queryParams);
                    await generateLabReport(labOrders);
                    break;
                case 'consultation':
                    const records = await medicalRecordService.getRecords(queryParams);
                    await generateConsultationReport(records);
                    break;
                case 'full-analytics':
                    await generateFullAnalyticsReport(systemStats);
                    break;
                default:
                    console.warn("Unknown report type:", reportId);
            }
            toast({
                title: "Export Complete",
                description: `${reportName} has been downloaded.`,
                variant: "default",
                className: "bg-green-600 text-white"
            });
        } catch (error) {
            console.error("Export failed:", error);
            toast({
                title: "Export Failed",
                description: "Could not generate report. Please try again.",
                variant: "destructive"
            });
        } finally {
            setExporting(null);
        }
    };

    const systemReports = [
        { id: 'patient', name: 'Patient Registry Report', description: 'List of registered patients', icon: Users, count: systemStats.totalPatients },
        { id: 'billing', name: 'Billing Summary Report', description: 'Billing transactions and revenue', icon: TrendingUp, count: systemStats.totalBills },
        { id: 'lab', name: 'Lab Orders Report', description: 'Laboratory test orders', icon: Activity, count: systemStats.totalLabOrders },
        { id: 'consultation', name: 'Consultation Report', description: 'OPD consultations and diagnoses', icon: FileText, count: systemStats.totalConsultations },
    ];

    const analyticsReports = [
        { id: 'revenue', name: 'Revenue Analytics', value: formatCurrency(systemStats.totalRevenue), description: 'Total revenue for selected period' },
        { id: 'daily-avg', name: 'Daily Average', value: formatCurrency(dateRange.from && dateRange.to ? systemStats.totalRevenue / (Math.max(1, (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 3600 * 24) + 1)) : systemStats.totalRevenue / 30), description: 'Estimated daily average' },
        { id: 'generated', name: 'Report Generated', value: format(new Date(), 'dd MMM yyyy'), description: 'Current report date' },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Reports & Analytics
                        </h1>
                        <p className="text-muted-foreground">View system reports and analytics summaries</p>
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                        <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                        <div className="flex items-center gap-2">
                            <DatePicker
                                date={dateRange.from}
                                setDate={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                                placeholder="From Date"
                                className="w-[160px]"
                                formatStr="dd MMM yyyy"
                            />
                            <span className="text-muted-foreground">-</span>
                            <DatePicker
                                date={dateRange.to}
                                setDate={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                                placeholder="To Date"
                                className="w-[160px]"
                                formatStr="dd MMM yyyy"
                            />
                        </div>
                        {(dateRange.from || dateRange.to) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDateRange({})}
                                className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* System Reports */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    System Reports
                                </CardTitle>
                                <CardDescription>Download or export system-level reports {dateRange.from ? `from ${format(dateRange.from, 'dd MMM yyyy')}` : ''} {dateRange.to ? `to ${format(dateRange.to, 'dd MMM yyyy')}` : ''}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {systemReports.map((report) => (
                                        <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <report.icon className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{report.name}</div>
                                                    <div className="text-sm text-muted-foreground">{report.description}</div>
                                                    <div className="text-xs text-primary mt-1">{report.count} records</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExportReport(report.id, report.name)}
                                                disabled={exporting !== null}
                                            >
                                                {exporting === report.id ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4 mr-2" />
                                                )}
                                                Export
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Analytics Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Analytics Summary
                                </CardTitle>
                                <CardDescription>Key metrics for the selected period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {analyticsReports.map((metric) => (
                                        <div key={metric.id} className="p-4 border rounded-lg text-center">
                                            <div className="text-2xl font-bold text-primary">{metric.value}</div>
                                            <div className="font-medium mt-1">{metric.name}</div>
                                            <div className="text-sm text-muted-foreground">{metric.description}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button
                                        onClick={() => handleExportReport('full-analytics', 'Full Analytics Report')}
                                        disabled={exporting !== null}
                                    >
                                        {exporting === 'full-analytics' ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Export Full Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}

