import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Eye, Activity, Pill, User, Calendar, FileText, RefreshCw, Loader2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTransparentTableStyles } from "@/utils/pdfUtils";

export default function OPDConsultation() {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const fetchRecords = useCallback(async (showRefreshToast = false) => {
        try {
            if (showRefreshToast) setRefreshing(true);
            const data = await medicalRecordService.getRecords();
            setRecords(data);
            if (showRefreshToast) toast.success("Records refreshed");
        } catch (error) {
            console.error("Failed to fetch medical records:", error);
            toast.error("Failed to load consultation records");
            setRecords([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
        const interval = setInterval(() => fetchRecords(), 30000);
        return () => clearInterval(interval);
    }, [fetchRecords]);

    const getPatientName = (record: MedicalRecord) => {
        return record.patient
            ? `${record.patient.firstName} ${record.patient.lastName}`.trim()
            : "Unknown Patient";
    };

    const getDoctorName = (record: MedicalRecord) => {
        return record.doctor
            ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`.trim()
            : "Unknown Doctor";
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString;
        }
    };

    const handlePrint = async () => {
        if (!selectedRecord) return;
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

            // Report Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Consultation Record", 14, startY);

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
            doc.text(getPatientName(selectedRecord), leftColX + 30, yPos);

            doc.setFont("helvetica", "bold");
            doc.text("Date:", rightColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(formatDate(selectedRecord.date || selectedRecord.createdAt), rightColX + 15, yPos);

            yPos += 8;

            // Row 2
            doc.setFont("helvetica", "bold");
            doc.text("Doctor:", leftColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(getDoctorName(selectedRecord), leftColX + 30, yPos);

            doc.setFont("helvetica", "bold");
            doc.text("Ref ID:", rightColX, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(`#${selectedRecord.id.slice(0, 8)}`, rightColX + 15, yPos);

            yPos += 15;

            // Clinical Info
            doc.setFont("helvetica", "bold");
            doc.text("Clinical Assessment", 14, yPos);
            doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
            yPos += 10;

            // Chief Complaint
            doc.setFont("helvetica", "bold");
            doc.text("Chief Complaint:", 14, yPos);
            doc.setFont("helvetica", "normal");
            const splitComplaint = doc.splitTextToSize(selectedRecord.chiefComplaint || '-', pageWidth - 50);
            doc.text(splitComplaint, 50, yPos);
            yPos += (splitComplaint.length * 5) + 5;

            // Diagnosis
            doc.setFont("helvetica", "bold");
            doc.text("Diagnosis:", 14, yPos);
            doc.setFont("helvetica", "normal");
            const splitDiagnosis = doc.splitTextToSize(selectedRecord.diagnosis || '-', pageWidth - 50);
            doc.text(splitDiagnosis, 50, yPos);
            yPos += (splitDiagnosis.length * 5) + 5;

            // Notes
            doc.setFont("helvetica", "bold");
            doc.text("Treatment Notes:", 14, yPos);
            doc.setFont("helvetica", "normal");
            const splitNotes = doc.splitTextToSize(selectedRecord.treatmentNotes || '-', pageWidth - 50);
            doc.text(splitNotes, 50, yPos);
            yPos += (splitNotes.length * 5) + 10;

            // Vitals (if any)
            if (selectedRecord.vitals) {
                const v = selectedRecord.vitals;
                const vitalsData = [
                    ['BP', v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg` : '-'],
                    ['Heart Rate', v.heartRate ? `${v.heartRate} bpm` : '-'],
                    ['Temp', v.temperature ? `${v.temperature} °F` : '-'],
                    ['SpO2', v.oxygenSaturation ? `${v.oxygenSaturation} %` : '-']
                ].filter(item => item[1] !== '-');

                if (vitalsData.length > 0) {
                    // We can put vitals in a simple table or inline
                    // Let's use autoTable for cleanliness
                    autoTable(doc, {
                        ...getTransparentTableStyles(),
                        startY: yPos,
                        head: [['Vitals', 'Value']],
                        body: vitalsData,
                        tableWidth: 80,
                        margin: { left: 14 }
                    });
                    // @ts-ignore
                    yPos = doc.lastAutoTable.finalY + 10;
                }
            }

            // Prescriptions
            if (selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text("Prescriptions", 14, yPos);
                yPos += 5;

                const presRows = selectedRecord.prescriptions.map(p => [
                    p.medicineName,
                    p.dosage,
                    p.frequency,
                    p.duration,
                    p.instructions || '-'
                ]);

                autoTable(doc, {
                    ...getTransparentTableStyles(),
                    startY: yPos,
                    head: [['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
                    body: presRows,
                    columnStyles: { 4: { cellWidth: 50 } }
                });
            }

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Generated on ${format(new Date(), "PPpp")}`, 14, doc.internal.pageSize.height - 10);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: "right" });
            }

            // Print
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
            toast.success("Consultation record opened for printing");

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const columns = [
        {
            key: "date",
            header: "Date",
            render: (r: MedicalRecord) => <span>{formatDate(r.date || r.createdAt)}</span>
        },
        {
            key: "patient",
            header: "Patient",
            render: (r: MedicalRecord) => <span>{getPatientName(r)}</span>
        },
        {
            key: "doctor",
            header: "Doctor",
            render: (r: MedicalRecord) => <span>{getDoctorName(r)}</span>
        },
        { key: "diagnosis", header: "Diagnosis" },
        {
            key: "treatmentNotes",
            header: "Notes",
            render: (r: MedicalRecord) => (
                <span className="truncate max-w-xs block">{r.treatmentNotes}</span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (r: MedicalRecord) => (
                <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(r)}>
                    <Eye className="h-4 w-4" />
                </Button>
            ),
        },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Stethoscope className="h-6 w-6" />
                            OPD Consultations
                        </h1>
                        <p className="text-muted-foreground">History of outpatient consultations</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRecords(true)}
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Consultation Records</CardTitle>
                        <CardDescription>
                            Recent patient visits and diagnoses (auto-refreshes every 30 seconds)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <DataTable
                                data={records}
                                columns={columns}
                                emptyMessage="No consultation records found"
                            />
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="flex flex-row items-start justify-between">
                            <div>
                                <DialogTitle className="text-xl">Consultation Details</DialogTitle>
                                <DialogDescription>
                                    Reference ID: #{selectedRecord?.id.slice(0, 8)}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrint}
                                disabled={isGeneratingPdf}
                            >
                                {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                                Print
                            </Button>
                        </DialogHeader>

                        {selectedRecord && (
                            <div className="space-y-6">
                                {/* Header Info */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Date</div>
                                        <div className="font-medium flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(selectedRecord.date || selectedRecord.createdAt)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Patient</div>
                                        <div className="font-medium flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {getPatientName(selectedRecord)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-sm text-muted-foreground mb-1">Doctor</div>
                                        <div className="font-medium flex items-center gap-2">
                                            <Stethoscope className="w-4 h-4" />
                                            {getDoctorName(selectedRecord)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Clinical Info */}
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                Clinical Assessment
                                            </h3>
                                            <Card className="p-4 space-y-3">
                                                <div>
                                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Chief Complaint</span>
                                                    <p className="text-sm mt-1">{selectedRecord.chiefComplaint || '-'}</p>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Diagnosis</span>
                                                    <p className="text-sm mt-1 font-medium">{selectedRecord.diagnosis}</p>
                                                    {selectedRecord.icdCode && (
                                                        <Badge variant="outline" className="mt-1 text-xs">{selectedRecord.icdCode}</Badge>
                                                    )}
                                                </div>
                                                <Separator />
                                                <div>
                                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Treatment Notes</span>
                                                    <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                                                        {selectedRecord.treatmentNotes || '-'}
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Vitals & Prescriptions */}
                                    <div className="space-y-6">
                                        {selectedRecord.vitals && (
                                            <div>
                                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-green-500" />
                                                    Vitals
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {selectedRecord.vitals.bloodPressureSystolic && (
                                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                                            <div className="text-xs text-muted-foreground">BP</div>
                                                            <div className="font-semibold">
                                                                {selectedRecord.vitals.bloodPressureSystolic}/{selectedRecord.vitals.bloodPressureDiastolic}
                                                                <span className="text-xs font-normal text-muted-foreground"> mmHg</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedRecord.vitals.heartRate && (
                                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                                            <div className="text-xs text-muted-foreground">Heart Rate</div>
                                                            <div className="font-semibold">
                                                                {selectedRecord.vitals.heartRate}
                                                                <span className="text-xs font-normal text-muted-foreground"> bpm</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedRecord.vitals.temperature && (
                                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                                            <div className="text-xs text-muted-foreground">Temperature</div>
                                                            <div className="font-semibold">
                                                                {selectedRecord.vitals.temperature}
                                                                <span className="text-xs font-normal text-muted-foreground"> °F</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedRecord.vitals.oxygenSaturation && (
                                                        <div className="p-3 bg-secondary/50 rounded-lg">
                                                            <div className="text-xs text-muted-foreground">SpO2</div>
                                                            <div className="font-semibold">
                                                                {selectedRecord.vitals.oxygenSaturation}
                                                                <span className="text-xs font-normal text-muted-foreground"> %</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {selectedRecord.prescriptions && selectedRecord.prescriptions.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                    <Pill className="w-4 h-4 text-purple-500" />
                                                    Prescriptions
                                                </h3>
                                                <div className="space-y-2">
                                                    {selectedRecord.prescriptions.map((med, idx) => (
                                                        <div key={idx} className="p-3 border rounded-lg text-sm bg-card hover:bg-accent/50 transition-colors">
                                                            <div className="font-medium text-primary">{med.medicineName}</div>
                                                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                                                <Badge variant="secondary" className="text-[10px] h-5">{med.dosage}</Badge>
                                                                <Badge variant="secondary" className="text-[10px] h-5">{med.frequency}</Badge>
                                                                <Badge variant="secondary" className="text-[10px] h-5">{med.duration}</Badge>
                                                            </div>
                                                            {med.instructions && (
                                                                <div className="text-xs text-muted-foreground mt-2 italic">
                                                                    "{med.instructions}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
