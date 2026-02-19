import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, HardDrive, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/use-toast";
import { addWatermark, drawClinicHeader, drawClinicFooter, getTransparentTableStyles, getBase64ImageFromUrl } from "@/utils/pdfUtils";


import { useEffect, useState } from "react";
import { patientService } from "@/services/patientService";

interface ReportItem {
    id: string;
    title: string;
    type: 'Lab Report' | 'Prescription' | 'Invoice' | 'Summary';
    date: string;
    author: string;
    status: string;
    originalData: any;
}

const PatientReports = () => {
    const { toast } = useToast();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await patientService.getMyProfile();
                const [prescriptions, bills, labResults, records] = await Promise.all([
                    patientService.getPatientPrescriptions(profile.id),
                    patientService.getPatientBills(profile.id),
                    patientService.getPatientLabResults(profile.id),
                    patientService.getPatientMedicalRecords(profile.id)
                ]);

                const aggregatedReports: ReportItem[] = [];

                // Map Prescriptions
                prescriptions?.forEach((p: any) => {
                    const createdAt = p.createdAt || p.created_at;
                    aggregatedReports.push({
                        id: p.id,
                        title: `Prescription - ${new Date(createdAt).toLocaleDateString()}`,
                        type: 'Prescription',
                        date: createdAt,
                        author: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : 'Doctor',
                        status: 'Available',
                        originalData: p
                    });
                });

                // Map Bills
                bills?.forEach((b: any) => {
                    const createdAt = b.createdAt || b.created_at;
                    aggregatedReports.push({
                        id: b.id,
                        title: `Invoice #${b.billNumber || b.bill_id}`,
                        type: 'Invoice',
                        date: createdAt,
                        author: 'Billing Dept',
                        status: b.status,
                        originalData: {
                            ...b,
                            bill_id: b.billNumber || b.bill_id,
                            created_at: createdAt,
                            total: b.grandTotal || b.total
                        }
                    });
                });

                // Map Lab Results
                labResults?.forEach((l: any) => {
                    const createdAt = l.createdAt || l.ordered_at;
                    const mappedLab = {
                        id: l.id,
                        order_id: `LAB-${l.id.slice(0, 4).toUpperCase()}`,
                        ordered_at: createdAt,
                        status: l.status.toLowerCase(),
                        tests: [{
                            test_id: l.testCode || 'N/A',
                            test_name: l.testName,
                            status: l.status.toLowerCase(),
                            result: l.result?.result?.parameters?.map((p: any) => `${p.name}: ${p.value} ${p.unit || ''}`).join(', ') || '',
                            normal_range: l.result?.result?.parameters?.map((p: any) => p.normalRange || '-').join(', ') || '-'
                        }]
                    };

                    aggregatedReports.push({
                        id: l.id,
                        title: `Lab Report #${mappedLab.order_id}`,
                        type: 'Lab Report',
                        date: createdAt,
                        author: 'Pathology Lab',
                        status: l.status,
                        originalData: mappedLab
                    });
                });

                // Map Medical Records ( Summaries )
                records?.forEach((r: any) => {
                    aggregatedReports.push({
                        id: r.id,
                        title: `Consultation Summary - ${r.diagnosis}`,
                        type: 'Summary',
                        date: r.date,
                        author: r.doctor_name,
                        status: 'Available',
                        originalData: r
                    });
                });

                // Sort by date desc
                aggregatedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setReports(aggregatedReports);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDownload = async (report: ReportItem) => {
        const doc = new jsPDF();

        // 1. Add Background Template
        try {
            const headerUrl = '/templete%20new.jpeg';
            const headerBase64 = await getBase64ImageFromUrl(headerUrl);
            doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
        } catch (error) {
            console.error("Failed to load background template", error);
            await addWatermark(doc);
        }

        const yStart = 60; // Below header area of template

        // --- GENERATE CONTENT BASED ON TYPE ---
        if (report.type === 'Lab Report') {
            const data = report.originalData;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Order ID: ${data.order_id}`, 14, yStart);
            doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 14, yStart + 5);

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: yStart + 15,
                head: [['Test Name', 'Result', 'Normal Range', 'Status']],
                body: data.tests.map((t: any) => [
                    t.test_name,
                    t.result || 'Pending',
                    t.normal_range || '-',
                    t.status
                ]),
                styles: { fontSize: 9, cellPadding: 3 }
            });
        }
        else if (report.type === 'Prescription') {
            const data = report.originalData;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Doctor: ${report.author}`, 14, yStart);
            doc.text(`Date: ${new Date(data.createdAt || data.created_at).toLocaleDateString()}`, 14, yStart + 5);

            let noteY = yStart + 15;
            if (data.notes) {
                const splitNotes = doc.splitTextToSize(`Notes: ${data.notes}`, 180);
                doc.text(splitNotes, 14, noteY);
                noteY += (splitNotes.length * 5) + 5;
            }

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: noteY,
                head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                body: data.medicines.map((m: any) => [
                    m.name, m.dosage, m.frequency, m.duration, m.instructions
                ]),
                styles: { fontSize: 9, cellPadding: 3 }
            });
        }
        else if (report.type === 'Invoice') {
            const data = report.originalData;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Bill ID: ${data.bill_id}`, 14, yStart);
            doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`, 14, yStart + 5);
            doc.text(`Status: ${data.status.toUpperCase()}`, 190, yStart + 5, { align: 'right' });

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: yStart + 15,
                head: [['Description', 'Category', 'Amount']],
                body: data.items.map((i: any) => [
                    i.description, i.category, `Rs. ${Number(i.total).toFixed(2)}`
                ]),
                foot: [['', 'Total', `Rs. ${Number(data.total).toFixed(2)}`]],
                footStyles: { fillColor: null, textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 }
            });
        }
        else if (report.type === 'Summary') {
            const data = report.originalData;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Doctor: ${data.doctor_name}`, 14, yStart);
            doc.text(`Date: ${new Date(data.date).toLocaleDateString()}`, 14, yStart + 5);

            const content = [
                { title: 'Diagnosis', text: data.diagnosis },
                { title: 'Chief Complaint', text: data.chief_complaint },
                { title: 'Treatment', text: data.treatment_notes }
            ];

            let y = yStart + 15;
            content.forEach(section => {
                doc.setFont("helvetica", "bold");
                doc.text(`${section.title}:`, 14, y);
                y += 5;
                doc.setFont("helvetica", "normal");
                const splitText = doc.splitTextToSize(section.text || 'N/A', 180);
                doc.text(splitText, 14, y);
                y += (splitText.length * 5) + 5;
            });
        }

        const fileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(fileName);

        toast({
            title: "Download Complete",
            description: `${report.title} has been downloaded successfully.`,
        });
    };

    if (loading) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Medical Reports</h1>
                        <p className="text-muted-foreground mt-1">
                            Access and download all your medical documents in one place.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Documents</CardTitle>
                        <CardDescription>A unified list of your test results, prescriptions, and invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Document Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Author/Source</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.length > 0 ? (
                                    reports.map((report, idx) => (
                                        <TableRow key={`${report.type}-${report.id}-${idx}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                        <FileText className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-medium">{report.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{report.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(report.date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-slate-700">{report.author}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleDownload(report)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No reports found. Documents will appear here once generated.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PatientReports;

