import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestTube, CheckCircle, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLab } from "@/contexts/LabContext";

const LabSampleCollection = () => {
    const { labOrders: rawOrders, loading, updateOrderStatus } = useLab();
    const [collectedOrders, setCollectedOrders] = useState<string[]>([]);
    const [printedLabels, setPrintedLabels] = useState<string[]>([]);

    const labOrders = rawOrders.map(order => ({
        id: order.id,
        order_id: `LAB-${order.id.slice(0, 4).toUpperCase()}`,
        patient_name: `${order.patient.firstName} ${order.patient.lastName}`,
        doctor_name: `${order.orderedBy.firstName} ${order.orderedBy.lastName}`,
        tests: [{
            test_id: order.testCode || 'N/A',
            test_name: order.testName,
        }],
        status: order.status,
        bill: order.bill
    }));

    // Filter for relevant statuses that need sample collection
    const pendingSamples = labOrders.filter(order =>
        (order.status === 'ORDERED' || order.status === 'READY_FOR_SAMPLE_COLLECTION' || order.status === 'PAYMENT_PENDING') &&
        !collectedOrders.includes(order.id)
    );

    const handleCollectAllSamples = async (order: any) => {
        try {
            await updateOrderStatus(order.id, 'SAMPLE_COLLECTED');
            setCollectedOrders([...collectedOrders, order.id]);
            toast.success("Samples Collected", {
                description: `All samples for Order #${order.order_id} have been collected`,
            });
        } catch (error) {
            toast.error("Failed to collect samples");
        }
    };

    const handlePrintLabel = (testId: string, testName: string) => {
        setPrintedLabels([...printedLabels, testId]);

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Lab Label - ${testName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .label { border: 2px solid #333; padding: 15px; width: 300px; }
                        .test-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                        .info { font-size: 12px; margin: 5px 0; }
                        .barcode { font-family: monospace; font-size: 16px; letter-spacing: 2px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <div class="test-name">${testName}</div>
                        <div class="info">Sample ID: SMP-${Date.now().toString().slice(-6)}</div>
                        <div class="info">Date: ${new Date().toLocaleDateString()}</div>
                        <div class="info">Time: ${new Date().toLocaleTimeString()}</div>
                        <div class="barcode">||||| ${testId} |||||</div>
                    </div>
                    <script>window.onload = function() { window.print(); }</script>
                </body>
                </html>
            `);
            printWindow.document.close();
        }

        toast.success("Label Printed", {
            description: `Label for ${testName} has been sent to printer`,
        });
    };

    if (loading) {
        return (
            <DashboardLayout role="lab_technician">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="lab_technician">
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Sample Collection</h1>
                    <p className="text-muted-foreground">Manage sample collection for pending lab orders</p>
                </div>

                <div className="grid gap-6">
                    {pendingSamples.map((order) => (
                        <Card key={order.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TestTube className="h-5 w-5 text-blue-600" />
                                            Order #{order.order_id}
                                            {order.bill?.status === 'PAID' && (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    PAID
                                                </Badge>
                                            )}
                                            {order.status === 'PAYMENT_PENDING' && (
                                                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                                    Payment Pending
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{order.patient_name} • Dr. {order.doctor_name}</CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleCollectAllSamples(order)}
                                        disabled={order.status === 'PAYMENT_PENDING'}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {order.status === 'PAYMENT_PENDING' ? 'Awaiting Payment' : 'Collect All Samples'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Test Name</TableHead>
                                            <TableHead>Sample Type</TableHead>
                                            <TableHead>Container</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.tests.map((test) => (
                                            <TableRow key={test.test_id}>
                                                <TableCell className="font-medium">{test.test_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">Blood / Serum</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">Red Top Tube</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {printedLabels.includes(test.test_id) ? (
                                                        <Button variant="ghost" size="sm" disabled className="text-green-600">
                                                            <CheckCircle className="h-3 w-3 mr-1" /> Printed
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={() => handlePrintLabel(test.test_id, test.test_name)}
                                                        >
                                                            <Printer className="h-4 w-4 mr-1" />
                                                            Print Label
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}

                    {pendingSamples.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="font-medium">All caught up!</p>
                            <p className="text-sm">No pending samples for collection.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabSampleCollection;
