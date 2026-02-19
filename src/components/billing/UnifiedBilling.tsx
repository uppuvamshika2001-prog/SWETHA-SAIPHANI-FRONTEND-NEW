import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Plus, Download, CheckCircle, Loader2, IndianRupee, Printer, Trash2, Eye } from 'lucide-react';
import { BillGenerationDialog } from '@/components/billing/BillGenerationDialog';
import { BillDetailsDialog } from '@/components/billing/BillDetailsDialog';
import { billingService, Bill } from '@/services/billingService';
import { printInvoice } from '@/utils/printInvoice';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppRole } from '@/types';
import {
    addWatermark,
    generatePdfFilename,
    maskData,
    getTransparentTableStyles,
    getBase64ImageFromUrl
} from '@/utils/pdfUtils';

interface UnifiedBillingProps {
    portalRole: 'admin' | 'receptionist';
}

export function UnifiedBilling({ portalRole }: UnifiedBillingProps) {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);

    const { hasPermission } = usePermissions();

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const response = await billingService.getBills({ search });
            setBills(response.items || []);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            toast.error('Failed to load billing records');
            setBills([]);
        } finally {
            setLoading(false);
        }
    }, [search]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBills();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchBills]);

    const handleConfirmPayment = async (bill: Bill) => {
        if (!hasPermission('update_invoice_status')) {
            toast.error('You do not have permission to confirm payments');
            return;
        }

        setConfirmingBillId(bill.id);
        try {
            const updatedBill = await billingService.confirmPayment(bill.id, Number(bill.grandTotal));
            // Update row locally without full page reload
            setBills(prevBills =>
                prevBills.map(b => b.id === bill.id ? { ...b, status: updatedBill.status } : b)
            );
            toast.success(`Payment confirmed for ${bill.billNumber}`);
        } catch (error) {
            console.error('Failed to confirm payment:', error);
            toast.error('Failed to confirm payment. Please try again.');
        } finally {
            setConfirmingBillId(null);
        }
    };

    const handleDeleteBill = async (id: string) => {
        console.log('[UnifiedBilling] Attempting to delete bill with ID:', id);
        if (!id) {
            console.error('[UnifiedBilling] No ID provided for deletion');
            toast.error('Invalid ID for deletion');
            return;
        }
        try {
            await billingService.deleteBill(id);
            toast.success('Bill deleted successfully');
            fetchBills();
        } catch (error) {
            console.error('Failed to delete bill:', error);
            // toast.error is already handled by ApiService for majority of cases, but we can add more if needed
        }
    };

    const handleDownloadInvoice = async (bill: Bill) => {
        if (!hasPermission('download_invoice')) {
            toast.error('You do not have permission to download invoices');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Generate filename with masking logic
        // Generate filename with masking logic - pass true for isInvoice
        const patientName = `${bill.patient.firstName} ${bill.patient.lastName}`.trim();
        const { filename, isMasked } = generatePdfFilename(patientName, bill.billNumber, bill.id, true);

        try {
            // Add Full Page Background Template
            if (!isMasked) {
                const headerUrl = '/templete%20new.jpeg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            }
        } catch (error) {
            console.error("Failed to load background template", error);
        }

        if (isMasked) {
            // Masked Logic
            doc.saveGraphicsState();
            doc.setTextColor(220, 220, 220);
            doc.setFontSize(60);
            doc.text("MASKED COPY", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
            doc.restoreGraphicsState();
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text("INVOICE (MASKED)", pageWidth / 2, 20, { align: 'center' });
        } else {
            // Invoice Title (Manually added since we removed drawClinicHeader)
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0); // Black text
            doc.setFont('helvetica', 'bold');
            doc.text("INVOICE", pageWidth / 2, 73, { align: 'center' });
        }

        // --- INVOICE DETAILS ---
        const startY = 80; // Start below the header area

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Patient Details Block
        const col1X = 14;
        const col2X = pageWidth / 2 + 10;

        // Left Column: Patient
        doc.setFont('helvetica', 'bold');
        doc.text("Patient Details", col1X, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${isMasked ? maskData(patientName, 'name') : patientName}`, col1X, startY + 5);
        doc.text(`ID: ${bill.patientId}`, col1X, startY + 10);
        if (!isMasked) doc.text(`Phone: ${bill.patient.phone || 'N/A'}`, col1X, startY + 15);

        // Right Column: Invoice
        doc.setFont('helvetica', 'bold');
        doc.text("Invoice Details", col2X, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${bill.billNumber}`, col2X, startY + 5);
        doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, col2X, startY + 10);
        doc.text(`Status: ${bill.status}`, col2X, startY + 15);

        let currentY = startY + 25;
        if (bill.medicalRecord?.diagnosis) {
            doc.setFont('helvetica', 'bold');
            doc.text("Diagnosis:", col1X, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(bill.medicalRecord.diagnosis, col1X + 20, currentY);
            currentY += 8;
        }

        const tableData = bill.items.map((item) => [
            item.description,
            'General',
            item.quantity || 1,
            `Rs. ${Number(item.unitPrice).toFixed(2)}`,
            `Rs. ${Number(item.total).toFixed(2)}`
        ]);

        autoTable(doc, {
            ...getTransparentTableStyles(),
            startY: currentY,
            head: [['Description', 'Category', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            columnStyles: {
                0: { cellWidth: 80 },
                3: { halign: 'right' },
                4: { halign: 'right' }
            },
            didDrawPage: (data) => {
                // Footer is handled by the background image
            }
        });

        // Totals Section
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const labelX = pageWidth - 60;
        const valueX = pageWidth - 14;

        currentY = finalY;

        doc.text('Subtotal:', labelX, currentY, { align: 'right' });
        doc.text(`Rs. ${Number(bill.subtotal).toFixed(2)}`, valueX, currentY, { align: 'right' });
        currentY += 5;

        if (bill.discount > 0) {
            doc.text('Discount:', labelX, currentY, { align: 'right' });
            doc.text(`Rs. ${Number(bill.discount).toFixed(2)}`, valueX, currentY, { align: 'right' });
            currentY += 5;
        }

        if (bill.gstAmount > 0) {
            doc.text('GST:', labelX, currentY, { align: 'right' });
            doc.text(`Rs. ${Number(bill.gstAmount).toFixed(2)}`, valueX, currentY, { align: 'right' });
            currentY += 5;
        }

        currentY += 3; // Add a bit of spacing before Grand Total

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Grand Total:', labelX, currentY + 5, { align: 'right' });
        doc.text(`Rs. ${Number(bill.grandTotal).toFixed(2)}`, valueX, currentY + 5, { align: 'right' });
        currentY += 11; // Move past Grand Total line

        // Paid Amount
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Paid Amount:', labelX, currentY, { align: 'right' });
        doc.text(`Rs. ${Number(bill.paidAmount || 0).toFixed(2)}`, valueX, currentY, { align: 'right' });

        doc.save(filename);

        toast.success(isMasked ? 'Masked invoice downloaded' : 'Invoice downloaded successfully');
    };

    const columns = [
        { key: 'billNumber', header: 'Bill ID' },
        {
            key: 'patient',
            header: 'Patient',
            render: (b: Bill) => <span>{b.patient.firstName} {b.patient.lastName}</span>
        },
        {
            key: 'grandTotal',
            header: 'Amount',
            render: (b: Bill) => (
                <span className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-0.5" />
                    {Number(b.grandTotal).toFixed(2)}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (b: Bill) => <StatusBadge status={b.status.toLowerCase() as any} />
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (bill: Bill) => (
                <div className="flex items-center justify-end gap-2">
                    {/* Confirm Payment - only for PENDING invoices if user has permission */}
                    {(bill.status === 'PENDING' || bill.status === 'PARTIALLY_PAID') && hasPermission('update_invoice_status') && (
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleConfirmPayment(bill)}
                            disabled={confirmingBillId === bill.id}
                        >
                            {confirmingBillId === bill.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            {confirmingBillId === bill.id ? 'Confirming...' : 'Confirm Payment'}
                        </Button>
                    )}

                    {/* Download Invoice */}
                    {hasPermission('download_invoice') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadInvoice(bill)}
                            title="Download Invoice"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Print Invoice */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => printInvoice(bill)}
                        title="Print Invoice"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>

                    {/* View Details */}
                    <BillDetailsDialog billId={bill.id}>
                        <Button variant="ghost" size="icon" title="View Bill">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </BillDetailsDialog>

                    {/* Delete Bill - Only for Admins */}
                    {portalRole === 'admin' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the bill and all associated payment records.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBill(bill.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )
        }
    ];

    return (
        <DashboardLayout role={portalRole}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Billing & Invoices
                        </h1>
                        <p className="text-muted-foreground">Manage invoices and payments</p>
                    </div>

                    {/* Generate Bill Button - only if user has permission */}
                    {hasPermission('create_invoice') && (
                        <BillGenerationDialog onSuccess={fetchBills}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Generate New Bill
                            </Button>
                        </BillGenerationDialog>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Invoices</CardTitle>
                                <CardDescription>Billing history and transactions</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search bills..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={bills}
                            columns={columns}
                            emptyMessage="No bills found"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
