import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { appointmentService } from "@/services/appointmentService";
import { Appointment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { toast } from "sonner";

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchAppointments = async () => {
        try {
            const data = await appointmentService.getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleMarkComplete = async (appointmentId: string) => {
        setUpdatingId(appointmentId);
        try {
            await appointmentService.updateAppointmentStatus(appointmentId, 'completed');
            toast.success("Appointment marked as completed");
            // Refresh the appointments list
            await fetchAppointments();
        } catch (error) {
            console.error("Failed to update appointment status", error);
            toast.error("Failed to update appointment status");
        } finally {
            setUpdatingId(null);
        }
    };

    const columns = [
        { key: "date", header: "Date" },
        { key: "time", header: "Time" },
        { key: "patient_name", header: "Patient" },
        { key: "type", header: "Type", render: (apt: any) => <span className="capitalize">{apt.type.replace('_', ' ')}</span> },
        { key: "status", header: "Status", render: (apt: any) => <StatusBadge status={apt.status} /> },
        { key: "notes", header: "Notes" },
        {
            key: "actions",
            header: "Actions",
            render: (apt: Appointment) => (
                apt.status === 'scheduled' || apt.status === 'in_progress' ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleMarkComplete(apt.id)}
                        disabled={updatingId === apt.id}
                    >
                        {updatingId === apt.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        Mark Complete
                    </Button>
                ) : apt.status === 'completed' ? (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                    </span>
                ) : null
            )
        },
    ];

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        My Appointments
                    </h1>
                    <p className="text-muted-foreground">Manage your schedule and consultations</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                        <CardDescription>Upcoming appointments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center p-4">Loading...</div>
                        ) : (
                            <DataTable
                                data={appointments}
                                columns={columns}
                                emptyMessage="No appointments found"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
