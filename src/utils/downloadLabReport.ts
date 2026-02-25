
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "sonner";
import { LabOrder } from '@/types';
import {
    getBase64ImageFromUrl,
    generatePdfFilename,
    maskData,
    getTransparentTableStyles
} from "@/utils/pdfUtils";

/**
 * Download Lab Report PDF using the standardized background template
 */
export const downloadLabReportPDF = async (order: LabOrder, forceMasked: boolean = false) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Handle patient name safely
        let patientName = (order as any).patient_name || 'Patient';
        if (!patientName || patientName === 'Patient') {
            if ((order as any).patient) {
                patientName = `${(order as any).patient.firstName || ''} ${(order as any).patient.lastName || ''}`.trim() || 'Patient';
            }
        }

        const orderId = order.id || (order as any).order_id || 'LAB-N/A';
        const { filename, isMasked: generatedIsMasked } = generatePdfFilename(patientName, orderId, order.id || '', false);
        const isMasked = forceMasked || generatedIsMasked;
        const finalFilename = isMasked ? filename.replace('.pdf', '_Masked.pdf') : `Lab_Report_${filename}`;

        // 1. Add Background Template
        try {
            if (!isMasked) {
                const headerUrl = '/templete%20new.jpeg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            }
        } catch (error) {
            console.error("Failed to load background template", error);
        }

        // 2. Report Header Info
        const startY = 60;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        if (isMasked) {
            doc.saveGraphicsState();
            doc.setTextColor(220, 220, 220);
            doc.setFontSize(60);
            doc.text("MASKED COPY", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
            doc.restoreGraphicsState();

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text("LAB REPORT (MASKED)", pageWidth / 2, 20, { align: 'center' });
        }

        // Patient Details Section
        doc.setFont('helvetica', 'bold');
        doc.text("Patient Name:", 14, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(isMasked ? maskData(patientName, 'name') : patientName, 45, startY);

        doc.setFont('helvetica', 'bold');
        doc.text("Patient ID:", 14, startY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text((order as any).patient_id || (order as any).patientId || ((order as any).patient as any)?.uhid || 'N/A', 45, startY + 5);

        // Order Details Section
        const rightColX = 120;
        doc.setFont('helvetica', 'bold');
        doc.text("Order ID:", rightColX, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(String(orderId), rightColX + 30, startY);

        doc.setFont('helvetica', 'bold');
        doc.text("Status:", rightColX, startY + 5);
        doc.setFont('helvetica', 'normal');
        doc.text((order.status || 'Ordered').toUpperCase(), rightColX + 30, startY + 5);

        // 3. Test Results
        let currentY = startY + 25;

        // Add LAB RESULTS Title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("LAB RESULTS", pageWidth / 2, currentY, { align: 'center' });
        currentY += 15;

        // Safely extract parameters from the order.result object
        const params = (order as any).result?.result?.parameters || ((order as any).result as any)?.parameters || [];

        if (params.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Test: ${(order as any).testName || 'Details'}`, 14, currentY);
            currentY += 8;

            const tableData = params.map((p: any) => [
                p.name || '-',
                `${p.value || ''} ${p.unit && p.unit.trim() !== '' ? p.unit : ''}`.trim(),
                p.normalRange || '-'
            ]);

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: currentY,
                head: [['Parameter', 'Result', 'Normal Range']],
                body: tableData,
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 50, fontStyle: 'bold' },
                    2: { cellWidth: 50 }
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + 15;
        } else if ((order as any).result?.interpretation || (order as any).notes) {
            // Has a result but no parameters table
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Result recorded, see interpretation.`, 14, currentY);
            currentY += 10;
        } else {
            doc.setFont('helvetica', 'italic');
            doc.text("No test details recorded.", 14, currentY);
            currentY += 10;
        }

        // 4. Notes & Remarks
        if (order.notes) {
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text("Clinical Remarks:", 14, currentY);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(order.notes, pageWidth - 28);
            doc.text(splitNotes, 14, currentY + 5);
        }

        doc.save(finalFilename);
        toast.success("Lab Report downloaded successfully");

    } catch (error) {
        console.error("Failed to generate Lab Report PDF", error);
        toast.error("Failed to generate PDF");
    }
};
