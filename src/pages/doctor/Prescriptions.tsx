import { Eye, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PrescriptionDetailsDialog } from "@/components/medical/PrescriptionDetailsDialog";
import { Prescription, usePrescriptions } from "@/contexts/PrescriptionContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { GeneratePrescriptionDialog } from "@/components/medical/GeneratePrescriptionDialog";

export default function DoctorPrescriptions() {
    const { prescriptions, refreshPrescriptions } = usePrescriptions();
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const handleView = (order: Prescription) => {
        setSelectedPrescription(order);
        setDetailsOpen(true);
    };

    const columns = [
        { key: "order_id", header: "Prescription ID", render: (order: any) => order.order_id.slice(0, 8).toUpperCase() },
        { key: "patient_name", header: "Patient" },
        { key: "diagnosis", header: "Diagnosis" },
        { key: "items", header: "Medicines", render: (order: any) => order.items.map((i: any) => i.medicine_name).join(", ") },
        { key: "status", header: "Status", render: (order: any) => <StatusBadge status={order.status} /> },
        { key: "created_at", header: "Date", render: (order: any) => new Date(order.created_at).toLocaleDateString() },
        {
            key: "actions",
            header: "Actions",
            render: (order: any) => (
                <Button variant="ghost" size="icon" onClick={() => handleView(order)}>
                    <Eye className="h-4 w-4 text-slate-500" />
                </Button>
            )
        }
    ];

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardList className="h-6 w-6" />
                            Prescriptions
                        </h1>
                        <p className="text-muted-foreground">Manage patient prescriptions</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => refreshPrescriptions && refreshPrescriptions()}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <GeneratePrescriptionDialog />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Prescription History</CardTitle>
                        <CardDescription>Recent prescriptions issued</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={prescriptions}
                            columns={columns}
                            emptyMessage="No prescriptions found"
                        />
                    </CardContent>
                </Card>

                <PrescriptionDetailsDialog
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    prescription={selectedPrescription}
                />
            </div>
        </DashboardLayout>
    );
}

