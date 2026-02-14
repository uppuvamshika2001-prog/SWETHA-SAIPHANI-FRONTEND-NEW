import { api } from '@/services/api';
import { StaffMember, AppRole } from '@/types';

export interface StaffResponse {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string | null;
    phone: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const adaptStaff = (data: any): any => {
    const profile = data.profile || data;
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';

    return {
        id: data.id,
        user_id: data.id,
        full_name: `${firstName} ${lastName}`.trim(),
        email: data.email,
        role: (data.role || '').toLowerCase() as AppRole,
        department: profile.department || data.department || 'General',
        status: (data.status === 'DISABLED' ? 'inactive' : (data.status || 'active').toLowerCase()),
        phone: profile.phone || data.phone,
        created_at: data.createdAt,
        last_login: new Date().toISOString(), // Mock for now
        availability: [], // Mock for now
    };
};

export const staffService = {
    async getStaff(): Promise<any[]> {
        const response = await api.get<any>('/users');
        // Handle paginated response structure
        const users = response.items ? response.items : response;

        if (!Array.isArray(users)) {
            console.error("Expected array of users or paginated response", response);
            return [];
        }

        // Filter out patients - Staff Directory should only show staff members
        const staffUsers = users.filter((u: any) => {
            const role = (u.role || '').toUpperCase();
            return role !== 'PATIENT';
        });

        return staffUsers.map((u: any) => {
            // Check if we have nested profile or flat structure
            const profile = u.profile || u;
            const firstName = profile.firstName || '';
            const lastName = profile.lastName || '';
            const specialization = profile.specialization || '';

            return {
                id: u.id,
                user_id: u.id,
                full_name: `${firstName} ${lastName}`.trim() || u.email,
                email: u.email,
                role: (u.role || '').toLowerCase() as AppRole,
                department: profile.specialization || profile.department || 'General',
                status: (u.status || '').toLowerCase(),
                phone: profile.phone,
                specialization: specialization,
                created_at: u.createdAt,
                last_login: new Date().toISOString(),
                availability: [],
            };
        });
    },

    async createStaff(data: any): Promise<any> {
        const payload = {
            email: data.email,
            firstName: data.full_name.split(' ')[0],
            lastName: data.full_name.split(' ').slice(1).join(' ') || '',
            role: data.role.toUpperCase(),
            department: data.department,
            phone: data.phone,
        };

        // Use the /staff endpoint which auto-generates credentials
        const response = await api.post<any>('/staff', payload);

        // The /staff endpoint returns staff data with credentials
        return {
            id: response.userId, // Use userId to match getStaff and ensure delete works
            user_id: response.userId,
            full_name: `${response.firstName} ${response.lastName}`,
            email: response.email,
            role: (response.role || data.role).toLowerCase() as AppRole,
            department: response.department || data.department || 'General',
            status: 'active',
            phone: response.phone || data.phone,
            created_at: response.createdAt || new Date().toISOString(),
            last_login: new Date().toISOString(),
            availability: [],
            // Include credentials for admin to share with staff
            temporaryPassword: response.temporaryPassword,
            passwordResetLink: response.passwordResetLink,
        };
    },

    async updateStaff(id: string, data: any): Promise<any> {
        const payload = {
            firstName: data.full_name.split(' ')[0],
            lastName: data.full_name.split(' ').slice(1).join(' ') || '',
            role: data.role.toUpperCase(),
            department: data.department,
            status: data.status === 'inactive' ? 'DISABLED' : 'ACTIVE',
        };
        const response = await api.patch<StaffResponse>(`/users/${id}`, payload);
        return adaptStaff(response);
    },

    async deleteStaff(id: string): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    async getPublicActiveDoctors(): Promise<any[]> {
        return api.get<any[]>('/users/public/doctors');
    }
};
