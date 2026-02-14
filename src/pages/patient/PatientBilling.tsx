import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Calendar, CreditCard, Download } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useEffect, useState } from "react";
import { patientService } from "@/services/patientService";
import {
    addWatermark,
    addHeaderLogo,
    generatePdfFilename,
    maskData,
    getTransparentTableStyles,
    getBase64ImageFromUrl
} from "@/utils/pdfUtils";

const PatientBilling = () => {
    const [myBills, setMyBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await patientService.getMyProfile();
                const data = await patientService.getPatientBills(profile.uhid); // Changed to uhid
                setMyBills(data || []);
            } catch (error) {
                console.error("Failed to fetch bills:", error);
                toast({
                    title: "Error",
                    description: "Failed to load billing history",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading billing history...</div>;
    }

    const handleDownloadInvoice = async (bill: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Generate filename & Check Masking Status
        const patientName = bill.patient
            ? `${bill.patient.firstName} ${bill.patient.lastName}`
            : (bill.patient_name || 'Patient');

        const billId = bill.id || bill.bill_id || bill.billNumber || 'unknown_id';
        const billNum = bill.billNumber || bill.bill_id || 'N/A';

        const { filename, isMasked } = generatePdfFilename(patientName, billNum, billId);

        // 2. Add Background Template
        try {
            if (!isMasked) {
                const headerUrl = '/header_template.jpg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            }
        } catch (error) {
            console.error("Failed to load background template", error);
            // Fallback to watermark if template fails
            await addWatermark(doc);
        }

        // 3. Title (Positioned below the header template area)
        const startY = 60;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(isMasked ? "INVOICE (Masked Copy)" : "INVOICE", 14, startY);

        // 4. Invoice Details
        const displayPatientName = isMasked ? maskData(patientName, 'name') : patientName;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Invoice #: ${billNum}`, 14, startY + 8);
        doc.text(`Date: ${new Date(bill.createdAt || bill.created_at || Date.now()).toLocaleDateString()}`, 14, startY + 13);
        doc.text(`Patient: ${displayPatientName}`, 14, startY + 18);
        doc.text(`Status: ${bill.status || 'N/A'}`, 14, startY + 23);

        let currentY = startY + 28;
        if (bill.medicalRecord?.diagnosis) {
            doc.text(`Diagnosis: ${bill.medicalRecord.diagnosis}`, 14, currentY);
            currentY += 5;
        }

        // 5. Items Table
        const items = bill.items || [];
        const tableData = items.map((item: any, index: number) => [
            index + 1,
            item.description,
            (item.category || 'General').charAt(0).toUpperCase() + (item.category || 'General').slice(1),
            item.quantity || 1,
            `Rs. ${Number(item.unitPrice || 0).toFixed(2)}`,
            `Rs. ${Number(item.total || 0).toFixed(2)}`
        ]);

        autoTable(doc, {
            ...getTransparentTableStyles(),
            startY: currentY + 5,
            head: [['#', 'Description', 'Category', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 80 },
                4: { cellWidth: 30, halign: 'right' },
                5: { cellWidth: 30, halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const labelX = pageWidth - 80;
        const valueX = pageWidth - 20;

        doc.setFont("helvetica", "normal");
        doc.text("Subtotal:", labelX, finalY, { align: "right" });
        doc.text(`Rs. ${Number(bill.subtotal || 0).toFixed(2)}`, valueX, finalY, { align: "right" });

        if (Number(bill.discount) > 0) {
            doc.text("Discount:", labelX, finalY + 7, { align: "right" });
            doc.text(`- Rs. ${Number(bill.discount).toFixed(2)}`, valueX, finalY + 7, { align: "right" });
            // Adjust finalY logic for dynamic rows... simplified here for fixed structure
        }

        // Simplified Total section matching UnifiedBilling roughly
        const totalAmount = Number(bill.grandTotal || bill.total || 0);

        doc.setFont("helvetica", "bold");
        // Check if discount existed to push y down
        const totalY = Number(bill.discount) > 0 ? finalY + 14 : finalY + 7;

        doc.text("Total Amount:", labelX, totalY, { align: "right" });
        doc.text(`Rs. ${totalAmount.toFixed(2)}`, valueX, totalY, { align: "right" });

        // Payment Info
        if (bill.status === 'PAID') {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const paymentInfo = `Paid via ${bill.payment_method || 'Unknown'} on ${new Date(bill.updatedAt || new Date()).toLocaleDateString()}`;
            doc.text(paymentInfo, pageWidth - 14, totalY + 10, { align: "right" });
        }

        // Footer is handled by the background template
        doc.save(filename);

        toast({
            title: isMasked ? "Masked Invoice Downloaded" : "Download Complete",
            description: "Invoice downloaded successfully.",
        });
    };

    const getStatusColor = (status: string) => {
        // Handle undefined status safely
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Billing & Payments</h1>

                <div className="grid gap-6">
                    {myBills.map((bill) => (
                        <Card key={bill.id} className="overflow-hidden shadow-sm">
                            <CardHeader className="bg-muted/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Receipt className="h-5 w-5 text-blue-600" />
                                            Invoice #{bill.billNumber || bill.bill_id}
                                        </CardTitle>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(bill.createdAt || bill.created_at).toLocaleDateString()}
                                            </span>
                                            {/* bill type is not standard, remove or fix logic */}
                                            {/* <Badge variant="secondary" className="uppercase text-xs">{bill.type || 'General'}</Badge> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(bill.status)}>
                                            {(bill.status || 'Unknown').toUpperCase()}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => handleDownloadInvoice(bill)}
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
                                            <TableHead className="w-[50%]">Description</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(bill.items || []).map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.description}</TableCell>
                                                <TableCell className="capitalize text-muted-foreground">{item.category || 'General'}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                                            <TableCell colSpan={2} className="text-right font-medium">Subtotal</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(bill.subtotal)}</TableCell>
                                        </TableRow>
                                        {Number(bill.discount) > 0 && (
                                            <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                <TableCell colSpan={2} className="text-right font-medium text-green-600">Discount</TableCell>
                                                <TableCell className="text-right font-medium text-green-600">-{formatCurrency(bill.discount)}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableCell colSpan={2} className="text-right font-bold text-lg">Total</TableCell>
                                            {/* Fix NaN issue by using grandTotal */}
                                            <TableCell className="text-right font-bold text-lg">{formatCurrency(bill.grandTotal || bill.total)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                {bill.status === 'PAID' && (
                                    <div className="bg-green-50/50 p-3 text-xs text-green-700 flex items-center justify-end gap-2 px-6 border-t">
                                        <CreditCard className="h-3 w-3" />
                                        Paid via {bill.payment_method || 'Unknown'} on {new Date(bill.updatedAt || new Date()).toLocaleDateString()}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {myBills.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <p>No billing records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientBilling;
