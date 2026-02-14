import { LoginPage } from '@/components/auth/LoginPage';

export default function PharmacyLogin() {
  return (
    <LoginPage
      role="pharmacist"
      title="Pharmacy Portal"
      description="Manage prescriptions and inventory"
      dashboardPath="/pharmacy/dashboard"
      allowSignup={false}
    />
  );
}
