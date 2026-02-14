import { LoginPage } from '@/components/auth/LoginPage';

export default function DoctorLogin() {
  return (
    <LoginPage
      role="doctor"
      title="Doctor Portal"
      description="Access your patient records and appointments"
      dashboardPath="/doctor/dashboard"
      allowSignup={false}
    />
  );
}
