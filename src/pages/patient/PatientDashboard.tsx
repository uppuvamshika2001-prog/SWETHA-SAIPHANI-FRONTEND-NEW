
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, Activity, Pill, CreditCard, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppointmentBookingDialog } from '@/components/appointments/AppointmentBookingDialog';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { ConsultationDetailsDialog } from '@/components/medical/ConsultationDetailsDialog';
import { LabResultDetailsDialog } from '@/components/lab/LabResultDetailsDialog';
import { PharmacyDetailsDialog } from '@/components/pharmacy/PharmacyDetailsDialog';
import { BillDetailsDialog } from '@/components/billing/BillDetailsDialog';
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { Patient } from '@/types';
import { toast } from 'sonner';
import { StatsCardSkeleton, Skeleton } from '@/components/ui/skeleton';

const PatientDashboard = () => {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [myAppointments, setMyAppointments] = useState<any[]>([]); // Mock/Empty for now
    const [myRecords, setMyRecords] = useState<any[]>([]); // Mock/Empty for now
    const [myLabOrders, setMyLabOrders] = useState<any[]>([]);
    const [myPrescriptions, setMyPrescriptions] = useState<any[]>([]);
    const [myBills, setMyBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleNewAppointment = (appointment: any) => {
        setMyAppointments(prev => [...prev, appointment]);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // First, fetch the profile - this is critical
                const profile = await patientService.getMyProfile();
                setPatient(profile);

                // Fetch related data using Promise.allSettled for resilience
                // This allows partial success - dashboard shows what we can load
                const results = await Promise.allSettled([
                    appointmentService.getAppointments(),
                    patientService.getPatientPrescriptions(profile.uhid),
                    patientService.getPatientBills(profile.uhid),
                    patientService.getPatientLabResults(profile.uhid),
                    patientService.getPatientMedicalRecords(profile.uhid)
                ]);

                // Track which widgets failed for user feedback
                const failedWidgets: string[] = [];

                // Process appointments
                if (results[0].status === 'fulfilled') {
                    const allAppointments = results[0].value;
                    const myAppts = allAppointments.filter((appt: any) =>
                        appt.patientId === profile.id || appt.patientId === profile.uhid ||
                        appt.patient_id === profile.id || appt.patient_id === profile.uhid
                    );
                    setMyAppointments(myAppts);
                } else {
                    console.error('[Dashboard] Failed to load appointments:', results[0].reason);
                    failedWidgets.push('Appointments');
                }

                // Process prescriptions
                if (results[1].status === 'fulfilled') {
                    const prescriptions = results[1].value || [];
                    const mappedPrescriptions = prescriptions.map((p: any) => ({
                        id: p.id,
                        order_id: p.id.slice(0, 8).toUpperCase(),
                        status: 'active',
                        items: p.medicines || [],
                        total_amount: 0,
                        doctor_name: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : 'Doctor'
                    }));
                    setMyPrescriptions(mappedPrescriptions);
                } else {
                    console.error('[Dashboard] Failed to load prescriptions:', results[1].reason);
                    failedWidgets.push('Prescriptions');
                }

                // Process bills
                if (results[2].status === 'fulfilled') {
                    const bills = results[2].value || [];
                    const mappedBills = bills.map((b: any) => ({
                        id: b.id,
                        bill_id: b.billNumber || b.bill_id,
                        status: b.status.toLowerCase(),
                        total: Number(b.grandTotal || b.total || 0),
                        created_at: b.createdAt || b.created_at,
                        type: 'General'
                    }));
                    setMyBills(mappedBills);
                } else {
                    console.error('[Dashboard] Failed to load bills:', results[2].reason);
                    failedWidgets.push('Bills');
                }

                // Process lab results
                if (results[3].status === 'fulfilled') {
                    const labResults = results[3].value || [];
                    const mappedLab = labResults.map((order: any) => ({
                        id: order.id,
                        order_id: `LAB-${order.id.slice(0, 4).toUpperCase()}`,
                        status: order.status.toLowerCase(),
                        ordered_at: order.createdAt,
                        tests: [{
                            test_name: order.testName,
                            status: order.status.toLowerCase()
                        }]
                    }));
                    setMyLabOrders(mappedLab);
                } else {
                    console.error('[Dashboard] Failed to load lab results:', results[3].reason);
                    failedWidgets.push('Lab Results');
                }

                // Process medical records
                if (results[4].status === 'fulfilled') {
                    setMyRecords(results[4].value || []);
                } else {
                    console.error('[Dashboard] Failed to load medical records:', results[4].reason);
                    failedWidgets.push('Medical Records');
                }

                // Show warning if some widgets failed but others loaded
                if (failedWidgets.length > 0 && failedWidgets.length < 5) {
                    toast.warning(`Some data couldn't be loaded: ${failedWidgets.join(', ')}`, {
                        description: 'Refresh to try again'
                    });
                } else if (failedWidgets.length === 5) {
                    toast.error("Failed to load dashboard data", {
                        description: "Please check your connection and try again"
                    });
                }

            } catch (error: any) {
                // This only catches profile fetch failure - which is critical
                console.error("[Dashboard] Critical error - profile fetch failed:", error);
                toast.error("Failed to load your profile", {
                    description: error.message || "Please try logging in again"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'paid': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Navigation state handling
    const location = useLocation();
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [preSelectedDoctorId, setPreSelectedDoctorId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (location.state?.bookAppointment && location.state?.doctorId) {
            setPreSelectedDoctorId(location.state.doctorId);
            setShowBookingDialog(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Loading check handled inside return for progressive loading

    return (
        <DashboardLayout role="patient">
            <AppointmentBookingDialog
                open={showBookingDialog}
                onOpenChange={setShowBookingDialog}
                preSelectedDoctorId={preSelectedDoctorId}
                preSelectedPatient={patient}
                defaultTrigger={false}
                onBook={handleNewAppointment}
            />
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Health Portal</h1>
                    <p className="text-muted-foreground mt-2">Welcome back, {patient?.full_name}. Here is your health overview.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <>
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                            <StatsCardSkeleton />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                                    <AppointmentBookingDialog onBook={handleNewAppointment} preSelectedPatient={patient}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    </AppointmentBookingDialog>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {myAppointments.find(a => a.status === 'scheduled')?.date || 'No upcoming'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {myAppointments.find(a => a.status === 'scheduled')?.doctor_name || 'Schedule a visit'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Lab Results</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{myLabOrders.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {myLabOrders.filter(l => l.status === 'completed').length} ready to view
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
                                    <Pill className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{myPrescriptions.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Active medications
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Appointments List */}
                    <Card className="col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <AppointmentBookingDialog onBook={handleNewAppointment} preSelectedPatient={patient}>
                                <Button size="sm">Book New</Button>
                            </AppointmentBookingDialog>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20 ml-auto" />
                                                <Skeleton className="h-3 w-16 ml-auto" />
                                            </div>
                                        </div>
                                    ))
                                ) : myAppointments.filter(a => a.status === 'scheduled').length > 0 ? (
                                    myAppointments.filter(a => a.status === 'scheduled').map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Clock className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{appointment.type ? appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) : 'Appointment'}</p>
                                                    <p className="text-sm text-muted-foreground">{appointment.doctor_name} - {appointment.department}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{appointment.date}</p>
                                                <p className="text-sm text-muted-foreground">{appointment.time}</p>
                                                <AppointmentDetailsDialog appointmentId={appointment.id}>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">View Details</Button>
                                                </AppointmentDetailsDialog>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No upcoming appointments</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical History Preview */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Recent Medical Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-20 ml-auto" />
                                                <Skeleton className="h-3 w-16 ml-auto" />
                                            </div>
                                        </div>
                                    ))
                                ) : myRecords.length > 0 ? (
                                    myRecords.slice(0, 3).map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <FileText className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{record.diagnosis}</p>
                                                    <p className="text-sm text-muted-foreground">{record.doctor_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                                <Badge variant="outline" className="mt-1 mb-1 block w-fit ml-auto">
                                                    {record.prescriptions?.length || 0} Meds
                                                </Badge>
                                                <ConsultationDetailsDialog recordId={record.id}>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">View Report</Button>
                                                </ConsultationDetailsDialog>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No medical records found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lab Orders */}
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Lab Tests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                                <div className="space-y-2 hidden sm:block">
                                                    <Skeleton className="h-3 w-24 ml-auto" />
                                                    <Skeleton className="h-3 w-16 ml-auto" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : myLabOrders.length > 0 ? (
                                    myLabOrders.slice(0, 3).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                    <Activity className="h-5 w-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Lab Order #{order.order_id || order.id?.substring(0, 8)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.tests ? order.tests.map((t: any) => t.test_name).join(', ') : 'Tests'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={getStatusColor(order.status)}>
                                                    {order.status?.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-sm text-muted-foreground">Ordered: {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : 'N/A'}</p>
                                                    {order.status === 'completed' && (
                                                        <LabResultDetailsDialog orderId={order.id}>
                                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">View Results</Button>
                                                        </LabResultDetailsDialog>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No lab orders found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pharmacy Orders */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Recent Pharmacy Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Skeleton className="h-5 w-20 ml-auto" />
                                                <Skeleton className="h-3 w-16 ml-auto" />
                                            </div>
                                        </div>
                                    ))
                                ) : myPrescriptions.length > 0 ? (
                                    myPrescriptions.slice(0, 3).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <Pill className="h-5 w-5 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Order #{order.order_id || order.id?.substring(0, 8)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {order.items?.length || 0} Items • ₹{order.total_amount?.toFixed(2) || '0.00'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className={getStatusColor(order.status)}>
                                                    {order.status}
                                                </Badge>
                                                <div className="mt-1">
                                                    <PharmacyDetailsDialog orderId={order.id}>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-600">View Details</Button>
                                                    </PharmacyDetailsDialog>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No pharmacy orders found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Billing History */}
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>Billing History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                            <div className="text-right space-y-2">
                                                <Skeleton className="h-5 w-16 ml-auto" />
                                                <Skeleton className="h-5 w-16 ml-auto" />
                                            </div>
                                        </div>
                                    ))
                                ) : myBills.length > 0 ? (
                                    myBills.slice(0, 3).map((bill) => (
                                        <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <CreditCard className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">Invoice #{bill.bill_id || bill.id?.substring(0, 8)}</p>
                                                    <p className="text-sm text-muted-foreground capitalize">
                                                        {bill.type || 'General'} Bill • {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">${bill.total?.toFixed(2) || '0.00'}</p>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <Badge className={getStatusColor(bill.status)}>
                                                        {bill.status}
                                                    </Badge>
                                                    <BillDetailsDialog billId={bill.id}>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <FileText className="h-3 w-3" />
                                                        </Button>
                                                    </BillDetailsDialog>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-center py-4">No bills found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};



export default PatientDashboard;
