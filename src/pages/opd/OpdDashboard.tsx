import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { appointments } from '@/data/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Calendar,
    Users,
    Clock,
    UserPlus,
    ArrowUpRight,
    Receipt,
    Search,
    Activity,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { PatientRegistrationDialog } from '@/components/patients/PatientRegistrationDialog';
import { AppointmentBookingDialog } from '@/components/appointments/AppointmentBookingDialog';
import { BillGenerationDialog } from '@/components/billing/BillGenerationDialog';
import { useNavigate } from 'react-router-dom';
import { FollowUpDialog } from '@/components/opd/FollowUpDialog';

import { usePatients } from "@/contexts/PatientContext";

export default function OpdDashboard() {
    const navigate = useNavigate();
    const { patients } = usePatients();
    const todayAppointments = appointments.filter(
        (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    );

    // Mock stats for OPD
    const totalOpdPatients = patients.length;
    const pendingBills = todayAppointments.filter(a => a.status === 'completed').length; // Mock logic
    const activeConsultations = todayAppointments.filter(a => a.status === 'in_progress').length;

    const appointmentColumns = [
        {
            key: 'patient_name',
            header: 'Patient',
            render: (apt: typeof appointments[0]) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {apt.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {apt.patient_id}</p>
                    </div>
                </div>
            )
        },
        { key: 'department', header: 'Department' },
        { key: 'doctor_name', header: 'Doctor' },
        {
            key: 'status',
            header: 'Status',
            render: (apt: typeof appointments[0]) => (
                <StatusBadge status={apt.status} />
            )
        },
        {
            key: 'actions',
            header: '',
            render: (apt: typeof appointments[0]) => (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/doctor/consultation/${apt.id}`)}>
                    View
                </Button>
            )
        }
    ];

    return (
        <DashboardLayout role="admin"> {/* Changed to admin role as requested */}
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">OPD Management</h1>
                        <p className="text-muted-foreground">
                            Out-Patient Department Administration
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <PatientRegistrationDialog>
                            <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                New Registration
                            </Button>
                        </PatientRegistrationDialog>
                    </div>
                </div>

                {/* Quick Search */}
                <Card className="glass">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search OPD patients by name, UHID, or mobile..."
                                    className="pl-10"
                                />
                            </div>
                            <AppointmentBookingDialog>
                                <Button variant="outline">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Book Visit
                                </Button>
                            </AppointmentBookingDialog>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Today's OP Visits"
                        value={todayAppointments.length}
                        icon={<Users className="h-5 w-5" />}
                        description="Total registrations today"
                        variant="primary"
                    />
                    <StatsCard
                        title="Active Consultations"
                        value={activeConsultations}
                        icon={<Activity className="h-5 w-5" />}
                        description="Doctors currently seeing patients"
                        variant="success"
                    />
                    <StatsCard
                        title="Pending Bills"
                        value={pendingBills}
                        icon={<Receipt className="h-5 w-5" />}
                        description="Consultations awaiting billing"
                        variant="warning"
                    />
                    <StatsCard
                        title="Total Patients"
                        value={totalOpdPatients}
                        icon={<FileText className="h-5 w-5" />}
                        description="Registered in OPD database"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="glass lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <PatientRegistrationDialog>
                                <Button variant="outline" className="h-24 flex-col gap-3 hover:border-primary hover:bg-primary/5">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                                        <UserPlus className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">Registration</span>
                                </Button>
                            </PatientRegistrationDialog>

                            <AppointmentBookingDialog>
                                <Button variant="outline" className="h-24 flex-col gap-3 hover:border-primary hover:bg-primary/5">
                                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">Appointments</span>
                                </Button>
                            </AppointmentBookingDialog>

                            <BillGenerationDialog>
                                <Button variant="outline" className="h-24 flex-col gap-3 hover:border-primary hover:bg-primary/5">
                                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                                        <Receipt className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">Billing</span>
                                </Button>
                            </BillGenerationDialog>

                            <FollowUpDialog>
                                <Button variant="outline" className="h-24 flex-col gap-3 hover:border-primary hover:bg-primary/5">
                                    <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <span className="font-medium">Follow-ups</span>
                                </Button>
                            </FollowUpDialog>

                        </CardContent>
                    </Card>
                </div>

                {/* Recent OPD Visits */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Recent OPD Visits
                            </CardTitle>
                            <CardDescription>Patients visited today</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                            View All <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={todayAppointments}
                            columns={appointmentColumns}
                            emptyMessage="No OPD visits recorded today"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
