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
        const isWalkIn = Boolean(bill.isWalkIn || bill.is_walk_in);
        const patientName = isWalkIn
            ? (bill.customerName || bill.customer_name || "Walk-in Customer")
            : (bill.patient ? `${bill.patient.firstName || bill.patient.first_name || ''} ${bill.patient.lastName || bill.patient.last_name || ''}`.trim() : "Patient");
        const invoiceNumber = bill.billNumber || bill.bill_number || bill.id || 'N/A';
        const invoiceDate = new Date(bill.createdAt || bill.created_at || Date.now());
        const displayDate = Number.isNaN(invoiceDate.getTime()) ? new Date() : invoiceDate;

        const { filename, isMasked } = generatePdfFilename(patientName, invoiceNumber, bill.id, true);

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
        doc.text(`Invoice #: ${invoiceNumber}`, 14, startY + 8);
        doc.text(`Date: ${displayDate.toLocaleDateString()}`, 14, startY + 13);
        
        const patientId = bill.patientId || bill.patient_id || (bill.isWalkIn ? undefined : undefined);
        const patientIdStr = patientId ? `(UHID: ${patientId})` : '(Walk-in)';
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

        console.log("Pharmacy Bill PDF Data:", {
            invoiceNumber,
            invoiceDate: displayDate,
            subtotal: bill.subtotal,
            gstAmount: bill.gstAmount,
            grandTotal: bill.grandTotal,
            itemsCount: bill.items?.length
        });

        // Right Column
        const rightColX = pageWidth - 60;
        doc.text(`Status: ${bill.status}`, rightColX, startY + 8);
        doc.text(`Mode: ${(bill as any).paymentMode || 'CASH'}`, rightColX, startY + 13);
        doc.text(`Billed By: ${(bill as any).createdBy || "Pharmacist"}`, rightColX, startY + 18);

        const computedTotalCGST = Number(bill.gstAmount || 0) / 2;
        const computedTotalSGST = Number(bill.gstAmount || 0) / 2;

        const normalizeItemNumber = (value: any) => {
            const numericValue = Number(value);
            return Number.isFinite(numericValue) ? numericValue : 0;
        };

        const tableData = bill.items.map((item: any) => {
            const expiryStr = item.expiryDate 
                ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }) 
                : '-';
            const unitPrice = normalizeItemNumber(item.unitPrice ?? item.unit_price ?? item.price);
            const totalAmount = normalizeItemNumber(item.totalAmount ?? item.total_amount ?? item.total);
            const gstPercent = item.gst ?? item.gst_percent ?? item.gstPercent;
            const discountPercent = item.discount ?? item.discount_amount ?? item.discountAmount;

            return [
                item.description || '-',
                item.hsnCode || item.hsn_code || '-',
                item.batchNumber || item.batch_number || '-',
                expiryStr,
                String(item.quantity || 0),
                unitPrice.toFixed(2),
                totalAmount.toFixed(2)
            ];
        });

        const tableStyles = getTransparentTableStyles();

        // --- ITEMS TABLE ---
        const tableY = startY + 40;

        autoTable(doc, {
            startY: tableY,
            head: [['Medicine', 'HSN', 'Batch', 'Expiry', 'Qty', 'Unit Price', 'Total (Rs)']],
            body: tableData,
            ...tableStyles,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [240, 240, 240], textColor: 20 },
            columnStyles: {
                0: { cellWidth: 55 },
                6: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const col1X = 14;
        const val1X = 80;
        const labelX = pageWidth - 70;
        const valueX = pageWidth - 14;

        // --- BILL TOTALS (Right Side) ---
        const totalDiscountAmt = Number(bill.discount || 0);
        const subtotalBase = Number(bill.subtotal || 0);
        
        doc.text("Sub Total:", labelX, finalY, { align: "left" });
        doc.text(`Rs. ${subtotalBase.toFixed(2)}`, valueX, finalY, { align: "right" });

        if (totalDiscountAmt > 0) {
            doc.text("Discount:", labelX, finalY + 5, { align: "left" });
            doc.text(`- Rs. ${totalDiscountAmt.toFixed(2)}`, valueX, finalY + 5, { align: "right" });
        }

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
