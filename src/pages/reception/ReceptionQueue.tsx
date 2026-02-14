import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { appointments } from '@/data/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ReceptionQueue() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { toast } = useToast();
    // In a real app, you'd filter by today's date properly.
    // For demo, we'll just take a slice or use mock dates if they align.
    const [queueItems, setQueueItems] = useState(appointments.filter(a => a.status === 'scheduled' || a.status === 'checked_in'));

    const handleCheckIn = (id: string) => {
        setQueueItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: 'checked_in' } : item
        ));
        toast({
            title: "Check-in Successful",
            description: "Patient status updated to Checked In",
        });
    };

    const columns = [
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
                        <p className="text-xs text-muted-foreground">Token: #{apt.id.slice(-4)}</p>
                    </div>
                </div>
            )
        },
        { key: 'time', header: 'Appointment Time' },
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
            header: 'Actions',
            render: (apt: typeof appointments[0]) => (
                <div className="flex gap-2">
                    {apt.status === 'scheduled' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleCheckIn(apt.id)}
                        >
                            Check In
                        </Button>
                    )}
                    <AppointmentDetailsDialog appointmentId={apt.id}>
                        <Button variant="ghost" size="sm" className="h-8">View Details</Button>
                    </AppointmentDetailsDialog>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout role="receptionist">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="h-6 w-6" />
                        Check-In Queue
                    </h1>
                    <p className="text-muted-foreground">Manage today's patient flow and check-ins</p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Today's Queue</CardTitle>
                                <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search queue..." className="pl-8" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={queueItems}
                            columns={columns}
                            emptyMessage="No patients in queue"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
