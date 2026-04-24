import jsPDF from 'jspdf';
import { toast } from "sonner";
import { Appointment } from "@/types";
import { getBase64ImageFromUrl } from "./pdfUtils";

export const downloadAppointmentSlipPDF = async (apt: Appointment) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Background Template (Official Letterhead)
        try {
            const headerUrl = '/templete%20new.jpeg';
            const headerBase64 = await getBase64ImageFromUrl(headerUrl);
            doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
        } catch (error) {
            console.error("Failed to load background template", error);
            // Fallback: Manually draw header text if image fails
            doc.setFontSize(24);
            doc.setTextColor(0, 86, 179);
            doc.setFont('helvetica', 'bold');
            doc.text("SWETHA SAIPHANI CLINIC", pageWidth / 2, 25, { align: 'center' });
            doc.setFontSize(14);
            doc.setTextColor(220, 53, 69);
            doc.text("The Brain & Bone Center", pageWidth / 2, 33, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(50, 50, 50);
            doc.text("NEUROSURGERY | ORTHOROBOTICS | SPORTS INJURIES", pageWidth / 2, 38, { align: 'center' });
            doc.line(14, 42, pageWidth - 14, 42);
        }

        const startY = 85; // Adjusted to match pharmacy invoice layout (after letterhead)

        // Title
        doc.setFontSize(18);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'bold');
        doc.text("APPOINTMENT SLIP", 14, startY);

        // Grid-style Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);

        // Left Column
        doc.text("Reference ID:", 14, startY + 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(apt.appointment_id || 'N/A', 45, startY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text("Date:", 14, startY + 20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(apt.date || 'N/A', 45, startY + 20);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text("Time:", 14, startY + 28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(apt.time || 'N/A', 45, startY + 28);

        // Right Column
        const rightColX = pageWidth - 80;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text("Status:", rightColX, startY + 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 120, 0);
        doc.text((apt.status || 'Scheduled').toUpperCase(), rightColX + 25, startY + 12);

        // Separator
        doc.setDrawColor(230, 230, 230);
        doc.line(14, startY + 38, pageWidth - 14, startY + 38);

        // Patient Details
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text("PATIENT INFORMATION", 14, startY + 48);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(apt.patient_name || 'N/A', 14, startY + 58);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`UHID: ${apt.patient_id || 'N/A'}`, 14, startY + 65);

        // Doctor Details
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text("CONSULTING SPECIALIST", 14, startY + 80);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(apt.doctor_name || 'N/A', 14, startY + 90);
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(apt.department?.toUpperCase() || 'GENERAL CONSULTATION', 14, startY + 97);

        // Footer Section
        const footerY = pageHeight - 60;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, footerY, pageWidth - 14, footerY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text("Important Instructions:", 14, footerY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text("1. Please present this slip at the registration desk upon arrival.", 14, footerY + 16);
        doc.text("2. Please arrive at least 15 minutes prior to your appointment time.", 14, footerY + 21);
        doc.text("3. Appointment times are indicative and subject to emergency cases.", 14, footerY + 26);

        // Signatory
        doc.setFont('helvetica', 'bold');
        doc.text("Authorized Signatory", pageWidth - 14, footerY + 45, { align: "right" });
        doc.line(pageWidth - 55, footerY + 40, pageWidth - 14, footerY + 40);

        doc.save(`${apt.patient_name.replace(/\s+/g, '_')}_Appointment.pdf`);
        toast.success("Appointment slip downloaded successfully");

    } catch (error) {
        console.error("PDF Generation failed", error);
        toast.error("Failed to generate appointment slip");
    }
};
