import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { appointments } from "@/data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AppointmentBookingDialog } from "@/components/appointments/AppointmentBookingDialog";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetailsDialog";

export default function OPDAppointments() {
    const opdAppointments = appointments; // Showing all appointments as OPD for now

    const columns = [
        { key: "appointment_id", header: "Appt ID" },
        { key: "date", header: "Date" },
        { key: "time", header: "Time" },
        { key: "patient_name", header: "Patient" },
        { key: "doctor_name", header: "Doctor" },
        { key: "department", header: "Department" },
        { key: "status", header: "Status", render: (apt: any) => <StatusBadge status={apt.status} /> },
        {
            key: "actions",
            header: "Actions",
            render: (apt: any) => (
                <AppointmentDetailsDialog appointmentId={apt.id}>
                    <Button variant="ghost" size="sm">View</Button>
                </AppointmentDetailsDialog>
            )
        }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            OPD Appointments
                        </h1>
                        <p className="text-muted-foreground">Manage outpatient appointments schedule</p>
                    </div>
                    <AppointmentBookingDialog>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Book Appointment
                        </Button>
                    </AppointmentBookingDialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointment List</CardTitle>
                        <CardDescription>Upcoming and today's appointments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={opdAppointments}
                            columns={columns}
                            emptyMessage="No OPD appointments found"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
