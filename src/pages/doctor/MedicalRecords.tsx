import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationDetailsDialog } from "@/components/medical/ConsultationDetailsDialog";
import { AddMedicalRecordDialog } from "@/components/medical/AddMedicalRecordDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export default function MedicalRecords() {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();

    const fetchRecords = useCallback(async (showRefreshToast = false) => {
        try {
            if (showRefreshToast) setRefreshing(true);
            const data = await medicalRecordService.getRecords();
            setRecords(data);
            if (showRefreshToast) toast.success("Records refreshed");
        } catch (error) {
            console.error("Failed to fetch medical records:", error);
            toast.error("Failed to load medical records");
            setRecords([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const getPatientName = (record: MedicalRecord) => {
        return record.patient
            ? `${record.patient.firstName} ${record.patient.lastName}`.trim()
            : "Unknown";
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy');
        } catch {
            return dateString;
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
        { key: "diagnosis", header: "Diagnosis" },
        {
            key: "treatmentNotes",
            header: "Treatment",
            render: (r: MedicalRecord) => (
                <span className="truncate max-w-xs block">{r.treatmentNotes}</span>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (r: MedicalRecord) => (
                <ConsultationDetailsDialog recordId={r.id}>
                    <Button variant="link" size="sm">View Details</Button>
                </ConsultationDetailsDialog>
            )
        },
    ];

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Medical Records
                        </h1>
                        <p className="text-muted-foreground">Patient history and diagnosis records</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRecords(true)}
                            disabled={refreshing}
                        >
                            {refreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">Refresh</span>
                        </Button>
                        <AddMedicalRecordDialog onSuccess={() => fetchRecords()}>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Record
                            </Button>
                        </AddMedicalRecordDialog>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Records</CardTitle>
                        <CardDescription>Latest medical entries</CardDescription>
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
                                emptyMessage="No records found"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
