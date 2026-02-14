import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from "sonner";
import { MedicalRecord } from "@/types";
import {
    generatePdfFilename,
    addWatermark,
    maskData,
    getTransparentTableStyles,
    getBase64ImageFromUrl
} from "./pdfUtils";

/**
 * Download Patient Card PDF using standard vector approach
 */
export const downloadPatientCardPDF = async (patient: any, medicalRecords: MedicalRecord[] = [], forceMasked: boolean = false) => {
    try {
        const doc = new jsPDF();

        const documentId = patient.uhid || patient.id || 'unknown_patient';
        // Generate filename
        const { filename, isMasked: generatedIsMasked } = generatePdfFilename(patient.full_name, patient.uhid || '', documentId, false);

        // Determine masking status
        const isMasked = forceMasked || generatedIsMasked;
        const finalFilename = (forceMasked && !filename.includes('Masked'))
            ? filename.replace('.pdf', '_Masked.pdf')
            : filename;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Add Background Template
        try {
            if (!isMasked) {
                const headerUrl = '/header_template.jpg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            }
        } catch (error) {
            console.error("Failed to load background template", error);
        }

        // 2. Handle Masking Watermark
        if (isMasked) {
            doc.saveGraphicsState();
            doc.setTextColor(220, 220, 220);
            doc.setFontSize(60);
            doc.text("MASKED COPY", pageWidth / 2, pageHeight / 2, { align: 'center', angle: -30 });
            doc.restoreGraphicsState();

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text("PATIENT REPORT (MASKED)", pageWidth / 2, 20, { align: 'center' });
        }

        const startY = isMasked ? 40 : 60; // Position below header template

        // 3. Report Title with Blue Underline
        if (!isMasked) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39); // #111827
            doc.text("PATIENT REPORT", pageWidth / 2, startY, { align: 'center' });

            // Blue underline bar
            doc.setDrawColor(0, 153, 204); // #0099cc
            doc.setLineWidth(1);
            doc.line(14, startY + 4, pageWidth - 14, startY + 4);

            doc.setDrawColor(0, 0, 0); // Reset
            doc.setLineWidth(0.1);
        }

        const infoTitleY = startY + 15;
        // Patient Information Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text("Patient Information", 14, infoTitleY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, infoTitleY + 2, pageWidth - 14, infoTitleY + 2);

        const infoY = infoTitleY + 10;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        const name = isMasked ? maskData(patient.full_name, 'name') : patient.full_name;
        const phone = isMasked ? maskData(patient.phone, 'phone') : patient.phone;
        const email = isMasked ? maskData(patient.email || '', 'email') : (patient.email || 'N/A');
        const address = isMasked ? maskData(patient.address || '', 'address') : (patient.address || 'N/A');

        // ... age calculation remains same ...
        const ageDisplay = patient.age ? patient.age : (patient.date_of_birth ? (() => {
            const dob = new Date(patient.date_of_birth);
            const diff_ms = Date.now() - dob.getTime();
            const age_dt = new Date(diff_ms);
            return Math.abs(age_dt.getUTCFullYear() - 1970).toString();
        })() : 'N/A');

        const genderDisplay = patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'N/A';

        // Column 1
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128); // #6b7280
        doc.text("NAME", 14, infoY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39); // #111827
        doc.text(name, 45, infoY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("AGE / GENDER", 14, infoY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(`${ageDisplay} / ${genderDisplay}`, 45, infoY + 6);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("CONTACT", 14, infoY + 12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(phone, 45, infoY + 12);

        // Column 2
        const col2X = pageWidth / 2 + 10;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("PATIENT ID", col2X, infoY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(patient.uhid || patient.id || 'N/A', col2X + 35, infoY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("BLOOD GROUP", col2X, infoY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(patient.blood_group || 'Not recorded', col2X + 35, infoY + 6);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("EMAIL", col2X, infoY + 12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(email, col2X + 35, infoY + 12);

        // Address full width
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(107, 114, 128);
        doc.text("ADDRESS", 14, infoY + 18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        const splitAddr = doc.splitTextToSize(address, pageWidth - 60);
        doc.text(splitAddr, 45, infoY + 18);

        let currentY = infoY + 18 + (splitAddr.length * 5) + 5;

        // 4. Medical Records History
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Medical Records History", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 10;

        // 4. Active Medical Conditions
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Active Medical Conditions", 14, currentY);
        doc.setDrawColor(229, 231, 235); // #e5e7eb
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 85, 99); // #4b5563
        doc.text(patient.medical_history || 'No active conditions recorded', 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 12;

        // 5. Medical Records History
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Medical Records History", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;

        if (medicalRecords.length > 0) {
            const tableData = medicalRecords.map(record => [
                record.date,
                record.doctor_name,
                record.diagnosis,
                record.treatment_notes || '-'
            ]);

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: currentY,
                head: [['Date', 'Doctor', 'Diagnosis', 'Treatment']],
                body: tableData,
                styles: { fontSize: 9 },
                didDrawPage: (data) => {
                    // Page breaks handled naturally by autoTable
                }
            });
            currentY = (doc as any).lastAutoTable.finalY + 12;
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(75, 85, 99);
            doc.text("No medical records found.", 14, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 12;
        }

        // 6. Current Medications
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Current Medications", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 85, 99);
        doc.text("No active medications", 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 12;

        // 7. Recent Lab Results
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Recent Lab Results", 14, currentY);
        doc.setDrawColor(229, 231, 235);
        doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
        currentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(75, 85, 99);
        doc.text("No recent lab results found", 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 12;

        // Footer if not masking and single page (autoTable handles multi page footer via didDrawPage)
        // If content was short, we need to explicitly draw footer on page 1?
        // Actually didDrawPage only works if autoTable spans pages or is called.
        // We can manually call footer on the last page if needed.
        // Footer is handled by background image if not masked
        // if (!isMasked) {
        //     const totalPages = doc.getNumberOfPages();
        //     for (let i = 1; i <= totalPages; i++) {
        //         doc.setPage(i);
        //         // drawClinicFooter(doc, i);
        //     }
        // }

        doc.save(finalFilename);
        toast.success("PDF downloaded successfully!");

    } catch (e) {
        console.error("PDF download failed", e);
        toast.error("Failed to generate PDF");
    }
};

export const downloadMaskedPatientCardPDF = async (patient: any, medicalRecords: MedicalRecord[] = []) => {
    await downloadPatientCardPDF(patient, medicalRecords, true);
};
