import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pill, Calendar, Clock, Download, Stethoscope } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addWatermark, drawClinicHeader, drawClinicFooter } from '@/utils/pdfUtils';

const PatientPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<Patient | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const profile = await patientService.getMyProfile();
                setPatient(profile);
                if (profile?.uhid) {
                    const data = await patientService.getPatientPrescriptions(profile.uhid);
                    setPrescriptions(data);
                }
            } catch (error) {
                console.error("Failed to fetch prescriptions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDownloadPrescription = async (prescription: any) => {
        const doc = new jsPDF();

        // 1. Watermark
        await addWatermark(doc);

        // 2. Header
        await drawClinicHeader(doc, 'MEDICAL PRESCRIPTION');

        const startY = 45; // Below header

        // 3. Patient Info
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        doc.text(`Patient: ${patient?.full_name}`, 14, startY);
        doc.text(`Date: ${new Date(prescription.createdAt || prescription.created_at).toLocaleDateString()}`, 14, startY + 5);
        doc.text(`Doctor: ${prescription.doctor?.firstName} ${prescription.doctor?.lastName}`, 14, startY + 10);

        // 4. Notes
        let noteY = startY + 20;
        if (prescription.notes) {
            const splitNotes = doc.splitTextToSize(`Notes: ${prescription.notes}`, 180);
            doc.text(splitNotes, 14, noteY);
            noteY += (splitNotes.length * 5) + 5;
        }

        // 5. Medicines Table
        const medicines = prescription.medicines || [];
        const tableData = medicines.map((med: any) => [
            med.name,
            med.dosage,
            med.frequency,
            med.duration,
            med.instructions
        ]);

        autoTable(doc, {
            startY: noteY,
            head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 80, 158] },
            didDrawPage: (data) => drawClinicFooter(doc, data.pageNumber)
        });

        // If table didn't trigger footer (single page), draw it?
        // autoTable didDrawPage handles it for pages with table. 
        // We should ensure it draws if content is short.
        // Actually didDrawPage only runs if table is drawn. 
        // Standard practice:
        // logic should be robust.

        doc.save(`Prescription_${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: "Downloaded", description: "Prescription downloaded successfully" });
    };

    if (loading) {
        return <div className="p-8 text-center">Loading prescriptions...</div>;
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">My Prescriptions</h1>

                <div className="grid gap-6">
                    {prescriptions.length > 0 ? (
                        prescriptions.map((px) => (
                            <Card key={px.id} className="shadow-sm">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Pill className="h-5 w-5 text-emerald-600" />
                                                Prescription from {new Date(px.createdAt || px.created_at).toLocaleDateString()}
                                            </CardTitle>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Stethoscope className="h-4 w-4" />
                                                Dr. {px.doctor?.firstName} {px.doctor?.lastName}
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadPrescription(px)}>
                                            <Download className="mr-2 h-4 w-4" /> Download PDF
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {px.notes && (
                                        <div className="mb-4 text-sm bg-yellow-50 p-3 rounded-md border border-yellow-100 text-yellow-800">
                                            <span className="font-semibold mr-1">Note:</span> {px.notes}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        {px.medicines && px.medicines.map((med: any, idx: number) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{med.name}</p>
                                                    <p className="text-sm text-slate-500">{med.dosage} • {med.frequency}</p>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                                    <Badge variant="outline" className="bg-white">{med.duration}</Badge>
                                                    {med.instructions && (
                                                        <span className="text-sm text-slate-500 italic">{med.instructions}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <p>No prescriptions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientPrescriptions;
