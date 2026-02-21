import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Auth (always loaded)
import { AuthProvider } from "./contexts/AuthContext";
import { PatientProvider } from "./contexts/PatientContext";
import { PrescriptionProvider } from "./contexts/PrescriptionContext";
import { LabProvider } from "./contexts/LabContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Eagerly loaded pages (landing, error, common)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// --- Lazy-loaded pages ---
// Public
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const ApiTest = lazy(() => import("./pages/ApiTest"));

// Admin
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Staff = lazy(() => import("./pages/admin/Staff"));
const AdminPatients = lazy(() => import("./pages/admin/AdminPatients"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AdminPharmacy = lazy(() => import("./pages/admin/AdminPharmacy"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminLabManagement = lazy(() => import("./pages/admin/AdminLabManagement"));
const PatientEncounter = lazy(() => import("./pages/admin/PatientEncounter"));
const OPDRegistration = lazy(() => import("./pages/admin/opd/OPDRegistration"));
const OPDAppointments = lazy(() => import("./pages/admin/opd/OPDAppointments"));
const OPDConsultation = lazy(() => import("./pages/admin/opd/OPDConsultation"));
const OPDPrescriptions = lazy(() => import("./pages/admin/opd/OPDPrescriptions"));
const OPDBilling = lazy(() => import("./pages/admin/opd/OPDBilling"));
const OPDReports = lazy(() => import("./pages/admin/opd/OPDReports"));
const PathologyDashboard = lazy(() => import("./pages/admin/pathology/PathologyDashboard"));
const PathologyRequests = lazy(() => import("./pages/admin/pathology/PathologyRequests"));
const PathologyResults = lazy(() => import("./pages/admin/pathology/PathologyResults"));
const PathologyReports = lazy(() => import("./pages/admin/pathology/PathologyReports"));

// Doctor
const DoctorLogin = lazy(() => import("./pages/doctor/DoctorLogin"));
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));
const Consultation = lazy(() => import("./pages/doctor/Consultation"));
const DoctorAppointments = lazy(() => import("./pages/doctor/DoctorAppointments"));
const DoctorPatients = lazy(() => import("./pages/doctor/DoctorPatients"));
const MedicalRecords = lazy(() => import("./pages/doctor/MedicalRecords"));
const DoctorPrescriptions = lazy(() => import("./pages/doctor/Prescriptions"));
const DoctorLabResults = lazy(() => import("./pages/doctor/LabResults"));
const DoctorSettings = lazy(() => import("./pages/doctor/DoctorSettings"));

// Reception
const ReceptionLogin = lazy(() => import("./pages/reception/ReceptionLogin"));
const ReceptionDashboard = lazy(() => import("./pages/reception/ReceptionDashboard"));
const ReceptionPatients = lazy(() => import("./pages/reception/ReceptionPatients"));
const ReceptionAppointments = lazy(() => import("./pages/reception/ReceptionAppointments"));
const ReceptionBilling = lazy(() => import("./pages/reception/ReceptionBilling"));
const ReceptionSettings = lazy(() => import("./pages/reception/ReceptionSettings"));
const ReceptionLabResults = lazy(() => import("./pages/reception/ReceptionLabResults"));

// Pharmacy
const PharmacyLogin = lazy(() => import("./pages/pharmacy/PharmacyLogin"));
const PharmacyDashboard = lazy(() => import("./pages/pharmacy/PharmacyDashboard"));
const PharmacyPendingOrders = lazy(() => import("./pages/pharmacy/PharmacyPendingOrders"));
const PharmacyInventory = lazy(() => import("./pages/pharmacy/PharmacyInventory"));
const PharmacyDispensing = lazy(() => import("./pages/pharmacy/PharmacyDispensing"));
const PharmacyAlerts = lazy(() => import("./pages/pharmacy/PharmacyAlerts"));
const PharmacyBilling = lazy(() => import("./pages/pharmacy/PharmacyBilling"));
const PharmacySettings = lazy(() => import("./pages/pharmacy/PharmacySettings"));

// Lab
const LabLogin = lazy(() => import("./pages/lab/LabLogin"));
const LabDashboard = lazy(() => import("./pages/lab/LabDashboard"));
const LabPendingTests = lazy(() => import("./pages/lab/LabPendingTests"));
const LabSampleCollection = lazy(() => import("./pages/lab/LabSampleCollection"));
const LabResultsEntry = lazy(() => import("./pages/lab/LabResultsEntry"));
const LabTestCatalog = lazy(() => import("./pages/lab/LabTestCatalog"));
const LabSettings = lazy(() => import("./pages/lab/LabSettings"));

// Patient
const PatientLogin = lazy(() => import("./pages/patient/PatientLogin"));
const PatientDashboard = lazy(() => import("./pages/patient/PatientDashboard"));
const PatientLabResults = lazy(() => import("./pages/patient/PatientLabResults"));
const PatientMedicalRecords = lazy(() => import("./pages/patient/PatientMedicalRecords"));
const PatientPrescriptions = lazy(() => import("./pages/patient/PatientPrescriptions"));
const PatientBilling = lazy(() => import("./pages/patient/PatientBilling"));
const PatientReports = lazy(() => import("./pages/patient/PatientReports"));
const PatientSettings = lazy(() => import("./pages/patient/PatientSettings"));

// OPD
const OpdDashboard = lazy(() => import("./pages/opd/OpdDashboard"));

const queryClient = new QueryClient();

// Suspense fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PatientProvider>
              <PrescriptionProvider>
                <LabProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/api-test" element={<ApiTest />} />
                      <Route path="/services/:slug" element={<ServiceDetails />} />
                      <Route path="/book-appointment" element={<BookAppointment />} />
                      <Route path="/invoice/appointment/:appointmentId" element={<InvoicePage />} />

                      {/* Public Login Routes */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/doctor/login" element={<DoctorLogin />} />
                      <Route path="/reception/login" element={<ReceptionLogin />} />
                      <Route path="/pharmacy/login" element={<PharmacyLogin />} />
                      <Route path="/lab/login" element={<LabLogin />} />
                      <Route path="/patient/login" element={<PatientLogin />} />

                      {/* Admin Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/staff" element={<Staff />} />
                        <Route path="/admin/patients" element={<AdminPatients />} />
                        <Route path="/admin/patients/:id/encounter" element={<PatientEncounter />} />
                        <Route path="/admin/appointments" element={<AdminAppointments />} />
                        <Route path="/admin/departments" element={<Departments />} />
                        <Route path="/admin/billing" element={<AdminBilling />} />
                        <Route path="/admin/reports" element={<Reports />} />
                        <Route path="/admin/settings" element={<Settings />} />
                        <Route path="/admin/profile" element={<Settings />} />
                        <Route path="/admin/pharmacy" element={<AdminPharmacy />} />
                        <Route path="/admin/analytics" element={<AdminAnalytics />} />
                        <Route path="/admin/lab-management" element={<AdminLabManagement />} />

                        {/* Admin OPD Routes */}
                        <Route path="/admin/opd/registration" element={<OPDRegistration />} />
                        <Route path="/admin/opd/appointments" element={<OPDAppointments />} />
                        <Route path="/admin/opd/consultation" element={<OPDConsultation />} />
                        <Route path="/admin/opd/prescriptions" element={<OPDPrescriptions />} />
                        <Route path="/admin/opd/billing" element={<OPDBilling />} />
                        <Route path="/admin/opd/reports" element={<OPDReports />} />

                        {/* Admin Pathology Routes */}
                        <Route path="/admin/pathology/dashboard" element={<PathologyDashboard />} />
                        <Route path="/admin/pathology/requests" element={<PathologyRequests />} />
                        <Route path="/admin/pathology/results" element={<PathologyResults />} />
                        <Route path="/admin/pathology/reports" element={<PathologyReports />} />
                        <Route path="/admin/pathology" element={<Navigate to="/admin/pathology/dashboard" replace />} />
                      </Route>

                      {/* Doctor Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                        <Route path="/doctor/consultation/:appointmentId" element={<Consultation />} />
                        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                        <Route path="/doctor/patients" element={<DoctorPatients />} />
                        <Route path="/doctor/patients/:id/encounter" element={<PatientEncounter />} />
                        <Route path="/doctor/records" element={<MedicalRecords />} />
                        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
                        <Route path="/doctor/lab-results" element={<DoctorLabResults />} />
                        <Route path="/doctor/profile" element={<DoctorSettings />} />
                      </Route>

                      {/* Reception Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
                        <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
                        <Route path="/reception/patients" element={<ReceptionPatients />} />
                        <Route path="/reception/patients/:id/encounter" element={<PatientEncounter />} />
                        <Route path="/reception/appointments" element={<ReceptionAppointments />} />
                        <Route path="/reception/billing" element={<ReceptionBilling />} />
                        <Route path="/reception/lab-results" element={<ReceptionLabResults />} />
                        <Route path="/reception/staff" element={<Staff role="receptionist" />} />
                        <Route path="/reception/settings" element={<ReceptionSettings />} />
                        <Route path="/reception/profile" element={<ReceptionSettings />} />
                      </Route>

                      {/* OPD Routes (Assume Admin/Doctor? Or generic? Leave unprotected if unclear, or wrap in Auth) */}
                      <Route path="/opd/dashboard" element={<OpdDashboard />} />

                      {/* Pharmacy Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['pharmacist']} />}>
                        <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                        <Route path="/pharmacy/orders" element={<PharmacyPendingOrders />} />
                        <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
                        <Route path="/pharmacy/dispensing" element={<PharmacyDispensing />} />
                        <Route path="/pharmacy/alerts" element={<PharmacyAlerts />} />
                        <Route path="/pharmacy/billing" element={<PharmacyBilling />} />
                        <Route path="/pharmacy/profile" element={<PharmacySettings />} />
                      </Route>

                      {/* Lab Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['lab_technician']} />}>
                        <Route path="/lab/dashboard" element={<LabDashboard />} />
                        <Route path="/lab/pending-tests" element={<LabPendingTests />} />
                        <Route path="/lab/sample-collection" element={<LabSampleCollection />} />
                        <Route path="/lab/results-entry" element={<LabResultsEntry />} />
                        <Route path="/lab/test-catalog" element={<LabTestCatalog />} />
                        <Route path="/lab/profile" element={<LabSettings />} />
                      </Route>

                      {/* Patient Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                        <Route path="/patient/dashboard" element={<PatientDashboard />} />
                        <Route path="/patient/lab-results" element={<PatientLabResults />} />
                        <Route path="/patient/records" element={<PatientMedicalRecords />} />
                        <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
                        <Route path="/patient/billing" element={<PatientBilling />} />
                        <Route path="/patient/reports" element={<PatientReports />} />
                        <Route path="/patient/profile" element={<PatientSettings />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </LabProvider>
              </PrescriptionProvider>
            </PatientProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
