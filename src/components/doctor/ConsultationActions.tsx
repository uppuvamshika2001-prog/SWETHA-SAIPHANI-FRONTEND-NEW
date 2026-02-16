import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Download, Printer, Loader2 } from "lucide-react";
import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { ConsultationDetailsDialog } from "@/components/medical/ConsultationDetailsDialog";
import { generateConsultationPDF } from "@/utils/consultationUtils";
import { toast } from "sonner";
import { Patient } from "@/types";

interface ConsultationActionsProps {
    patient: Patient;
}

export function ConsultationActions({ patient }: ConsultationActionsProps) {
    const [loading, setLoading] = useState(false);
    const [latestRecord, setLatestRecord] = useState<MedicalRecord | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchLatestRecord = async () => {
        if (latestRecord) return latestRecord;

        setLoading(true);
        try {
            const records = await medicalRecordService.getPatientRecords(patient.uhid || patient.id);
            if (records && records.length > 0) {
                // Sort by date descending to get the latest
                const sorted = [...records].sort((a, b) =>
                    new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
                );
                setLatestRecord(sorted[0]);
                return sorted[0];
            }
            toast.info("No medical records available for this patient");
            return null;
        } catch (error) {
            console.error("Failed to fetch records:", error);
            toast.error("Failed to load medical records");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleView = async () => {
        const record = await fetchLatestRecord();
        if (record) {
            setIsDialogOpen(true);
        }
    };

    const handleAction = async (action: 'download' | 'print') => {
        const record = await fetchLatestRecord();
        if (record) {
            generateConsultationPDF(record, { action });
        }
    };

    return (
        <div className="flex items-center gap-1">

            <Button
                variant="ghost"
                size="icon"
                title="Download Report"
                onClick={() => handleAction('download')}
                disabled={loading}
            >
                <Download className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                title="Print Report"
                onClick={() => handleAction('print')}
                disabled={loading}
            >
                <Printer className="h-4 w-4" />
            </Button>

            <ConsultationDetailsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialRecord={latestRecord}
            />
        </div>
    );
}
