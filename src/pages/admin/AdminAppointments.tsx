import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { appointmentService } from "@/services/appointmentService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AppointmentBookingDialog } from "@/components/appointments/AppointmentBookingDialog";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useEffect, useState } from "react";
import { Appointment } from "@/types";
import { toast } from "sonner";

export default function AdminAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await appointmentService.getAppointments();
                setAppointments(data);
            } catch (error) {
                console.error("Failed to fetch appointments:", error);
                toast.error("Failed to load appointments");
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []); // Empty dependency array ensures run once on mount

    const fetchAppointments = async () => {
        try {
            const data = await appointmentService.getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        console.log('[AdminAppointments] Attempting to delete appointment with ID:', id);
        if (!id) {
            console.error('[AdminAppointments] No ID provided for deletion');
            toast.error('Invalid ID for deletion');
            return;
        }
        try {
            await appointmentService.deleteAppointment(id);
            toast.success("Appointment deleted successfully");
            fetchAppointments();
        } catch (error) {
            console.error("Failed to delete appointment:", error);
        }
    };

    const columns = [
        { key: "date", header: "Date" },
        { key: "time", header: "Time" },
        { key: "patient_name", header: "Patient" },
        { key: "doctor_name", header: "Doctor" },
        { key: "department", header: "Department" },
        { key: "type", header: "Type", render: (apt: any) => <span className="capitalize">{apt.type.replace('_', ' ')}</span> },
        { key: "status", header: "Status", render: (apt: any) => <StatusBadge status={apt.status} /> },
        {
            key: "actions",
            header: "Actions",
            className: "text-right",
            render: (apt: any) => (
                <div className="flex items-center justify-end gap-2">
                    <AppointmentDetailsDialog appointmentId={apt.id}>
                        <Button variant="ghost" size="icon" title="View Details">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </AppointmentDetailsDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove this appointment record. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(apt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )
        }
    ];

    if (loading) {
        return <div className="p-8 text-center">Loading appointments...</div>;
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            Appointments
                        </h1>
                        <p className="text-muted-foreground">View all scheduled appointments</p>
                    </div>

                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointment Schedule</CardTitle>
                        <CardDescription>List of all appointments across departments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={appointments}
                            columns={columns}
                            emptyMessage="No appointments found"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
