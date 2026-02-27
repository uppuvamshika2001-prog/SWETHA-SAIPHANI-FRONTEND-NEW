import { api } from '@/services/api';
import { Patient, AppRole } from '@/types';

// Backend Response Types
export interface PatientResponse {
    id: string;
    uhid: string | null;
    userId: string | null;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // ISO string
    gender: string;
    phone: string;
    email: string | null;
    address: string | null;
    emergencyContact: string | null;
    bloodGroup: string | null;
    allergies: string | null;
    createdAt: string;
    updatedAt: string;
    consultingDoctor: string | null;
    department: string | null;
}

// Adapter to transform backend PatientResponse to frontend Patient type
const adaptPatient = (data: PatientResponse): Patient => {
    const birthDate = new Date(data.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    return {
        id: data.uhid || data.id, // Added based on instruction, assuming frontend Patient type has an 'id' field
        uhid: data.uhid || data.id, // Use uhid if available, otherwise fallback to id
        full_name: `${data.firstName} ${data.lastName}`,
        date_of_birth: new Date(data.dateOfBirth).toISOString(),
        age: age,
        gender: data.gender.toLowerCase() as 'male' | 'female' | 'other',
        blood_group: data.bloodGroup || undefined,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address || '',
        emergency_contact_name: 'Not Provided',
        emergency_contact_phone: data.emergencyContact || '',
        allergies: data.allergies ? data.allergies.split(',') : [],
        status: 'active',
        created_at: new Date(data.createdAt).toISOString(),
        updated_at: new Date(data.updatedAt).toISOString(),
        consulting_doctor: data.consultingDoctor || undefined,
        department: data.department || undefined,
    };
};

export const patientService = {
    async getPatients(query?: any): Promise<any> {
        let endpoint = '/patients';
        if (query) {
            // Build query params, filtering out undefined/empty values
            // and explicitly converting numbers to strings
            const params = new URLSearchParams();
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (key === 'pageSize') {
                        params.set('limit', String(value));
                    } else {
                        params.set(key, String(value));
                    }
                }
            });
            const paramString = params.toString();
            if (paramString) {
                endpoint += `?${paramString}`;
            }
        }

        // Use short-lived cache (15s) to avoid stale pagination data
        const cacheKey = `patients:${endpoint}`;
        const cached = (window as any).__patientCache?.get(cacheKey);
        if (cached && Date.now() - cached.time < 15000) return cached.data;

        const response = await api.get<any>(endpoint);
        let result;
        if (Array.isArray(response)) {
            result = { items: response.map(adaptPatient), total: response.length, totalPages: 1 };
        } else {
            result = {
                ...response,
                items: (response.items || response.data || []).map(adaptPatient),
                total: response.total || response.meta?.total || 0,
                totalPages: response.totalPages || response.meta?.totalPages || 1,
            };
        }

        // Store in simple cache
        if (!(window as any).__patientCache) (window as any).__patientCache = new Map();
        (window as any).__patientCache.set(cacheKey, { data: result, time: Date.now() });

        return result;
    },

    async getPatientById(uhid: string): Promise<Patient> {
        const response = await api.get<PatientResponse>(`/patients/${encodeURIComponent(uhid)}`);
        return adaptPatient(response);
    },

    async getMyProfile(): Promise<Patient> {
        const response = await api.get<PatientResponse>('/patients/me');
        return adaptPatient(response);
    },

    async createPatient(data: any): Promise<Patient> {
        const fullAddress = (data.village || data.mandal || data.state)
            ? `${data.address}, ${data.village}, ${data.mandal}, ${data.district}, ${data.state} - ${data.pincode}`
            : data.address;

        const payload = {
            firstName: data.firstName || (data.full_name ? data.full_name.split(' ')[0] : ''),
            lastName: data.lastName || (data.full_name ? data.full_name.split(' ').slice(1).join(' ') : '') || '',
            dateOfBirth: data.date_of_birth,
            gender: data.gender?.toUpperCase(),
            phone: data.phone,
            email: data.email || undefined,
            address: fullAddress,
            emergencyContact: (data.emergency_contact_phone || data.emergencyPhone) || undefined,
            bloodGroup: (data.blood_group || data.bloodGroup) || undefined,
            allergies: data.allergies ? (Array.isArray(data.allergies) ? data.allergies.join(',') : data.allergies) : undefined,
            uhid: data.uhid,
            // Include ID fields only if both are provided (optional fields)
            ...(data.idType && data.idNumber ? { idType: data.idType, idNumber: data.idNumber } : {}),
            // Referral fields (handle if backend supports them later, currently undefined to avoid issues)
            referredBy: data.referredBy || undefined,
            referredPerson: data.referredPerson || undefined,
            consultingDoctor: data.consultingDoctor || undefined,
            registrationFee: data.registrationFee || undefined,
            paymentMode: data.paymentMode || undefined
        };

        console.log('[PatientService] Creating patient with payload:', JSON.stringify(payload, null, 2));

        try {
            const response = await api.post<PatientResponse>('/patients', payload);
            return adaptPatient(response);
        } catch (error) {
            console.error('[PatientService] Failed to create patient:', error);
            throw error;
        }
    },

    async updatePatient(uhid: string, data: any): Promise<Patient> {
        const fullAddress = (data.village || data.mandal || data.state)
            ? `${data.address}, ${data.village}, ${data.mandal}, ${data.district}, ${data.state} - ${data.pincode}`
            : data.address;

        const payload = {
            firstName: data.firstName || data.full_name.split(' ')[0],
            lastName: data.lastName || data.full_name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: data.date_of_birth,
            gender: data.gender ? data.gender.toUpperCase() : undefined,
            phone: data.phone,
            email: data.email,
            address: fullAddress,
            emergencyContact: data.emergency_contact_phone || data.emergencyPhone,
            bloodGroup: data.blood_group || data.bloodGroup,
            allergies: data.allergies ? (Array.isArray(data.allergies) ? data.allergies.join(',') : data.allergies) : undefined,
            uhid: data.uhid,
        };
        const response = await api.patch<PatientResponse>(`/patients/${uhid}`, payload);
        return adaptPatient(response);
    },

    async getPatientPrescriptions(uhid: string): Promise<any[]> {
        return api.get<any[]>(`/patients/${uhid}/prescriptions`);
    },

    async getPatientBills(uhid: string): Promise<any[]> {
        return api.get<any[]>(`/patients/${uhid}/bills`);
    },

    async getPatientLabResults(uhid: string, startDate?: string, endDate?: string): Promise<any[]> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return api.get<any[]>(`/patients/${uhid}/lab-results${queryString}`);
    },

    async getPatientMedicalRecords(uhid: string): Promise<any[]> {
        const records = await api.get<any[]>(`/medical-records/patient/${uhid}`);
        return records.map((record: any) => ({
            id: record.id,
            doctor_name: record.doctor ? `Dr. ${record.doctor.firstName.replace(/^Dr\.\s+/i, '')} ${record.doctor.lastName}` : 'Unknown Doctor',
            date: record.createdAt || record.date,
            diagnosis: record.diagnosis,
            treatment_notes: record.treatment || record.notes || 'No treatment notes',
            chief_complaint: record.notes || 'Not specified',
            icd_code: 'N/A',
            prescriptions: record.prescriptions ? record.prescriptions.map((p: any) => ({
                id: p.medicineId || p.id,
                medicine_name: p.name || p.medicineName || 'Generic Medicine',
                dosage: p.dosage || 'As prescribed',
                duration: p.duration || 'As prescribed',
                frequency: p.frequency || 'As prescribed',
                instructions: p.instructions || '-'
            })) : []
        }));
    },

    async deletePatient(uhid: string): Promise<void> {
        return api.delete(`/patients/${encodeURIComponent(uhid)}`);
    },
};
