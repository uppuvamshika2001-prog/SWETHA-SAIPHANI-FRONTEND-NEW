import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { medicalRecordService, CreateMedicalRecordInput, MedicalRecord } from '@/services/medicalRecordService';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

export interface PrescriptionItem {
    medicine_id: string;
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Prescription {
    id: string;
    order_id: string;
    patient_id: string;
    patient_name: string;
    doctor_id: string;
    doctor_name: string;
    diagnosis: string;
    items: PrescriptionItem[];
    total_amount: number;
    status: 'pending' | 'processing' | 'dispensed' | 'cancelled';
    created_at: string;
}

interface PrescriptionContextType {
    prescriptions: Prescription[];
    loading: boolean;
    addPrescription: (prescriptionData: any) => Promise<void>;
    getPrescriptionsByPatientId: (patientId: string) => Prescription[];
    refreshPrescriptions: () => Promise<void>;
}

const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

export const PrescriptionProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading: authLoading } = useAuth();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchPrescriptions = useCallback(async () => {
        if (!localStorage.getItem('accessToken')) return;

        try {
            setLoading(true);
            const records = await medicalRecordService.getRecords();
            // Filter records that have prescriptions
            const validPrescriptions = records
                .filter(record => record.prescriptions && record.prescriptions.length > 0)
                .map(record => ({
                    id: record.id,
                    order_id: record.id, // Use UUID as Order ID
                    patient_id: record.patientId,
                    patient_name: `${record.patient.firstName} ${record.patient.lastName}`,
                    doctor_id: record.doctorId,
                    doctor_name: `${record.doctor.firstName} ${record.doctor.lastName}`,
                    diagnosis: record.diagnosis,
                    items: (record.prescriptions || []).map((item: any, idx: number) => ({
                        medicine_id: item.medicineId || `med-${idx}`,
                        medicine_name: item.medicineName,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        instructions: item.instructions || '',
                        quantity: 0,
                        unit_price: 0,
                        total_price: 0
                    })),
                    total_amount: 0,
                    status: (record as any).prescriptionStatus || 'pending', // Use status from backend
                    created_at: record.createdAt
                })) as Prescription[];

            setPrescriptions(validPrescriptions);
            setHasFetched(true);
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
            // toast.error('Failed to load prescriptions'); // specific to component mount, maybe redundant toast
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only fetch prescriptions for roles that have permission
        const allowedRoles = ['ADMIN', 'DOCTOR', 'PHARMACIST'];
        const userRole = user?.role?.toUpperCase();

        if (!authLoading && user && !hasFetched && allowedRoles.includes(userRole || '')) {
            fetchPrescriptions();
        }

        if (!authLoading && !user) {
            setPrescriptions([]);
            setHasFetched(false);
        }
    }, [user, authLoading, hasFetched, fetchPrescriptions]);

    const addPrescription = async (prescriptionData: any) => {
        try {
            // Map UI format to Backend Create Input
            const input: CreateMedicalRecordInput = {
                patientId: prescriptionData.patient_id,
                doctorId: '', // Backend uses logged in user
                diagnosis: prescriptionData.diagnosis,
                treatmentNotes: 'Prescription Generated',
                chiefComplaint: 'Prescription Request',
                prescriptions: prescriptionData.items.map((item: any) => ({
                    medicineName: item.medicine_name,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: ''
                }))
            };

            await medicalRecordService.createRecord(input);
            toast.success('Prescription created successfully');
            fetchPrescriptions(); // Refresh list
        } catch (error) {
            console.error('Failed to create prescription:', error);
            toast.error('Failed to create prescription');
            throw error;
        }
    };

    const getPrescriptionsByPatientId = (patientId: string): Prescription[] => {
        return prescriptions.filter(p => p.patient_id === patientId);
    };

    return (
        <PrescriptionContext.Provider value={{
            prescriptions,
            loading,
            addPrescription,
            getPrescriptionsByPatientId,
            refreshPrescriptions: fetchPrescriptions
        }}>
            {children}
        </PrescriptionContext.Provider>
    );
};

export const usePrescriptions = () => {
    const context = useContext(PrescriptionContext);
    if (context === undefined) {
        throw new Error('usePrescriptions must be used within a PrescriptionProvider');
    }
    return context;
};

