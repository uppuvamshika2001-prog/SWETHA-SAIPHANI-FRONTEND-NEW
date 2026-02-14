export interface PatientFilter {
    search?: string;
    status?: 'active' | 'inactive';
    gender?: 'male' | 'female' | 'other';
    ageMin?: number;
    ageMax?: number;
    regFrom?: string; // ISO Date
    regTo?: string; // ISO Date
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    date?: string; // YYYY-MM-DD
    page?: number;
    pageSize?: number;
}
