import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { lazy, Suspense } from "react";

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, LogIn } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Stethoscope, Users, Pill, FlaskConical } from "lucide-react";

// Lazy-load below-the-fold homepage sections for faster initial paint
const AboutSection = lazy(() =>
  import("@/components/home/AboutSection").then((m) => ({ default: m.AboutSection }))
);
const ServicesSection = lazy(() =>
  import("@/components/home/ServicesSection").then((m) => ({ default: m.ServicesSection }))
);
const DoctorsSection = lazy(() =>
  import("@/components/home/DoctorsSection").then((m) => ({ default: m.DoctorsSection }))
);
const PatientFeedbackSection = lazy(() =>
  import("@/components/home/PatientFeedbackSection").then((m) => ({ default: m.PatientFeedbackSection }))
);
const Footer = lazy(() =>
  import("@/components/layout/Footer").then((m) => ({ default: m.Footer }))
);

// Lightweight section loader (no full-screen spinner, just a subtle placeholder)
const SectionLoader = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="animate-pulse h-8 w-8 rounded-full bg-blue-200 dark:bg-slate-700" />
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>("");

  const staffRoles = [
    { value: "/admin/login", label: "Administrator", icon: ShieldCheck },
    { value: "/doctor/login", label: "Doctor", icon: Stethoscope },
    { value: "/reception/login", label: "Receptionist", icon: Users },
    { value: "/pharmacy/login", label: "Pharmacist", icon: Pill },
    { value: "/lab/login", label: "Lab Technician", icon: FlaskConical },
  ];

  const handleStaffLogin = () => {
    if (selectedStaffRole) {
      navigate(selectedStaffRole);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <HomeNavbar />

      <div id="home">
        <HeroSection />
      </div>

      {/* Access Portals Section - Above the fold on some viewports, kept eagerly */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-slate-900 dark:text-white">Quick Access Portals</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Secure entry for patients and hospital staff</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {/* Hospital Staff Login */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-primary/10">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Staff Login</h2>
                  <p className="text-muted-foreground">Authorized personnel only</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Department</label>
                  <Select onValueChange={setSelectedStaffRole}>
                    <SelectTrigger className="w-full h-12 text-lg">
                      <SelectValue placeholder="Select your role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value} className="cursor-pointer">
                          <div className="flex items-center gap-2 py-1">
                            <role.icon className="w-4 h-4 text-muted-foreground" />
                            <span>{role.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleStaffLogin}
                  disabled={!selectedStaffRole}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to Dashboard
                </Button>
              </div>
            </div>

            {/* Patient Portal Login */}
            <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-8 rounded-2xl shadow-lg text-white">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-bl-full -mr-10 -mt-10" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/20">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Patient Portal</h2>
                    <p className="text-blue-100">Manage your health profile</p>
                  </div>
                </div>

                <p className="text-blue-50 mb-8 leading-relaxed">
                  Access your medical records, view test results, manage upcoming appointments, and pay bills securely from home.
                </p>

                <Link to="/patient/login" className="block">
                  <Button className="w-full h-12 text-lg bg-white text-blue-600 hover:bg-blue-50 border-none">
                    <User className="w-5 h-5 mr-2" />
                    Access Patient Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Below-the-fold sections - lazy loaded for faster initial paint */}
      <Suspense fallback={<SectionLoader />}>
        <div id="about">
          <AboutSection />
        </div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <div id="services">
          <ServicesSection />
        </div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <div id="doctors">
          <DoctorsSection />
        </div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <div id="patient-feedback">
          <PatientFeedbackSection />
        </div>
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
