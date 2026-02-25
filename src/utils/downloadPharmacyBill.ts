import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "sonner";
import { Bill } from "@/services/billingService";
import {
    generatePdfFilename,
    maskData,
    getTransparentTableStyles,
    getBase64ImageFromUrl
} from "./pdfUtils";

export const downloadPharmacyBillPDF = async (bill: Bill) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Generate filename & Check Masking Status
        const patientName = bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}`.trim() : "Patient";
        const { filename, isMasked } = generatePdfFilename(patientName, bill.billNumber, bill.id, true);

        // 2. Layout Logic (Original vs Masked)

        // --- BACKGROUND TEMPLATE ---
        try {
            if (!isMasked) {
                const headerUrl = '/templete%20new.jpeg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            }
        } catch (error) {
            console.error("Failed to load background template", error);
        }

        // --- WATERMARK (Masked Only) ---
        if (isMasked) {
            doc.saveGraphicsState();
            doc.setTextColor(220, 220, 220); // Light Gray
            doc.setFontSize(60);
            doc.text("MASKED COPY", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
            doc.restoreGraphicsState();
        }

        // --- INVOICE DETAILS ---
        const startY = isMasked ? 30 : 80;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(isMasked ? 'PHARMACY INVOICE' : 'PHARMACY INVOICE', 14, startY);

        // Patient Details (Masked if needed)
        const displayPatientName = isMasked ? maskData(patientName, 'name') : patientName;
        const phone = bill.patient?.phone || "";
        const displayPhone = isMasked ? '******' + phone.slice(-4) : phone;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice #: ${bill.billNumber}`, 14, startY + 8);
        doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 14, startY + 13);
        doc.text(`Patient: ${displayPatientName}`, 14, startY + 18);
        doc.text(`Status: ${bill.status}`, 14, startY + 23);

        if (!isMasked) {
            doc.text(`Phone: ${displayPhone}`, 14, startY + 28);
        }

        // 7. Items Table
        const tableData = bill.items.map((item) => [
            item.description,
            item.quantity,
            `Rs. ${Number(item.unitPrice).toFixed(2)}`,
            // Mocking GST logic if not available in item, assuming simple case or pre-calculated
            // The item structure in Bill interface has 'total' but might miss individual tax breakdown if not stored
            // We'll calculate roughly or use what's available. 
            // In PharmacyBilling.tsx, GST% is stored. Let's start with basic fields.
            // For now, let's keep it consistent with what PharmacyBilling was doing:
            // It was using local state. History items might be simpler.
            // Let's assume item structure from Bill interface: id, description, quantity, unitPrice, total.
            // We might lack GST% per item in the Bill interface from billingService.ts. 
            // If so, we'll omit GST column or show simplified view.
            // Actually, PharmacyBilling sends: description, quantity, unitPrice (total/qty).
            // So we might not have GST% stored per item in backend unless we update schema.
            // Let's stick to valid properties of BillItem:
            // "unitPrice", "quantity", "total". 
            // We will omit GST column for history items to be safe, or just calculate if total > unit*qty.
            `${Number(item.total).toFixed(2)}`
        ]);

        const tableStyles = getTransparentTableStyles();

        // --- ITEMS TABLE ---
        // If details printed at startY + 28, then table should start below that
        const tableY = startY + 40;

        autoTable(doc, {
            startY: tableY,
            head: [['Medicine', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            ...tableStyles
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const labelX = pageWidth - 80;
        const valueX = pageWidth - 20;

        doc.text("Taxable Amount:", labelX, finalY, { align: "right" });
        doc.text(`Rs. ${(bill.grandTotal - (bill.gstAmount || 0)).toFixed(2)}`, valueX, finalY, { align: "right" });

        doc.text("Total GST:", labelX, finalY + 7, { align: "right" });
        doc.text(`Rs. ${Number(bill.gstAmount || 0).toFixed(2)}`, valueX, finalY + 7, { align: "right" });

        doc.setFont('helvetica', 'bold');
        doc.text("Grand Total:", labelX, finalY + 14, { align: "right" });
        doc.text(`Rs. ${Number(bill.grandTotal).toFixed(2)}`, valueX, finalY + 14, { align: "right" });

        // Footer is handled by background image if not masked

        doc.save(filename);
        toast.success("Bill downloaded successfully");

    } catch (error) {
        console.error("PDF Generation failed", error);
        toast.error("Failed to generate bill PDF");
    }
};
