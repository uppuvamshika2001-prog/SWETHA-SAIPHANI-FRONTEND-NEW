import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Calendar,
    User,
    Stethoscope,
    Pill,
    Activity,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { format } from "date-fns";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateConsultationPDF } from "@/utils/consultationUtils";
import { Download, Printer } from "lucide-react";

interface ConsultationDetailsDialogProps {
    children?: React.ReactNode;
    recordId?: string;
    initialRecord?: MedicalRecord | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ConsultationDetailsDialog({
    children,
    recordId,
    initialRecord = null,
    open,
    onOpenChange
}: ConsultationDetailsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = (newOpen: boolean) => {
        if (onOpenChange) onOpenChange(newOpen);
        else setInternalOpen(newOpen);
    };

    const [record, setRecord] = useState<MedicalRecord | null>(initialRecord);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (initialRecord) {
            setRecord(initialRecord);
        }
    }, [initialRecord]);

    useEffect(() => {
        if (showOpen && recordId && !initialRecord) {
            const fetchRecord = async () => {
                setLoading(true);
                setError("");
                try {
                    const data = await medicalRecordService.getRecordById(recordId);
                    setRecord(data);
                } catch (err) {
                    console.error("Failed to fetch medical record:", err);
                    setError("Failed to load consultation details.");
                    toast.error("Could not load medical record details");
                } finally {
                    setLoading(false);
                }
            };
            fetchRecord();
        }
    }, [showOpen, recordId]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'dd MMM yyyy, h:mm a');
        } catch {
            return dateString;
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>Loading consultation record...</p>
                    </div>
                ) : error ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-destructive p-6 text-center">
                        <AlertCircle className="h-8 w-8" />
                        <p>{error}</p>
                        <Button variant="outline" onClick={() => setShowOpen(false)}>Close</Button>
                    </div>
                ) : record ? (
                    <>
                        <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Medical Consultation Record
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 flex items-center gap-3">
                                        <Badge variant="outline" className="gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(record.date || record.createdAt)}
                                        </Badge>
                                        <Badge variant="secondary" className="gap-1">
                                            OPD Consultation
                                        </Badge>
                                    </DialogDescription>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    <div className="font-medium text-foreground">
                                        Dr. {record.doctor.firstName} {record.doctor.lastName}
                                    </div>
                                    <div className="text-xs">Attending Physician</div>
                                </div>
                            </div>
                        </DialogHeader>

                        <ScrollArea className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Patient Information Card */}
                                <Card className="border-l-4 border-l-primary/50 shadow-sm bg-card">
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                            {/* Patient Name & Avatar */}
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                    {getInitials(record.patient.firstName, record.patient.lastName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Patient</p>
                                                    <p className="font-semibold text-lg truncate">
                                                        {record.patient.firstName} {record.patient.lastName}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* IDs Section - Flex wrapper to keep them together but wrap on small screens */}
                                            <div className="flex flex-wrap gap-8 items-center">
                                                <div className="min-w-[100px]">
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Patient ID</p>
                                                    <p className="font-medium font-mono text-sm tracking-tight">{record.patientId.toUpperCase()}</p>
                                                </div>
                                                <div className="min-w-[100px]">
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Record ID</p>
                                                    <p className="font-medium font-mono text-sm text-muted-foreground tracking-tight">#{record.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="gap-2 shrink-0 hidden sm:flex" disabled>
                                                    <Activity className="h-4 w-4" />
                                                    Vitals History
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left Column: Assessment */}
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Symptoms & Vitals Section */}
                                        <section>
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                                <Stethoscope className="h-4 w-4" />
                                                Symptoms & Vitals
                                            </h3>
                                            <Card>
                                                <CardContent className="p-4 space-y-4">
                                                    <div>
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase">Chief Complaint / Symptoms</span>
                                                        <p className="mt-1 text-sm leading-relaxed">
                                                            {record.chiefComplaint || "No symptoms recorded."}
                                                        </p>
                                                    </div>

                                                    {record.vitals && (
                                                        <>
                                                            <Separator />
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                                                {record.vitals.bloodPressureSystolic && (
                                                                    <div className="bg-muted/30 p-2 rounded-md">
                                                                        <span className="text-xs text-muted-foreground block">Blood Pressure</span>
                                                                        <span className="font-semibold text-sm">
                                                                            {record.vitals.bloodPressureSystolic}/{record.vitals.bloodPressureDiastolic} mmHg
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {record.vitals.heartRate && (
                                                                    <div className="bg-muted/30 p-2 rounded-md">
                                                                        <span className="text-xs text-muted-foreground block">Heart Rate</span>
                                                                        <span className="font-semibold text-sm">{record.vitals.heartRate} bpm</span>
                                                                    </div>
                                                                )}
                                                                {record.vitals.temperature && (
                                                                    <div className="bg-muted/30 p-2 rounded-md">
                                                                        <span className="text-xs text-muted-foreground block">Temperature</span>
                                                                        <span className="font-semibold text-sm">{record.vitals.temperature}°F</span>
                                                                    </div>
                                                                )}
                                                                {record.vitals.weight && (
                                                                    <div className="bg-muted/30 p-2 rounded-md">
                                                                        <span className="text-xs text-muted-foreground block">Weight</span>
                                                                        <span className="font-semibold text-sm">{record.vitals.weight} kg</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </section>

                                        {/* Diagnosis Section */}
                                        <section>
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                                <Activity className="h-4 w-4" />
                                                Diagnosis
                                            </h3>
                                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
                                                <p className="font-medium text-lg text-blue-900 dark:text-blue-100">
                                                    {record.diagnosis}
                                                </p>
                                                {record.icdCode && (
                                                    <Badge className="mt-2" variant="outline">{record.icdCode}</Badge>
                                                )}
                                            </div>
                                        </section>

                                        {/* Treatment Information */}
                                        <section>
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                                <FileText className="h-4 w-4" />
                                                Treatment Plan & Notes
                                            </h3>
                                            <Card>
                                                <CardContent className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {record.treatmentNotes || "No treatment notes recorded."}
                                                </CardContent>
                                            </Card>
                                        </section>
                                    </div>

                                    {/* Right Column: Prescriptions */}
                                    <div className="md:col-span-1">
                                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                            <Pill className="h-4 w-4" />
                                            Prescriptions
                                        </h3>
                                        {record.prescriptions && record.prescriptions.length > 0 ? (
                                            <div className="space-y-3">
                                                {record.prescriptions.map((med, idx) => (
                                                    <Card key={idx} className="overflow-hidden border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                                                        <CardContent className="p-3">
                                                            <div className="font-semibold text-base">{med.medicineName}</div>
                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                {med.dosage} • {med.frequency}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-2 text-xs">
                                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                                <span>{med.duration}</span>
                                                            </div>
                                                            {med.instructions && (
                                                                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground italic">
                                                                    "{med.instructions}"
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground text-center p-8 bg-muted/20 rounded-lg border border-dashed">
                                                No prescriptions ordered
                                            </div>
                                        )}

                                        {/* Lab Orders Section if available */}
                                        {record.labOrders && record.labOrders.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                                    <Activity className="h-4 w-4" />
                                                    Lab Orders
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {record.labOrders.map((lab, idx) => (
                                                        <Badge key={idx} variant="secondary" className="px-3 py-1">
                                                            {lab}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-4 text-xs text-muted-foreground mr-auto">
                                <span>Created: {formatDate(record.createdAt)}</span>
                                {record.updatedAt && record.updatedAt !== record.createdAt && (
                                    <span>Updated: {formatDate(record.updatedAt)}</span>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 flex-1 sm:flex-initial"
                                    onClick={() => generateConsultationPDF(record, { action: 'print' })}
                                >
                                    <Printer className="h-4 w-4" />
                                    Print
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 flex-1 sm:flex-initial"
                                    onClick={() => generateConsultationPDF(record, { action: 'download' })}
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </Button>
                                <Button size="sm" onClick={() => setShowOpen(false)} className="flex-1 sm:flex-initial">Close Record</Button>
                            </div>
                        </div>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
