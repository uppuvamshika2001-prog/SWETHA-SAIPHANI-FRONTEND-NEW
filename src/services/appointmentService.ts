import { api } from '@/services/api';
import { Appointment } from '@/types';

// Backend Response Types
export interface AppointmentResponse {
    id: string;
    patientId: string;
    doctorId: string;
    scheduledAt: string; // ISO string
    duration: number;
    status: string; // UPPERCASE
    reason: string | null;
    notes: string | null;
    patient: { firstName: string; lastName: string; phone: string };
    doctor: { firstName: string; lastName: string; specialization: string | null; department?: string | null };
    createdAt: string;
    updatedAt: string;
}

// Adapter
const adaptAppointment = (data: AppointmentResponse): Appointment => {
    const dateObj = new Date(data.scheduledAt);
    const date = dateObj.toISOString().split('T')[0];
    const time = dateObj.toTimeString().substring(0, 5); // HH:MM

    return {
        id: data.id,
        appointment_id: data.id.substring(0, 8).toUpperCase(),
        patient_id: data.patientId,
        patient_name: `${data.patient.firstName} ${data.patient.lastName}`,
        doctor_id: data.doctorId,
        doctor_name: `${data.doctor.firstName} ${data.doctor.lastName}`,
        department: data.doctor.department || data.doctor.specialization || 'General',
        date: date,
        time: time,
        duration: data.duration,
        type: 'consultation', // Default, backend doesn't have type enum in response yet
        status: data.status.toLowerCase() as any, // Map UPPERCASE to lowercase
        notes: data.notes || undefined,
        created_at: data.createdAt,
    };
};

export const appointmentService = {
    async getAppointments(): Promise<Appointment[]> {
        const response = await api.get<any>('/appointments');
        const items = response.items ? response.items : response;
        if (!Array.isArray(items)) {
            console.error("Expected array of appointments", response);
            return [];
        }
        return items.map(adaptAppointment);
    },

    async getAppointmentById(id: string): Promise<Appointment> {
        const response = await api.get<AppointmentResponse>(`/appointments/${id}`);
        return adaptAppointment(response);
    },

    async createAppointment(data: {
        patientId: string;
        doctorId: string;
        scheduledAt: string;
        duration?: number;
        reason?: string;
        notes?: string;
    }) {
        return api.post<AppointmentResponse>('/appointments', data);
    },

    async createPublicAppointment(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        doctorId: string;
        scheduledAt: string;
        paymentType: string;
    }) {
        return api.post<AppointmentResponse>('/appointments/public', data);
    },

    async updateAppointmentStatus(appointmentId: string, status: string): Promise<Appointment> {
        const response = await api.patch<AppointmentResponse>(`/appointments/${appointmentId}`, { status: status.toUpperCase() });
        return adaptAppointment(response);
    },

    async getPublicAppointment(id: string): Promise<Appointment> {
        const response = await api.get<AppointmentResponse>(`/appointments/public/${id}`);
        return adaptAppointment(response);
    },

    async deleteAppointment(id: string): Promise<void> {
        return api.delete(`/appointments/${id}`);
    }
};
