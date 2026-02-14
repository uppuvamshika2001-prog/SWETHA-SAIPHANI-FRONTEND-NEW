import { LoginPage } from '@/components/auth/LoginPage';

export default function LabLogin() {
  return (
    <LoginPage
      role="lab_technician"
      title="Laboratory Portal"
      description="Process tests and manage lab results"
      dashboardPath="/lab/dashboard"
      allowSignup={false}
    />
  );
}
