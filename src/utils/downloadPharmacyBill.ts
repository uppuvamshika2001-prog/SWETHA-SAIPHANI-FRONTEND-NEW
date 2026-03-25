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
        const patientName = bill.isWalkIn 
            ? (bill.customerName || "Walk-in Customer") 
            : (bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}`.trim() : "Patient");
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
        const phone = bill.isWalkIn ? (bill.phone || "") : (bill.patient?.phone || "");
        const displayPhone = isMasked ? (phone ? '******' + phone.slice(-4) : "") : phone;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Left Column
        doc.text(`Invoice #: ${bill.billNumber}`, 14, startY + 8);
        doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`, 14, startY + 13);
        
        const patientIdStr = bill.patientId ? `(UHID: ${bill.patientId})` : '(Walk-in)';
        doc.text(`Patient: ${displayPatientName} ${patientIdStr}`, 14, startY + 18);

        let ageGenderYOffset = startY + 23;
        if (!bill.isWalkIn && bill.patient) {
            const ageGender = [];
            if ((bill.patient as any).dateOfBirth) {
                const age = new Date().getFullYear() - new Date((bill.patient as any).dateOfBirth).getFullYear();
                ageGender.push(`${age} Y`);
            } else if ((bill.patient as any).age) {
                ageGender.push(`${(bill.patient as any).age} Y`);
            }
            if ((bill.patient as any).gender) {
                ageGender.push((bill.patient as any).gender);
            }
            if (ageGender.length > 0) {
                doc.text(`Age/Gender: ${ageGender.join(' / ')}`, 14, ageGenderYOffset);
                ageGenderYOffset += 5;
            }
        }

        if (!isMasked && displayPhone) {
            doc.text(`Phone: ${displayPhone}`, 14, ageGenderYOffset);
        }

        // Right Column
        const rightColX = pageWidth - 60;
        doc.text(`Status: ${bill.status}`, rightColX, startY + 8);
        doc.text(`Mode: ${(bill as any).paymentMode || 'CASH'}`, rightColX, startY + 13);
        doc.text(`Billed By: ${(bill as any).createdBy || "Pharmacist"}`, rightColX, startY + 18);

        // 7. Items Table
        let computedTotalCGST = 0;
        let computedTotalSGST = 0;

        const tableData = bill.items.map((item: any) => {
            const baseAmount = item.quantity * item.unitPrice;
            const discountAmount = item.discount ? (baseAmount * (Number(item.discount) / 100)) : 0;
            const taxableAmount = baseAmount - discountAmount;
            const gstAmount = item.gst ? (taxableAmount * (Number(item.gst) / 100)) : 0;
            
            const cgst = gstAmount / 2;
            const sgst = gstAmount / 2;
            
            computedTotalCGST += cgst;
            computedTotalSGST += sgst;

            const expiryStr = item.expiryDate 
                ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) 
                : '-';

            return [
                item.description || '-',
                item.hsnCode || '-',
                item.batchNumber || '-',
                expiryStr,
                item.quantity.toString(),
                Number(item.unitPrice).toFixed(2),
                item.discount ? `${item.discount}%` : '-',
                item.gst ? `${item.gst}%` : '-',
                Number(item.total).toFixed(2)
            ];
        });

        const tableStyles = getTransparentTableStyles();

        // --- ITEMS TABLE ---
        const tableY = startY + 40;

        autoTable(doc, {
            startY: tableY,
            head: [['Medicine', 'HSN', 'Batch', 'Expiry', 'Qty', 'Unit Price', 'Disc.', 'GST%', 'Total (Rs)']],
            body: tableData,
            ...tableStyles,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [240, 240, 240], textColor: 20 },
            columnStyles: {
                0: { cellWidth: 45 },
                8: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const col1X = 14;
        const val1X = 80;
        const labelX = pageWidth - 70;
        const valueX = pageWidth - 14;

        // --- TAX BREAKDOWN (Left Side) ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text("Tax Summary:", col1X, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text("CGST:", col1X, finalY + 5);
        doc.text(`Rs. ${computedTotalCGST.toFixed(2)}`, val1X, finalY + 5, { align: "right" });
        doc.text("SGST:", col1X, finalY + 10);
        doc.text(`Rs. ${computedTotalSGST.toFixed(2)}`, val1X, finalY + 10, { align: "right" });
        doc.text("Total Tax Amount:", col1X, finalY + 15);
        doc.text(`Rs. ${(computedTotalCGST + computedTotalSGST).toFixed(2)}`, val1X, finalY + 15, { align: "right" });

        // --- BILL TOTALS (Right Side) ---
        const totalDiscountAmt = Number(bill.discount || 0);
        const subtotalBase = Number(bill.subtotal || 0) + totalDiscountAmt;
        
        doc.text("Sub Total:", labelX, finalY, { align: "left" });
        doc.text(`Rs. ${subtotalBase.toFixed(2)}`, valueX, finalY, { align: "right" });

        if (totalDiscountAmt > 0) {
            doc.text("Discount:", labelX, finalY + 5, { align: "left" });
            doc.text(`- Rs. ${totalDiscountAmt.toFixed(2)}`, valueX, finalY + 5, { align: "right" });
        }

        doc.text("Total GST:", labelX, finalY + 10, { align: "left" });
        doc.text(`Rs. ${(computedTotalCGST + computedTotalSGST).toFixed(2)}`, valueX, finalY + 10, { align: "right" });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text("Grand Total:", labelX, finalY + 16, { align: "left" });
        doc.text(`Rs. ${Number(bill.grandTotal).toFixed(2)}`, valueX, finalY + 16, { align: "right" });

        // --- TERMS & CONDITIONS & SIGNATURE ---
        const footerY = Math.max(finalY + 30, pageHeight - 50);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text("Terms & Conditions:", 14, footerY);
        doc.setFont('helvetica', 'normal');
        doc.text("1. Goods once sold will not be taken back or exchanged.", 14, footerY + 5);
        doc.text("2. Schedule H / H1 drugs are dispensed only against a valid medical prescription.", 14, footerY + 10);
        doc.text("3. Subject to local jurisdiction only. This is a computer generated invoice.", 14, footerY + 15);
        doc.text("4. E. & O.E (Errors and Omissions Excepted).", 14, footerY + 20);

        doc.setFont('helvetica', 'bold');
        doc.text("Authorized Signatory", pageWidth - 14, footerY + 20, { align: "right" });
        doc.line(pageWidth - 55, footerY + 16, pageWidth - 14, footerY + 16);

        doc.save(filename);
        toast.success("Bill downloaded successfully");

    } catch (error) {
        console.error("PDF Generation failed", error);
        toast.error("Failed to generate bill PDF");
    }
};
