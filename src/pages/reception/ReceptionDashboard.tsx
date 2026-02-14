import { usePatients } from "@/contexts/PatientContext";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  Activity,
  Clock,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Search,
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { PatientRegistrationDialog } from '@/components/patients/PatientRegistrationDialog';
import { AppointmentBookingDialog } from '@/components/appointments/AppointmentBookingDialog';
import { BillGenerationDialog } from '@/components/billing/BillGenerationDialog';
import { PatientDetailsDialog } from '@/components/patients/PatientDetailsDialog';
import { BillDetailsDialog } from '@/components/billing/BillDetailsDialog';
import { Patient } from '@/types';

import { appointmentService } from '@/services/appointmentService';
import { staffService } from '@/services/staffService';
import { billingService, Bill } from '@/services/billingService';
import { Appointment, StaffMember } from '@/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ReceptionDashboard() {
  const { patients } = usePatients();

  // State for real data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'appointments' | 'checked_in' | 'waiting' | 'registrations' | null>(null);
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Filter patients based on search query (name, ID, phone)
  const filteredPatients = searchQuery.trim()
    ? patients.filter(patient => {
      const query = searchQuery.toLowerCase().trim();
      const name = (patient.full_name || '').toLowerCase();
      const uhid = (patient.uhid || '').toLowerCase();
      const phone = (patient.phone || '').toLowerCase();
      return name.includes(query) || uhid.includes(query) || phone.includes(query);
    })
    : patients.slice(0, 5); // Show last 5 when not searching

  // Dropdown suggestions (show when 2+ characters typed)
  const dropdownSuggestions = searchQuery.trim().length >= 2
    ? filteredPatients.slice(0, 6)
    : [];

  // Handle selecting a patient from dropdown
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Get today's registered patients
  const todayPatients = patients.filter(p => format(new Date(p.created_at || new Date()), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));

  // Get filtered data based on active filter
  const getFilteredData = () => {
    switch (activeFilter) {
      case 'appointments':
        return { title: "Today's Appointments", data: todayAppointments, type: 'appointments' as const };
      case 'checked_in':
        return { title: 'Checked In Patients', data: todayAppointments.filter(apt => apt.status === 'checked_in'), type: 'appointments' as const };
      case 'waiting':
        return { title: 'Waiting Patients', data: todayAppointments.filter(apt => apt.status === 'scheduled'), type: 'appointments' as const };
      case 'registrations':
        return { title: 'Today\'s Registrations', data: todayPatients, type: 'patients' as const };
      default:
        return null;
    }
  };

  // Fetch real data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedAppointments, fetchedStaff, fetchedBills] = await Promise.all([
          appointmentService.getAppointments(),
          staffService.getStaff(),
          billingService.getBills()
        ]);

        setAppointments(fetchedAppointments);

        // Filter doctors (and admins who serve as doctors)
        console.log('Fetched Staff:', fetchedStaff);
        const doctorList = fetchedStaff.filter(s => s.role === 'doctor' || s.role === 'admin');
        setDoctors(doctorList);

        // Handle potential paginated response for bills
        const billsData: any = fetchedBills;
        setBills(Array.isArray(billsData) ? billsData : (billsData.items || []));

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Failed to update dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayAppointments = appointments.filter(
    (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  const checkedIn = todayAppointments.filter((apt) => apt.status === 'checked_in').length;
  const waiting = todayAppointments.filter((apt) => apt.status === 'scheduled').length;
  // Use length of real patients list
  const todayRegistrations = patients.filter(p => format(new Date(p.created_at || new Date()), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;


  const patientColumns = [
    { key: 'uhid', header: 'Patient ID' },
    { key: 'full_name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'status',
      header: 'Status',
      render: (patient: typeof patients[0]) => (
        <StatusBadge status={patient.status} />
      )
    },
    {
      key: 'actions',
      header: '',
      render: (patient: typeof patients[0]) => (
        <PatientDetailsDialog patientId={patient.uhid}>
          <Button variant="ghost" size="sm">View</Button>
        </PatientDetailsDialog>
      )
    }
  ];

  const billColumns = [
    { key: "billNumber", header: "Bill ID" },
    { key: "patient_name", header: "Patient", render: (b: Bill) => b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : 'N/A' },
    { key: "grandTotal", header: "Amount", render: (b: Bill) => `₹${b.grandTotal} ` },
    { key: "status", header: "Status", render: (b: Bill) => <StatusBadge status={b.status.toLowerCase() as any} /> },
    {
      key: 'actions',
      header: '',
      render: (bill: Bill) => (
        <BillDetailsDialog billId={bill.id}>
          <Button variant="ghost" size="sm">View</Button>
        </BillDetailsDialog>
      )
    }
  ];

  const doctorScheduleColumns = [
    {
      key: 'full_name',
      header: 'Doctor',
      render: (doctor: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {doctor.full_name ? doctor.full_name.split(' ').map((n: string) => n[0]).join('') : 'DR'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{doctor.full_name}</p>
            <p className="text-xs text-muted-foreground">{doctor.specialization || 'General'}</p>
          </div>
        </div>
      )
    },
    { key: 'department', header: 'Department' },
    {
      key: 'status',
      header: 'Availability',
      render: (doctor: any) => (
        <StatusBadge status={doctor.status} />
      )
    },
  ];

  return (
    <DashboardLayout role="receptionist">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reception Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Quick Call
            </Button>
            <PatientRegistrationDialog>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </PatientRegistrationDialog>
          </div>
        </div>

        {/* Quick Search */}
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  placeholder="Search patients by name, ID, or phone number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(e.target.value.trim().length >= 2);
                  }}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                />

                {/* Dropdown Suggestions */}
                {showDropdown && dropdownSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {dropdownSuggestions.map((patient) => (
                      <div
                        key={patient.uhid}
                        className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        onMouseDown={() => handleSelectPatient(patient.uhid)}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">{patient.full_name}</div>
                        <div className="text-sm text-slate-500 flex gap-4">
                          <span>{patient.uhid}</span>
                          <span>{patient.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {showDropdown && searchQuery.trim().length >= 2 && dropdownSuggestions.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 px-4 py-3 text-sm text-slate-500">
                    No patients found
                  </div>
                )}
              </div>
              <AppointmentBookingDialog>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </AppointmentBookingDialog>
            </div>
          </CardContent>
        </Card>

        {/* Hidden PatientDetailsDialog triggered by dropdown selection */}
        {selectedPatientId && (
          <PatientDetailsDialog
            patientId={selectedPatientId}
            open={!!selectedPatientId}
            onOpenChange={(open) => !open && setSelectedPatientId(null)}
          >
            <span></span>
          </PatientDetailsDialog>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today's Appointments"
            value={todayAppointments.length}
            icon={<Calendar className="h-5 w-5" />}
            description="Scheduled for today"
            variant="primary"
            onClick={() => setActiveFilter('appointments')}
          />
          <StatsCard
            title="Checked In"
            value={checkedIn}
            icon={<Users className="h-5 w-5" />}
            description="Patients arrived"
            variant="success"
            onClick={() => setActiveFilter('checked_in')}
          />
          <StatsCard
            title="Waiting"
            value={waiting}
            icon={<Clock className="h-5 w-5" />}
            description="In waiting queue"
            variant="warning"
            onClick={() => setActiveFilter('waiting')}
          />
          <StatsCard
            title="New Registrations"
            value={todayRegistrations}
            icon={<UserPlus className="h-5 w-5" />}
            description="Registered today"
            onClick={() => setActiveFilter('registrations')}
          />
        </div>

        {/* Filter Results Modal */}
        {activeFilter && getFilteredData() && (
          <Card className="glass border-2 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{getFilteredData()?.title}</CardTitle>
                <CardDescription>{getFilteredData()?.data.length} records found</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)}>
                ✕ Close
              </Button>
            </CardHeader>
            <CardContent>
              {getFilteredData()?.type === 'appointments' ? (
                <DataTable
                  data={getFilteredData()?.data as Appointment[] || []}
                  columns={[
                    { key: 'appointment_id', header: 'ID', render: (apt: Appointment) => apt.appointment_id || apt.id.slice(0, 8) },
                    { key: 'patient_name', header: 'Patient', render: (apt: Appointment) => apt.patient_name || 'N/A' },
                    { key: 'doctor_name', header: 'Doctor', render: (apt: Appointment) => apt.doctor_name || 'N/A' },
                    { key: 'time', header: 'Time', render: (apt: Appointment) => apt.time || 'N/A' },
                    { key: 'status', header: 'Status', render: (apt: Appointment) => <StatusBadge status={apt.status as any} /> },
                  ]}
                  emptyMessage="No appointments found"
                />
              ) : (
                <DataTable
                  data={getFilteredData()?.data as Patient[] || []}
                  columns={patientColumns}
                  emptyMessage="No patients found"
                />
              )}
            </CardContent>
          </Card>
        )}



        {/* Doctor Availability & Recent Patients */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Doctor Availability */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Doctor Availability</CardTitle>
                <CardDescription>Current status of doctors</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setShowAllDoctors(true)}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={doctors.slice(0, 4)}
                columns={doctorScheduleColumns}
                emptyMessage="No doctors found"
              />
            </CardContent>
          </Card>

          {/* All Doctors Modal */}
          {showAllDoctors && (
            <Card className="glass border-2 border-primary/20 lg:col-span-2 order-first">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Doctors</CardTitle>
                  <CardDescription>{doctors.length} doctors found</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAllDoctors(false)}>
                  ✕ Close
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="p-4 rounded-lg border bg-white dark:bg-slate-900 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {doctor.full_name ? doctor.full_name.split(' ').map((n: string) => n[0]).join('') : 'DR'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{doctor.full_name || 'Unknown Doctor'}</p>
                          <p className="text-sm text-muted-foreground">{doctor.specialization || 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{doctor.department || 'General'}</span>
                        <StatusBadge status={doctor.status || 'active'} />
                      </div>
                    </div>
                  ))}
                  {doctors.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No doctors found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common reception tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <PatientRegistrationDialog>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs">Register Patient</span>
                </Button>
              </PatientRegistrationDialog>

              <AppointmentBookingDialog>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Book Appointment</span>
                </Button>
              </AppointmentBookingDialog>

              <BillGenerationDialog>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Generate Bill</span>
                </Button>
              </BillGenerationDialog>
            </CardContent>
          </Card>
        </div>

        {/* Recent Patients / Search Results */}
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {searchQuery.trim() ? `Search Results (${filteredPatients.length})` : 'Recently Registered'}
              </CardTitle>
              <CardDescription>
                {searchQuery.trim()
                  ? `Showing results for "${searchQuery}"`
                  : 'New patient registrations'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <a href="/reception/patients">View All Patients</a>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredPatients}
              columns={patientColumns}
              emptyMessage={searchQuery.trim() ? 'No patients found matching your search' : 'No recent registrations'}
            />

          </CardContent>
        </Card>

        {/* Recent Bills */}
        <Card className="glass mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Bills
              </CardTitle>
              <CardDescription>Latest billing activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={bills.slice(0, 5)}
              columns={billColumns}
              emptyMessage="No bills found"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
