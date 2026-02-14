import { LoginPage } from "@/components/auth/LoginPage";

const PatientLogin = () => {
    return (
        <LoginPage
            role="patient"
            title="Patient Portal"
            description="Access your medical records, appointments, and prescriptions"
            dashboardPath="/patient/dashboard"
            allowSignup={false}
        />
    );
};

export default PatientLogin;
