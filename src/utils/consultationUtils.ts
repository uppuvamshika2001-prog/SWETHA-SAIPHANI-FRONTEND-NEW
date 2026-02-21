import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { MedicalRecord } from '@/services/medicalRecordService';
import { getTransparentTableStyles, getBase64ImageFromUrl } from './pdfUtils';
import { toast } from 'sonner';

/**
 * Generate a professional Medical Consultation Record PDF
 */
export const generateConsultationPDF = async (record: MedicalRecord, options: { action: 'download' | 'print' } = { action: 'download' }) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Add Background Template
        try {
            const headerUrl = '/templete%20new.jpeg';
            const headerBase64 = await getBase64ImageFromUrl(headerUrl);
            doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
        } catch (error) {
            console.error("Failed to load background template", error);
        }

        const startY = 60; // Below header area of template
        doc.setTextColor(17, 24, 39); // #111827

        // Document Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("MEDICAL CONSULTATION RECORD", pageWidth / 2, startY, { align: 'center' });

        // Blue underline bar
        doc.setDrawColor(0, 153, 204); // #0099cc
        doc.setLineWidth(1);
        doc.line(14, startY + 4, pageWidth - 14, startY + 4);
        doc.setDrawColor(0, 0, 0); // Reset
        doc.setLineWidth(0.1);

        let currentY = startY + 15;

        // 2. Patient & Doctor Information Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("General Information", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);

        currentY += 10;
        doc.setFontSize(10);

        // Row 1
        const leftColX = 14;
        const rightColX = pageWidth / 2 + 10;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128); // #6b7280
        doc.text("PATIENT NAME", leftColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(`${record.patient.firstName} ${record.patient.lastName}`, 45, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("DATE", rightColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(format(new Date(record.date || record.createdAt), "dd MMM yyyy, h:mm a"), rightColX + 35, currentY);

        currentY += 6;

        // Row 2
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("PATIENT ID", leftColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(record.patientId?.toUpperCase() || 'N/A', 45, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("RECORD ID", rightColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(`#${record.id.toUpperCase()}`, rightColX + 35, currentY);

        currentY += 6;

        // Row 3 - Doctor Name
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("DOCTOR", leftColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);

        // Build doctor display name, avoiding "Dr. Dr." duplication
        let doctorFullName = `${record.doctor.firstName} ${record.doctor.lastName}`.trim();
        if (!doctorFullName.toLowerCase().startsWith('dr.') && !doctorFullName.toLowerCase().startsWith('dr ')) {
            doctorFullName = `Dr. ${doctorFullName}`;
        }

        // Separate qualifications if present (e.g. in parentheses or after comma)
        const qualMatch = doctorFullName.match(/^(.*?)(\(.*\))$/);
        const maxDoctorWidth = rightColX - 45 - 5; // Don't overlap into DEPT column

        if (qualMatch) {
            // Name without qualifications
            doc.text(qualMatch[1].trim(), 45, currentY, { maxWidth: maxDoctorWidth });
            // Qualifications on next line, smaller font
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text(qualMatch[2].trim(), 45, currentY + 5, { maxWidth: maxDoctorWidth });
            doc.setFontSize(10);
        } else {
            doc.text(doctorFullName, 45, currentY, { maxWidth: maxDoctorWidth });
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("DEPT", rightColX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text("OPD Consultation", rightColX + 35, currentY);

        currentY += 16;

        // 3. Symptoms & Vitals
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Symptoms & Vitals", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("CHIEF COMPLAINT", 14, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        const splitComplaint = doc.splitTextToSize(record.chiefComplaint || "No symptoms recorded.", pageWidth - 28);
        doc.text(splitComplaint, 14, currentY);
        currentY += (splitComplaint.length * 5) + 5;

        if (record.vitals) {
            const vitalsRows = [];
            if (record.vitals.bloodPressureSystolic) {
                vitalsRows.push(["BP", `${record.vitals.bloodPressureSystolic}/${record.vitals.bloodPressureDiastolic} mmHg`]);
            }
            if (record.vitals.heartRate) vitalsRows.push(["Heart Rate", `${record.vitals.heartRate} bpm`]);
            if (record.vitals.temperature) vitalsRows.push(["Temp", `${record.vitals.temperature}°F`]);
            if (record.vitals.weight) vitalsRows.push(["Weight", `${record.vitals.weight} kg`]);

            if (vitalsRows.length > 0) {
                autoTable(doc, {
                    ...getTransparentTableStyles(),
                    startY: currentY,
                    head: [['Metric', 'Value']],
                    body: vitalsRows,
                    margin: { left: 14 },
                    tableWidth: 80,
                });
                currentY = (doc as any).lastAutoTable.finalY + 10;
            }
        }

        // 4. Diagnosis
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 60; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Diagnosis", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 10;
        doc.setFontSize(11);
        doc.setTextColor(0, 80, 158); // Professional blue
        doc.text(record.diagnosis || "No diagnosis recorded.", 14, currentY);
        doc.setTextColor(17, 24, 39);
        currentY += 12;

        // 5. Treatment Plan
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 60; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Treatment Plan & Notes", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(record.treatmentNotes || "No treatment notes recorded.", pageWidth - 28);
        doc.text(splitNotes, 14, currentY);
        currentY += (splitNotes.length * 5) + 12;

        // 6. Prescriptions
        if (record.prescriptions && record.prescriptions.length > 0) {
            if (currentY > pageHeight - 60) { doc.addPage(); currentY = 60; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Prescribed Medications", 14, currentY);
            doc.setDrawColor(229, 231, 235);
            doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
            currentY += 8;

            const medRows = record.prescriptions.map(p => [
                p.medicineName,
                p.dosage,
                p.frequency,
                p.duration,
                p.instructions || '-'
            ]);

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: currentY,
                head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                body: medRows,
                styles: { fontSize: 9 },
            });
            currentY = (doc as any).lastAutoTable.finalY + 12;
        }

        // 7. Lab Orders
        if (record.labOrders && record.labOrders.length > 0) {
            if (currentY > pageHeight - 40) { doc.addPage(); currentY = 60; }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Lab Orders", 14, currentY);
            doc.setDrawColor(229, 231, 235);
            doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
            currentY += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(record.labOrders.join(", "), 14, currentY);
            currentY += 15;
        }

        // Finalize
        const dateStr = format(new Date(), 'yyyyMMdd');
        const filename = `${record.patient.firstName}_${record.id.toUpperCase()}_${dateStr}.pdf`;

        if (options.action === 'print') {
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
            toast.success("Consultation record sent to print");
        } else {
            doc.save(filename);
            toast.success("Consultation record downloaded");
        }

    } catch (e) {
        console.error("Consultation PDF generation failed", e);
        toast.error("Failed to generate consultation report");
    }
};
