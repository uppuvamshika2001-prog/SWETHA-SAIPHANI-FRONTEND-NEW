import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserCheck,
  Calendar,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReportDetailsDialog } from "@/components/admin/ReportDetailsDialog";

import { usePatients } from "@/contexts/PatientContext";
import { useEffect, useState } from 'react';
import { appointmentService } from '@/services/appointmentService';
import { staffService } from '@/services/staffService';
import { billingService, Bill } from '@/services/billingService';
import { patientService } from '@/services/patientService';
import { Appointment, StaffMember, Patient } from '@/types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  // const { patients } = usePatients(); // Use API for this too if possible, but context is okay for now if it fetches real data. 
  // However, PatientContext usually fetches its own data. 
  // Let's assume PatientContext is not yet fully using API for *all* patients list in a way scalable for admin dashboard stats if it loads everything.
  // Actually, let's fetch counts directly if possible or compute from lists.

  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [fetchedAppointments, fetchedStaff, fetchedBills, fetchedPatients] = await Promise.all([
        appointmentService.getAppointments(),
        staffService.getStaff(),
        billingService.getBills(),
        patientService.getPatients()
      ]);
      setAppointments(fetchedAppointments);
      setStaff(fetchedStaff);
      setBills(fetchedBills.items || []);
      // Handle paginated or array response for patients
      const patientsData: any = fetchedPatients;
      setPatients(Array.isArray(patientsData) ? patientsData : (patientsData.items || []));
      setLastUpdated(new Date());

      // Update current date reference
      const today = format(new Date(), 'yyyy-MM-dd');
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Polling every 30 seconds for "live" data
    const pollingInterval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    // Check for day change every minute to update the "Today" reference
    const dateInterval = setInterval(() => {
      const now = format(new Date(), 'yyyy-MM-dd');
      if (now !== currentDate) {
        console.log("Day changed, refreshing dashboard...");
        fetchDashboardData(true);
      }
    }, 60000);

    return () => {
      clearInterval(pollingInterval);
      clearInterval(dateInterval);
    };
  }, [currentDate]);

  const todayAppointments = appointments.filter(
    (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === currentDate
  );

  // Using real patient count from API - filtering for today's registrations
  const activePatientsToday = patients.filter(
    (p) => p.status === 'active' && format(new Date(p.created_at || ''), 'yyyy-MM-dd') === currentDate
  ).length;

  const activeDoctors = staff.filter((d) => d.role === 'doctor' && d.status === 'active').length;

  // Total pending bills across all dates (usually important for admin)
  const pendingBillsTotal = bills.filter((b) => b.status === 'PENDING').length;

  // Pending appointments today
  const pendingAppointmentsToday = appointments.filter(
    (a) => a.status === 'scheduled' && format(new Date(a.date), 'yyyy-MM-dd') === currentDate
  ).length;

  // Calculate today's revenue from paid bills created today
  const todayRevenue = bills
    .filter((b) => b.status === 'PAID' && format(new Date(b.createdAt), 'yyyy-MM-dd') === currentDate)
    .reduce((sum, b) => sum + Number(b.grandTotal || 0), 0);

  const recentAppointments = appointments.slice(0, 5);
  const recentBills = bills.slice(0, 5);


  const appointmentColumns = [
    { key: 'patient_name', header: 'Patient' },
    { key: 'doctor_name', header: 'Doctor' },
    {
      key: 'time',
      header: 'Time',
      render: (apt: typeof appointments[0]) => (
        <span className="text-muted-foreground">{apt.time}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (apt: typeof appointments[0]) => (
        <StatusBadge status={apt.status} />
      )
    },
  ];

  const billColumns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (bill: typeof bills[0]) => (
        <span>{bill.patient?.firstName} {bill.patient?.lastName}</span>
      )
    },
    {
      key: 'grandTotal',
      header: 'Amount',
      render: (bill: typeof bills[0]) => (
        <span className="font-medium">₹{Number(bill.grandTotal).toLocaleString()}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (bill: typeof bills[0]) => (
        <StatusBadge status={bill.status.toLowerCase() as any} />
      )
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hospital Overview</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50"></span>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3 animate-pulse text-green-500" />
                Live: {format(lastUpdated, 'HH:mm:ss')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Hospital Schedule</DialogTitle>
                  <DialogDescription>
                    Overview of today's shifts and appointments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Doctor Shifts</h3>
                    <div className="grid gap-2">
                      {staff.filter(d => d.role === 'doctor' && d.status === 'active').map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span>{doc.full_name}</span>
                            <span className="text-xs text-muted-foreground">({doc.department})</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">09:00 - 17:00</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <ReportDetailsDialog>
              <Button size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </ReportDetailsDialog>
          </div>
        </div>

        {/* Modules Grid - Quick Access */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { title: 'Staff', icon: <UserCheck className="h-5 w-5" />, path: '/admin/staff', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { title: 'Patients', icon: <Users className="h-5 w-5" />, path: '/admin/patients', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { title: 'Appts', icon: <Calendar className="h-5 w-5" />, path: '/admin/appointments', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { title: 'Depts', icon: <Activity className="h-5 w-5" />, path: '/admin/departments', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { title: 'Billing', icon: <IndianRupee className="h-5 w-5" />, path: '/admin/billing', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
            { title: 'Reports', icon: <TrendingUp className="h-5 w-5" />, path: '/admin/reports', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
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
          <StatsCard
            title="New Patients"
            value={activePatientsToday}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
            description="Registered today"
          />
          <StatsCard
            title="Doctors on Duty"
            value={activeDoctors}
            icon={<UserCheck className="h-5 w-5" />}
            description="Available for consultations"
            variant="primary"
          />
          <StatsCard
            title="Today's Appointments"
            value={todayAppointments.length}
            icon={<Calendar className="h-5 w-5" />}
            trend={{ value: 5, isPositive: true }}
            description="Scheduled for today"
          />
          <StatsCard
            title="Today's Revenue"
            value={`₹${todayRevenue.toLocaleString()}`}
            icon={<IndianRupee className="h-5 w-5" />}
            trend={{ value: 8.2, isPositive: true }}
            description="From paid bills"
            variant="success"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatsCard
            title="Pending Bills"
            value={pendingBillsTotal}
            icon={<AlertTriangle className="h-5 w-5" />}
            description="Awaiting payment (total)"
            variant="warning"
          />
          <StatsCard
            title="Pending Appointments"
            value={pendingAppointmentsToday}
            icon={<Activity className="h-5 w-5" />}
            description="Today's pending check-ins"
            variant="destructive"
          />
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Appointments */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Appointments</CardTitle>
                <CardDescription>Today's scheduled consultations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentAppointments}
                columns={appointmentColumns}
                emptyMessage="No appointments scheduled"
              />
            </CardContent>
          </Card>

          {/* Recent Bills */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Bills</CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentBills}
                columns={billColumns}
                emptyMessage="No bills found"
              />
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingBillsTotal > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    <span className="text-sm">{pendingBillsTotal} bills pending payment</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/billing')}>Review</Button>
                </div>
              )}
              {pendingAppointmentsToday > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm">{pendingAppointmentsToday} appointments waiting for check-in today</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/appointments')}>Review</Button>
                </div>
              )}
              {pendingBillsTotal === 0 && pendingAppointmentsToday === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">No pending alerts at this time</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* OPD Management Section - Added as per request to be at the bottom */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Activity className="h-6 w-6" />
                OPD Department
              </CardTitle>
              <CardDescription>Manage Out-Patient Department details</CardDescription>
            </div>
            <Button onClick={() => navigate('/opd/dashboard')} className="bg-purple-600 hover:bg-purple-700 text-white">
              View OPD Details <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900/50">
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-2xl font-bold text-purple-600">{todayAppointments.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900/50">
                <p className="text-sm text-muted-foreground">Active Doctors</p>
                <p className="text-2xl font-bold text-purple-600">{activeDoctors}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900/50">
                <p className="text-sm text-muted-foreground">Pending Bills</p>
                <p className="text-2xl font-bold text-purple-600">{pendingBillsTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div >
    </DashboardLayout >
  );
}
