import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Eye, Download, Loader2, Printer } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { usePrescriptions, Prescription } from "@/contexts/PrescriptionContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { PrescriptionDetailsDialog } from "@/components/medical/PrescriptionDetailsDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format } from "date-fns";
import { getTransparentTableStyles } from "@/utils/pdfUtils";

export default function OPDPrescriptions() {
    const { prescriptions, refreshPrescriptions } = usePrescriptions();
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        refreshPrescriptions().finally(() => setLoading(false));
    }, [refreshPrescriptions]);

    const handlePrint = async (prescription: Prescription) => {
        setIsGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Helpers
            const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
                try {
                    const res = await fetch(imageUrl);
                    const blob = await res.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error("Failed to convert image to base64"));
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error("Error loading image:", imageUrl, error);
                    return "";
                }
            };

            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            };

            // 1. Add Background Template
            try {
                const headerUrl = '/header_template.jpg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            } catch (error) {
                console.error("Failed to load background template", error);
            }

            const startY = 60; // Below header area of template

            doc.setTextColor(0, 0, 0);

            // Document Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Medical Prescription", 14, startY);

            // Patient Info
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            let yPos = startY + 10;
            const leftColX = 14;
            const rightColX = pageWidth / 2 + 10;

            // Row 1
            doc.setFont("helvetica", "bold");
            doc.text("Patient Name:", leftColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(prescription.patient_name, leftColX + 30, yPos);

            doc.setFont("helvetica", "bold");
            doc.text("Date:", rightColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(format(new Date(prescription.created_at), "dd MMM yyyy"), rightColX + 15, yPos);

            yPos += 8;

            // Row 2
            doc.setFont("helvetica", "bold");
            doc.text("Doctor:", leftColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(prescription.doctor_name, leftColX + 30, yPos);

            doc.setFont("helvetica", "bold");
            doc.text("Order ID:", rightColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(`#${prescription.order_id.slice(0, 8)}`, rightColX + 15, yPos);

            yPos += 15;

            // Diagnosis section if available, else just medicines
            if (prescription.diagnosis) {
                doc.setFont("helvetica", "bold");
                doc.text("Diagnosis:", 14, yPos);
                doc.setFont("helvetica", "normal");
                const splitDiagnosis = doc.splitTextToSize(prescription.diagnosis, pageWidth - 50);
                doc.text(splitDiagnosis, 50, yPos);
                yPos += (splitDiagnosis.length * 5) + 10;
            }

            // Medicines Table
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text("Prescribed Medicines", 14, yPos);
            yPos += 5;

            const medRows = prescription.items.map(item => [
                item.medicine_name,
                item.dosage,
                item.frequency,
                item.duration,
                item.instructions || '-'
            ]);

            autoTable(doc, {
                ...getTransparentTableStyles(),
                startY: yPos,
                head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                body: medRows,
                columnStyles: { 4: { cellWidth: 50 } }
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Status: ${prescription.status.toUpperCase()}`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: "right" });
            }

            // Print
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
            toast.success("Prescription generated for printing");

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const columns = [
        { key: "order_id", header: "ID", render: (p: Prescription) => p.order_id.slice(0, 8) },
        { key: "patient_name", header: "Patient" },
        { key: "doctor_name", header: "Prescribed By" },
        { key: "items", header: "Medicines", render: (p: Prescription) => `${p.items.length} items` },
        { key: "status", header: "Status", render: (p: Prescription) => <StatusBadge status={p.status} /> },
        { key: "created_at", header: "Date", render: (p: Prescription) => new Date(p.created_at).toLocaleDateString() },
        {
            key: "actions",
            header: "Actions",
            render: (p: Prescription) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPrescription(p)} title="View"><Eye className="h-4 w-4" /></Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(p)}
                        title="Print"
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-4 w-4" />}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6" />
                        OPD Prescriptions
                    </h1>
                    <p className="text-muted-foreground">Prescriptions issued in OPD</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Prescription Log</CardTitle>
                        <CardDescription>Track all outpatient prescriptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <DataTable
                                data={prescriptions}
                                columns={columns}
                                emptyMessage="No prescriptions found"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            <PrescriptionDetailsDialog
                open={!!selectedPrescription}
                onOpenChange={(open) => !open && setSelectedPrescription(null)}
                prescription={selectedPrescription}
            />
        </DashboardLayout>
    );
}
