import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types';
import Unauthorized from '@/pages/Unauthorized';

interface ProtectedRouteProps {
    allowedRoles: AppRole[];
}

// Helper to determine the correct login page based on current path
const getLoginPath = (): string => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return '/admin/login';
    if (path.startsWith('/doctor')) return '/doctor/login';
    if (path.startsWith('/reception')) return '/reception/login';
    if (path.startsWith('/pharmacy')) return '/pharmacy/login';
    if (path.startsWith('/lab')) return '/lab/login';
    if (path.startsWith('/patient')) return '/patient/login';
    return '/'; // Fallback to homepage for unknown paths
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    // Show loader while auth is initializing (do NOT redirect)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // User not authenticated - redirect to login
    if (!user) {
        const loginPath = getLoginPath();
        console.log(`[PROTECTED_ROUTE] Not authenticated, redirecting to ${loginPath}`);
        return <Navigate to={loginPath} replace />;
    }

    // Role check
    const userRole = user.role as AppRole;

    // Check if role is allowed
    if (!allowedRoles.includes(userRole)) {
        console.log(`[PROTECTED_ROUTE_BLOCKED] reason=role_mismatch, userRole=${userRole}, allowed=${allowedRoles.join(',')}`);
        // Render Unauthorized page instead of redirecting
        return <Unauthorized />;
    }

    return <Outlet />;
};
