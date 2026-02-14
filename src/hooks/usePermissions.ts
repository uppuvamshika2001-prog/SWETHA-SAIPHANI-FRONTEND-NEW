import { useAuth } from '@/contexts/AuthContext';
import { BILLING_PERMISSIONS, BillingPermission } from '@/config/permissions';

/**
 * Hook to check if the current user has specific billing permissions
 */
export function usePermissions() {
    const { role } = useAuth();

    const hasPermission = (permission: BillingPermission): boolean => {
        if (!role) return false;
        const permissions = BILLING_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    };

    const hasAnyPermission = (...permissions: BillingPermission[]): boolean => {
        return permissions.some(hasPermission);
    };

    const hasAllPermissions = (...permissions: BillingPermission[]): boolean => {
        return permissions.every(hasPermission);
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        role
    };
}
