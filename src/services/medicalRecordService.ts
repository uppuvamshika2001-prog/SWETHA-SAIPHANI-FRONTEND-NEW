import { api } from './api';
import { apiCache, CACHE_TTL, getCacheKey } from '@/utils/cache';

// Types for Medical Records
export interface VitalsData {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
}

export interface PrescriptionItem {
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    patient: {
        firstName: string;
        lastName: string;
    };
    doctorId: string;
    doctor: {
        firstName: string;
        lastName: string;
        specialization?: string;
    };
    appointmentId?: string;
    date: string;
    chiefComplaint: string;
    diagnosis: string;
    icdCode?: string;
    treatmentNotes: string;
    vitals?: VitalsData;
    prescriptions?: PrescriptionItem[];
    prescriptionStatus?: 'DISPENSED' | 'PENDING' | 'CANCELLED';
    labOrders?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateMedicalRecordInput {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    chiefComplaint: string;
    diagnosis: string;
    icdCode?: string;
    treatmentNotes: string;
    vitals?: VitalsData;
    prescriptions?: Omit<PrescriptionItem, 'id'>[];
    labOrders?: string[];
}

// Adapter to transform backend response to frontend format
const adaptMedicalRecord = (data: any): MedicalRecord => {
    return {
        id: data.id,
        patientId: data.patientId,
        patient: data.patient || { firstName: 'Unknown', lastName: '' },
        doctorId: data.doctorId,
        doctor: data.doctor || { firstName: 'Unknown', lastName: '' },
        appointmentId: data.appointmentId,
        date: data.date || data.createdAt,
        chiefComplaint: data.chiefComplaint || '',
        diagnosis: data.diagnosis || '',
        icdCode: data.icdCode,
        treatmentNotes: data.treatmentNotes || data.notes || '',
        vitals: data.vitals,
        prescriptions: data.prescriptions || [],
        prescriptionStatus: data.prescriptionStatus, // Map status
        labOrders: data.labOrders || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    };
};

export const medicalRecordService = {
    /**
     * Get all medical records (for Admin OPD Consultation view)
     */
    async getRecords(params?: { patientId?: string; doctorId?: string; search?: string; startDate?: string; endDate?: string }): Promise<MedicalRecord[]> {
        const cacheKey = getCacheKey('/medical-records', params);
        const cached = apiCache.get<MedicalRecord[]>(cacheKey);
        if (cached) return cached;

        const queryString = params ? new URLSearchParams(params as any).toString() : '';
        const response = await api.get<any>(`/medical-records?${queryString}`);

        // Handle both array and paginated response
        const records = response.items ? response.items : (Array.isArray(response) ? response : []);
        const result = records.map(adaptMedicalRecord);
        apiCache.set(cacheKey, result, CACHE_TTL.MEDICAL_RECORDS);
        return result;
    },

    /**
     * Get a single medical record by ID
     */
    async getRecordById(id: string): Promise<MedicalRecord> {
        const response = await api.get<any>(`/medical-records/${id}`);
        return adaptMedicalRecord(response);
    },

    /**
     * Get medical records for a specific patient
     */
    async getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
        const response = await api.get<any>(`/medical-records/patient/${patientId}`);
        const records = response.items ? response.items : (Array.isArray(response) ? response : []);
        return records.map(adaptMedicalRecord);
    },

    /**
     * Create a new medical record (Doctor creates after consultation)
     */
    async createRecord(data: CreateMedicalRecordInput): Promise<MedicalRecord> {
        const response = await api.post<any>('/medical-records', data);
        return adaptMedicalRecord(response);
    },

    /**
     * Update an existing medical record
     */
    async updateRecord(id: string, data: Partial<CreateMedicalRecordInput>): Promise<MedicalRecord> {
        const response = await api.patch<any>(`/medical-records/${id}`, data);
        return adaptMedicalRecord(response);
    }
};
