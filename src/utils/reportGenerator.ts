import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromUrl, getTransparentTableStyles } from './pdfUtils';
import { format } from 'date-fns';

// Helper to init PDF with full-page background header
const initReportPdf = async (title: string): Promise<{ doc: jsPDF; headerImgData: string }> => {
    const doc = new jsPDF();

    // Load the full-page background template
    const headerImageUrl = '/header_template.jpg';
    let headerImgData = '';
    try {
        headerImgData = await getBase64ImageFromUrl(headerImageUrl);

        // Add to first page
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.addImage(headerImgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    } catch (error) {
        console.error("Failed to load header template:", error);
    }

    // Report Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    // Position title below the header area (approx 40mm)
    doc.text(title.toUpperCase(), 14, 55);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 61);

    return { doc, headerImgData };
};

// Add Footer (Page Numbers only, address is in template)
const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const width = doc.internal.pageSize.width;
    const height = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        // Page Number
        doc.text(`Page ${i} of ${pageCount}`, width - 15, height - 10, { align: "right" });
    }
};

// Start Y position for tables (below title)
const TABLE_START_Y = 70;

export const generatePatientReport = async (patients: any[]) => {
    const { doc, headerImgData } = await initReportPdf("Patient Registry Report");

    // Check if we have data
    if (!patients || patients.length === 0) {
        doc.setFontSize(12);
        doc.text("No records found.", 14, 80);
        addFooter(doc);
        doc.save(`patient_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
        return;
    }

    const tableData = patients.map(p => {
        // Handle different possible structures (just in case)
        const name = p.full_name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
        const dateStr = p.created_at || p.createdAt || new Date().toISOString();

        return [
            p.uhid || p.id || '-',
            name,
            p.gender || '-',
            p.phone || '-',
            p.address || '-',
            format(new Date(dateStr), 'dd/MM/yyyy')
        ];
    });

    autoTable(doc, {
        startY: TABLE_START_Y,
        head: [['ID', 'Name', 'Gender', 'Phone', 'Address', 'Registered']],
        body: tableData,
        ...getTransparentTableStyles(), // Apply transparent styles
        didDrawPage: (data) => {
            // Add background to subsequent pages
            if (data.pageNumber > 1 && headerImgData) {
                // Background image logic is tricky with autoTable new pages.
                // For now, we accept it's primarily on page 1.
            }
        }
    });

    // Add background to subsequent pages manually to ensure it's at the back
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // This puts image ON TOP if drawn here. 
        // We have to move this content to the "back".
        // jspdf doesn't support z-index.
        // So we should iterate pages and add image? 
        // No, if text is already there, image covers it.

        // Workaround: 
        // Use `didDrawPage` hook?
    }

    // REVISED STRATEGY for Background on Multi-page AutoTable:
    // It's safest to just rely on the first page having it.
    // If the user wants it on ALL pages, we need to hook into page creation.
    // But jspdf-autotable handles page breaks internally.
    // Let's stick to the First Page for now as per "DownloadInvoice" logic, OR
    // use a simpler approach: define a reused 'addHeader' function and rely on hooks.

    // Actually, let's look at how `downloadPharmacyBill.ts` did it.
    // It used `autoTable` with `margin: { top: 80 }` and `didDrawPage` to add things.
    // But for the background IMAGE, `downloadPharmacyBill` only added it once at start.
    // If that bill spans multiple pages, does it lack background? 
    // Yes, likely. 
    // For these reports, let's keep it simple: Background on Page 1.
    // If we really need it on all, we'd need to monkey-patch addPage or strictly control it.

    // WAIT, `header_template.jpg` is a FULL PAGE background.
    // If I add it on page 2 via `didDrawPage`, it WILL cover the table rows drawn on that page.
    // So for now, I will ONLY apply it to Page 1, similar to the Pharmacy Bill.

    addFooter(doc);
    doc.save(`patient_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateBillingReport = async (bills: any[]) => {
    const { doc } = await initReportPdf("Billing Summary Report");

    const tableData = bills.map(b => [
        b.billNumber,
        `${b.patient?.firstName} ${b.patient?.lastName}`,
        format(new Date(b.createdAt), 'dd/MM/yyyy'),
        b.status,
        `Rs. ${Number(b.grandTotal).toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: TABLE_START_Y,
        head: [['Bill #', 'Patient', 'Date', 'Status', 'Amount']],
        body: tableData,
        ...getTransparentTableStyles()
    });

    // Add total revenue
    const totalRevenue = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Revenue: Rs. ${totalRevenue.toFixed(2)}`, 14, finalY);

    addFooter(doc);
    doc.save(`billing_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateLabReport = async (orders: any[]) => {
    const { doc } = await initReportPdf("Lab Orders Report");

    const tableData = orders.map(o => [
        o.id,
        o.patient_name || 'Unknown',
        o.tests?.[0]?.test_name || 'General Lab Test',
        format(new Date(o.ordered_at || o.createdAt || new Date()), 'dd/MM/yyyy'),
        o.status
    ]);

    autoTable(doc, {
        startY: TABLE_START_Y,
        head: [['Order ID', 'Patient', 'Test Name', 'Date', 'Status']],
        body: tableData,
        ...getTransparentTableStyles()
    });

    addFooter(doc);
    doc.save(`lab_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateConsultationReport = async (records: any[]) => {
    const { doc } = await initReportPdf("Consultation Report");

    const tableData = records.map(r => [
        format(new Date(r.date || r.createdAt), 'dd/MM/yyyy'),
        r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : 'Unknown',
        r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'Unknown',
        r.diagnosis || '-',
        r.treatmentNotes ? (r.treatmentNotes as string).substring(0, 30) + '...' : '-'
    ]);

    autoTable(doc, {
        startY: TABLE_START_Y,
        head: [['Date', 'Patient', 'Doctor', 'Diagnosis', 'Notes']],
        body: tableData,
        ...getTransparentTableStyles()
    });

    addFooter(doc);
    doc.save(`consultation_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const generateFullAnalyticsReport = async (stats: any) => {
    const { doc } = await initReportPdf("Full Analytics Summary");

    doc.setFontSize(12);
    doc.text("Key Performance Indicators", 14, TABLE_START_Y + 10);

    const metrics = [
        ['Total Registered Patients', stats.totalPatients.toString()],
        ['Total Consultations', stats.totalConsultations.toString()],
        ['Total Lab Orders', stats.totalLabOrders.toString()],
        ['Total Bills Generated', stats.totalBills.toString()],
        ['Total Revenue', `Rs. ${stats.totalRevenue.toFixed(2)}`],
        ['Avg. Daily Revenue (Est.)', `Rs. ${(stats.totalRevenue / 30).toFixed(2)}`]
    ];

    autoTable(doc, {
        startY: TABLE_START_Y + 20,
        head: [['Metric', 'Value']],
        body: metrics,
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 100 } },
        ...getTransparentTableStyles()
    });

    addFooter(doc);
    doc.save(`analytics_report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
