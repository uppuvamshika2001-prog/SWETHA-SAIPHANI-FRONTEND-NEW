import { LoginPage } from '@/components/auth/LoginPage';

export default function ReceptionLogin() {
  return (
    <LoginPage
      role="receptionist"
      title="Reception Portal"
      description="Manage patient registration and appointments"
      dashboardPath="/reception/dashboard"
      allowSignup={false}
    />
  );
}
