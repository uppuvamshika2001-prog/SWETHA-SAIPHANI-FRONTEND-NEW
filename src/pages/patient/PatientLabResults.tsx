import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addWatermark, drawClinicHeader, drawClinicFooter, getTransparentTableStyles, getBase64ImageFromUrl } from "@/utils/pdfUtils";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useCallback } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { patientService } from "@/services/patientService";

const PatientLabResults = () => {
    const [myLabOrders, setMyLabOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const { toast } = useToast();

    // Fetch lab results - memoized for reuse
    const fetchData = useCallback(async (showLoading = true, date?: Date) => {
        try {
            if (showLoading) setLoading(true);
            setIsRefreshing(true);

            const profile = await patientService.getMyProfile();

            let startDate: string | undefined;
            let endDate: string | undefined;

            if (date) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                startDate = start.toISOString();
                endDate = end.toISOString();
            }

            const rawData = await patientService.getPatientLabResults(profile.uhid, startDate, endDate);

            // Map backend data to frontend structure
            const mappedData = rawData.map(order => ({
                id: order.id,
                order_id: `LAB-${order.id.slice(0, 4).toUpperCase()}`,
                patient_id: order.patientId,
                patient_name: profile.full_name,
                ordered_at: order.createdAt,
                status: (order.status === 'READY_FOR_SAMPLE_COLLECTION' ? 'Ready for Collection' : (order.status === 'IN_PROGRESS' ? 'processing' : order.status.toLowerCase())),
                tests: [{
                    test_id: order.testCode || 'N/A',
                    test_name: order.testName,
                    status: order.status.toLowerCase(),
                    result: order.result?.result?.parameters?.map((p: any) => `${p.name}: ${p.value} ${p.unit || ''}`).join(', ') || '',
                    normal_range: order.result?.result?.parameters?.map((p: any) => p.normalRange || '-').join(', ') || '-'
                }]
            }));

            setMyLabOrders(mappedData);
        } catch (error) {
            console.error("Failed to fetch lab results:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Manual refresh handler
    const handleRefresh = () => {
        fetchData(false, selectedDate);
        toast({
            title: "Refreshing",
            description: "Fetching lab results for selected date...",
        });
    };

    // Initial fetch on mount or when date changes
    useEffect(() => {
        fetchData(true, selectedDate);
    }, [fetchData, selectedDate]);

    // Auto-refresh on page visibility (when user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchData(false, selectedDate);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [fetchData, selectedDate]);

    // Polling every 30 seconds for near real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchData(false, selectedDate);
            }
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [fetchData, selectedDate]);

    if (loading) {
        return <div className="p-8 text-center">Loading lab results...</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'ordered': return 'bg-blue-100 text-blue-800';
            case 'ready for collection': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-indigo-100 text-indigo-800';
            case 'payment_pending': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDownloadLabReport = async (order: any) => {
        const doc = new jsPDF();

        // 1. Add Background Template
        try {
            const headerUrl = '/templete%20new.jpeg';
            const headerBase64 = await getBase64ImageFromUrl(headerUrl);
            doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
        } catch (error) {
            console.error("Failed to load background template", error);
            await addWatermark(doc);
        }

        // 2. Order Info (Positioned below header area)
        const yPosStart = 60;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        doc.text(`Order ID: ${order.order_id}`, 14, yPosStart);
        doc.text(`Date: ${new Date(order.ordered_at).toLocaleDateString()}`, 14, yPosStart + 5);
        doc.text(`Patient: ${order.patient_name}`, 14, yPosStart + 10);
        doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 14, yPosStart + 15);

        // 3. Test Results Table
        autoTable(doc, {
            ...getTransparentTableStyles(),
            startY: yPosStart + 25,
            head: [['Test Name', 'Result', 'Normal Range', 'Status']],
            body: order.tests.map((test: any) => [
                test.test_name,
                test.result || 'Pending',
                test.normal_range || '-',
                test.status.charAt(0).toUpperCase() + test.status.slice(1)
            ]),
            styles: { fontSize: 9, cellPadding: 3 },
            didParseCell: (data) => {
                if (data.column.index === 3 && data.section === 'body') {
                    const status = data.cell.raw as string;
                    if (status.toLowerCase().includes('completed')) {
                        data.cell.styles.textColor = [34, 139, 34];
                    } else if (status.toLowerCase().includes('pending')) {
                        data.cell.styles.textColor = [255, 165, 0];
                    }
                }
            }
        });

        // Save PDF
        const fileName = `Lab_Report_${order.order_id}_${new Date(order.ordered_at).toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        toast({
            title: "Download Complete",
            description: `Lab Report ${order.order_id} has been downloaded successfully.`,
        });
    };

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Lab Results</h1>
                    <div className="flex items-center gap-4">
                        <DatePicker
                            date={selectedDate}
                            setDate={setSelectedDate}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {myLabOrders.map(order => (
                    <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Order #{order.order_id}
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(order.ordered_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {new Date(order.ordered_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={getStatusColor(order.status)}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => handleDownloadLabReport(order)}
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead>Normal Range</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.tests.map((test) => (
                                        <TableRow key={test.test_id}>
                                            <TableCell className="font-medium">{test.test_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(test.status)}>
                                                    {test.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold">{test.result || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{test.normal_range || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}

                {myLabOrders.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No lab records found.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PatientLabResults;

