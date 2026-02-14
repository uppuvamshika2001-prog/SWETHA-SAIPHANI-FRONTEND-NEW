import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Patient } from '@/types';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface PatientContextType {
    patients: Patient[];
    loading: boolean;
    refreshPatients: () => Promise<void>;
    addPatient: (patient: any) => Promise<void>;
    updatePatient: (id: string, data: any) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    // Get auth state to know when user is logged in
    const { user, loading: authLoading } = useAuth();

    const fetchPatients = useCallback(async () => {
        // Check if we have an access token before fetching
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch patients with max allowed limit (100)
            const data = await patientService.getPatients({
                page: 1,
                pageSize: 100,
                sortBy: 'created_at',
                sortDir: 'desc',
            });
            setPatients(data.items || (Array.isArray(data) ? data : []));
            setHasFetched(true);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch patients when user becomes available (after login)
    useEffect(() => {
        // Only fetch if:
        // 1. Auth is done loading
        // 2. User is logged in
        // 3. We haven't successfully fetched yet
        if (!authLoading && user && !hasFetched) {
            fetchPatients();
        }

        // If user logs out, reset state
        if (!authLoading && !user) {
            setPatients([]);
            setHasFetched(false);
            setLoading(false);
        }
    }, [user, authLoading, hasFetched, fetchPatients]);

    const addPatient = async (patientData: any) => {
        try {
            const newPatient = await patientService.createPatient(patientData);
            setPatients(prev => [newPatient, ...prev]);
            toast.success('Patient added successfully');
        } catch (error) {
            console.error('Error adding patient:', error);
            toast.error('Failed to add patient');
            throw error;
        }
    };

    // Manual refresh function that resets hasFetched
    const refreshPatients = async () => {
        setHasFetched(false);
        await fetchPatients();
    };

    const updatePatient = async (id: string, patientData: any) => {
        try {
            await patientService.updatePatient(id, patientData);
            setPatients(prev => prev.map(p => p.id === id ? { ...p, ...patientData } : p));
            toast.success('Patient updated successfully');
        } catch (error) {
            console.error('Error updating patient:', error);
            toast.error('Failed to update patient');
            throw error;
        }
    }

    return (
        <PatientContext.Provider value={{ patients, loading, refreshPatients, addPatient, updatePatient }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatients = () => {
    const context = useContext(PatientContext);
    if (context === undefined) {
        throw new Error('usePatients must be used within a PatientProvider');
    }
    return context;
};
