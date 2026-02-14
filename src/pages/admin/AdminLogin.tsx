import { LoginPage } from '@/components/auth/LoginPage';

export default function AdminLogin() {
  return (
    <LoginPage
      role="admin"
      title="Hospital Administrator"
      description="Access the administrative control panel"
      dashboardPath="/admin/dashboard"
      allowSignup={true}
    />
  );
}
