import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Search, Download, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PatientRegistrationDialog } from '@/components/patients/PatientRegistrationDialog';
import { PatientDetailsDialog } from '@/components/patients/PatientDetailsDialog';
import { printPatientCard } from '@/utils/printPatientCard';
import { patientService } from '@/services/patientService';
import { Patient } from '@/types';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';

export default function ReceptionPatients() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    // Date Filtering State (Default: Today)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const PAGE_SIZE = 15;


    const fetchPatients = useCallback(async () => {
        setLoading(true);
        try {
            const query: Record<string, string | number> = {
                page,
                pageSize: PAGE_SIZE,
                sortBy: 'created_at',
                sortDir: 'desc',
            };
            if (selectedDate) {
                query.date = format(selectedDate, 'yyyy-MM-dd');
            }
            if (searchQuery.trim()) {
                query.search = searchQuery.trim();
            }


            const response = await patientService.getPatients(query);
            setPatients(response.items || []);
            setMeta({
                page: page,
                totalPages: response.meta?.totalPages || response.totalPages || 1,
                total: response.meta?.total || response.total || (response.items?.length || 0),
            });
        } catch (error) {
            console.error('Failed to fetch patients', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery]);

    // Debounce search, immediately fetch on page change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPatients]);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > meta.totalPages) return;
        setPage(newPage);
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1); // Reset to page 1 on new search
    };

    // Generate page numbers for pagination
    const getPageNumbers = (): number[] => {
        const pages: number[] = [];
        const total = meta.totalPages;
        const current = page;

        if (total <= 5) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            // Always show first, last, current, and neighbors
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);

            pages.push(1);
            if (start > 2) pages.push(-1); // ellipsis marker
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < total - 1) pages.push(-1); // ellipsis marker
            pages.push(total);
        }
        return pages;
    };

    const columns = [
        { key: 'uhid', header: 'Patient ID' },
        { key: 'full_name', header: 'Name' },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email' },
        {
            key: 'status',
            header: 'Status',
            render: (patient: any) => (
                <StatusBadge status={patient.status} />
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (patient: any) => (
                <div className="flex items-center gap-2">
                    <PatientDetailsDialog patientId={patient.uhid} showMedicalRecords={false}>
                        <Button variant="ghost" size="sm">View Details</Button>
                    </PatientDetailsDialog>
                    <Button variant="outline" size="sm" onClick={() => printPatientCard(patient, [], false)}>
                        <Download className="h-4 w-4" />
                    </Button>
                    <PatientRegistrationDialog patientToEdit={patient} onRegister={() => fetchPatients()}>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </PatientRegistrationDialog>
                </div>
            )
        }
    ];

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        setPage(1);
    };

    return (
        <DashboardLayout role="receptionist">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Patient Registration
                        </h1>
                        <p className="text-muted-foreground">Manage patient records and registrations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DatePicker
                            date={selectedDate}
                            setDate={handleDateChange}
                            placeholder="Filter by Date"
                        />
                        <PatientRegistrationDialog onRegister={() => fetchPatients()}>
                            <Button>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Register New Patient
                            </Button>
                        </PatientRegistrationDialog>
                    </div>
                </div>


                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div>
                                <CardTitle>All Patients</CardTitle>
                                <CardDescription>
                                    {loading ? 'Loading...' : `Total ${meta.total} registered patients`}
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search patients..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={patients}
                            columns={columns}
                            emptyMessage={loading ? 'Loading...' : 'No patients found'}
                        />

                        {/* Pagination Controls */}
                        {meta.totalPages > 1 && (
                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Showing page {page} of {meta.totalPages} ({meta.total} total patients)
                                </div>
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange(page - 1)}
                                                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>

                                        {getPageNumbers().map((pageNum, idx) => (
                                            <PaginationItem key={idx}>
                                                {pageNum === -1 ? (
                                                    <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">…</span>
                                                ) : (
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(pageNum)}
                                                        isActive={pageNum === page}
                                                        className="cursor-pointer"
                                                    >
                                                        {pageNum}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange(page + 1)}
                                                className={page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
