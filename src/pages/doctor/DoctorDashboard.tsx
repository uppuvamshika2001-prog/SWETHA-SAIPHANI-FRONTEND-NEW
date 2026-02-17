import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  Users,
  FileText,
  FlaskConical,
  Clock,
  ArrowUpRight,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import { StatsCardSkeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatients } from '@/contexts/PatientContext';
import { useLab } from '@/contexts/LabContext';
import { appointmentService } from '@/services/appointmentService';
import { Appointment, Patient } from '@/types';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use shared contexts instead of direct API calls to avoid duplicate fetches
  const { patients, loading: patientsLoading } = usePatients();
  const { myLabOrders, loading: labLoading } = useLab();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch appointments - patients and lab orders come from contexts
        const fetchedAppointments = await appointmentService.getAppointments();

        // Filter appointments for this doctor
        const myAppointments = user?.id
          ? fetchedAppointments.filter((a: any) => a.doctorId === user.id || a.doctor_id === user.id)
          : fetchedAppointments;

        setAppointments(myAppointments);
      } catch (error) {
        console.error("Failed to fetch doctor dashboard data", error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, toast]);

  // Combined loading state
  const isLoading = loading || patientsLoading || labLoading;


  const todayAppointments = appointments.filter(
    (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  // Lab orders processing status (using myLabOrders from context)
  // Valid statuses: "ordered", "sample_collected", "completed", "cancelled"
  const pendingLabResults = myLabOrders.filter((t) => t.status === 'ORDERED' || t.status === 'SAMPLE_COLLECTED').length;
  const scheduledAppointments = appointments.filter((a) => a.status === 'scheduled').length;
  const myPatients = patients.slice(0, 8);

  const upcomingAppointments = todayAppointments.slice(0, 5);

  const appointmentColumns = [
    {
      key: 'patient_name',
      header: 'Patient',
      render: (apt: Appointment) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {apt.patient_name ? apt.patient_name.split(' ').map((n: string) => n[0]).join('') : 'P'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{apt.patient_name}</span>
        </div>
      )
    },
    { key: 'time', header: 'Time' },
    { key: 'type', header: 'Type' },
    {
      key: 'status',
      header: 'Status',
      render: (apt: Appointment) => (
        <StatusBadge status={apt.status} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (apt: Appointment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/doctor/consultation/${apt.id}`)}
        >
          Start Consultation
        </Button>
      )
    }
  ];

  const patientColumns = [
    {
      key: 'full_name',
      header: 'Name',
      render: (patient: Patient) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {patient.full_name ? patient.full_name.split(' ').map((n: string) => n[0]).join('') : 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{patient.full_name}</p>
            <p className="text-xs text-muted-foreground">ID: {patient.uhid}</p>
          </div>
        </div>
      )
    },
    { key: 'age', header: 'Age' },
    { key: 'blood_group', header: 'Blood Group' },
    {
      key: 'status',
      header: 'Status',
      render: (patient: Patient) => (
        <StatusBadge status={patient.status} />
      )
    },
  ];

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good Morning, Doctor</h1>
            <p className="text-muted-foreground">
              You have {todayAppointments.length} appointments scheduled for today
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/doctor/appointments')}>
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
            <Button size="sm" onClick={() => {
              if (upcomingAppointments.length > 0) {
                navigate(`/doctor/consultation/${upcomingAppointments[0].id}`);
              } else {
                toast({
                  title: "No Appointments",
                  description: "You have no appointments scheduled for today.",
                  variant: "default"
                });
              }
            }}>
              <Stethoscope className="h-4 w-4 mr-2" />
              Start Next Consultation
            </Button>
          </div>
        </div>

        {/* Modules Grid - Quick Access */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { title: 'My Appointments', icon: <Calendar className="h-5 w-5" />, path: '/doctor/appointments', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { title: 'My Patients', icon: <Users className="h-5 w-5" />, path: '/doctor/patients', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { title: 'Medical Records', icon: <FileText className="h-5 w-5" />, path: '/doctor/records', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { title: 'Prescriptions', icon: <ClipboardList className="h-5 w-5" />, path: '/doctor/prescriptions', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { title: 'Lab Results', icon: <FlaskConical className="h-5 w-5" />, path: '/doctor/lab-results', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          ].map((module) => (
            <Card key={module.path} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(module.path)}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className={`p-2 rounded-full ${module.bg}`}>
                  <div className={module.color}>{module.icon}</div>
                </div>
                <span className="text-xs font-medium">{module.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatsCard
                title="Today's Appointments"
                value={todayAppointments.length}
                icon={<Calendar className="h-5 w-5" />}
                description="Scheduled for today"
                variant="primary"
                onClick={() => navigate('/doctor/appointments')}
              />
              <StatsCard
                title="Pending Consultations"
                value={scheduledAppointments}
                icon={<Clock className="h-5 w-5" />}
                description="Awaiting your attention"
                onClick={() => navigate('/doctor/appointments')}
              />
              <StatsCard
                title="My Patients"
                value={patients.length} // Use total patients count
                icon={<Users className="h-5 w-5" />}
                description="Under your care"
                onClick={() => navigate('/doctor/patients')}
              />
              <StatsCard
                title="Lab Results to Review"
                value={pendingLabResults}
                icon={<FlaskConical className="h-5 w-5" />}
                description="New results available"
                variant="warning"
                onClick={() => navigate('/doctor/lab-results')}
              />
            </>
          )}
        </div>

        {/* Today's Schedule */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Appointments
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/doctor/appointments')}>
              View Full Schedule <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={upcomingAppointments}
              columns={appointmentColumns}
              emptyMessage="No appointments scheduled for today"
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Quick Actions & Patients */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/doctor/prescriptions')}>
                <FileText className="h-4 w-4 mr-2" />
                Write Prescription
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/doctor/lab-results')}>
                <FlaskConical className="h-4 w-4 mr-2" />
                Order Lab Test
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/doctor/patients')}>
                <Users className="h-4 w-4 mr-2" />
                Refer Patient
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/doctor/records')}>
                <FileText className="h-4 w-4 mr-2" />
                Add Clinical Notes
              </Button>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card className="lg:col-span-2 glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">My Patients</CardTitle>
                <CardDescription>Recently consulted patients</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={myPatients.slice(0, 4)}
                columns={patientColumns}
                emptyMessage="No patients found"
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pending Lab Results */}
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-warning" />
              Pending Lab Results
            </CardTitle>
            <CardDescription>Results requiring your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myLabOrders.filter(t => t.status === 'ORDERED' || t.status === 'SAMPLE_COLLECTED').slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                  <div>
                    <p className="font-medium">{order.patient?.firstName} {order.patient?.lastName}</p>
                    <p className="text-sm text-muted-foreground">{order.testName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status.toLowerCase()} />
                    <Button variant="ghost" size="sm">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
