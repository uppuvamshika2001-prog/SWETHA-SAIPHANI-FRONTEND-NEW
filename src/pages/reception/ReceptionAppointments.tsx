import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppointmentBookingDialog } from '@/components/appointments/AppointmentBookingDialog';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { Appointment } from '@/types';

export default function ReceptionAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredAppointments = appointments.filter(apt =>
        apt.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        apt.doctor_name.toLowerCase().includes(search.toLowerCase()) ||
        apt.appointment_id.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        {
            key: 'patient_name',
            header: 'Patient',
            render: (apt: Appointment) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {apt.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{apt.patient_id}</p>
                    </div>
                </div>
            )
        },
        { key: 'doctor_name', header: 'Doctor' },
        { key: 'date', header: 'Date' },
        { key: 'time', header: 'Time' },
        {
            key: 'status',
            header: 'Status',
            render: (apt: Appointment) => (
                <StatusBadge status={apt.status} />
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (apt: Appointment) => (
                <AppointmentDetailsDialog appointmentId={apt.id}>
                    <Button variant="ghost" size="sm">View Details</Button>
                </AppointmentDetailsDialog>
            )
        }
    ];

    return (
        <DashboardLayout role="receptionist">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-6 w-6" />
                            Appointments
                        </h1>
                        <p className="text-muted-foreground">Manage and schedule appointments</p>
                    </div>
                    <AppointmentBookingDialog onBook={() => fetchAppointments()}>
                        <Button>
                            <Calendar className="h-4 w-4 mr-2" />
                            Book New Appointment
                        </Button>
                    </AppointmentBookingDialog>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Appointments</CardTitle>
                                <CardDescription>Scheduled visits list</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={fetchAppointments} title="Refresh">
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search appointments..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={filteredAppointments}
                            columns={columns}
                            emptyMessage={loading ? "Loading appointments..." : "No appointments found"}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
