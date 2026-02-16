import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Filter as FilterIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConsultationActions } from "@/components/doctor/ConsultationActions";
import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PatientFilterPanel } from "@/components/patients/PatientFilterPanel";
import { FilterChips } from "@/components/patients/FilterChips";
import { SavedViews } from "@/components/patients/SavedViews";
import { PatientFilter } from "@/types/filters";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

export default function DoctorPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Date Filtering State (Default: Today)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Filter State
    const [filters, setFilters] = useState<PatientFilter>({
        page: 1,
        pageSize: 15,
        sortBy: 'created_at',
        sortDir: 'desc',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    const fetchPatients = async () => {

        setLoading(true);
        try {
            const response = await patientService.getPatients(filters);
            setPatients(Array.isArray(response) ? response : (response.items || []));
            // Assuming response structure has meta, if not fallbacks
            setMeta({
                page: filters.page || 1,
                totalPages: response.meta?.totalPages || response.totalPages || 1,
                total: response.meta?.total || response.total || (response.items?.length || 0)
            });
        } catch (error) {
            console.error("Failed to fetch patients", error);
            toast.error("Failed to load patients");
        } finally {
            setLoading(false);
        }
    };

    // Debounce search/filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleFilterChange = (newFilters: PatientFilter) => {
        setFilters({ ...newFilters, page: 1 });
    };

    const handleClearFilters = () => {
        const today = new Date();
        setSelectedDate(today);
        setFilters({
            page: 1,
            pageSize: 15,
            sortBy: 'created_at',
            sortDir: 'desc',
            date: format(today, 'yyyy-MM-dd')
        });
    };

    const handleRemoveFilter = (key: keyof PatientFilter) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        setFilters({ ...newFilters, page: 1 });
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > meta.totalPages) return;
        setFilters(prev => ({ ...prev, page }));
    };

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date);
        setFilters(prev => ({
            ...prev,
            date: date ? format(date, 'yyyy-MM-dd') : undefined,
            page: 1
        }));
    };


    const columns = [
        { key: "full_name", header: "Name" },
        { key: "gender", header: "Gender", render: (p: any) => <span className="capitalize">{p.gender}</span> },
        { key: "age", header: "Age", render: (p: any) => p.age || 'N/A' },
        { key: "blood_group", header: "Blood Group" },
        { key: "phone", header: "Contact" },
        {
            key: "status", header: "Status", render: (p: any) => (
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                    {p.status}
                </Badge>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (p: any) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <ConsultationActions patient={p} />
                    <PatientDetailsDialog patientId={p.uhid} patient={p} showMedicalRecords={true}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs">
                            View Details
                        </Button>
                    </PatientDetailsDialog>
                </div>
            )
        }
    ];

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            My Patients
                        </h1>
                        <p className="text-muted-foreground">Patients under your care</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div>
                                <CardTitle>Patient List</CardTitle>
                                <CardDescription>Total {meta.total} registered patients assigned to you</CardDescription>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <DatePicker
                                    date={selectedDate}
                                    setDate={handleDateChange}
                                    placeholder="Filter by Date"
                                />
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-8"
                                        value={filters.search || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    />
                                </div>
                                <Button variant="outline" size="icon" onClick={() => setIsFilterOpen(true)}>
                                    <FilterIcon className="h-4 w-4" />
                                </Button>
                                <SavedViews currentFilters={filters} onApply={handleFilterChange} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <FilterChips
                            filters={filters}
                            onRemove={handleRemoveFilter}
                            onClearAll={handleClearFilters}
                        />

                        {loading ? (
                            <div className="flex justify-center p-4">Loading...</div>
                        ) : (
                            <DataTable
                                data={patients}
                                columns={columns}
                                onRowClick={(p: any) => navigate(`/doctor/patients/${p.uhid}/encounter`)}
                                emptyMessage="No patients found matching your filters"
                            />
                        )}

                        {/* Pagination */}
                        {meta.totalPages > 1 && (
                            <div className="mt-4 flex justify-end">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => handlePageChange((filters.page || 1) - 1)}
                                                className={filters.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>

                                        <div className="flex items-center px-4 text-sm font-medium">
                                            Page {filters.page} of {meta.totalPages}
                                        </div>

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => handlePageChange((filters.page || 1) + 1)}
                                                className={filters.page === meta.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <PatientFilterPanel
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    filters={filters}
                    onApply={handleFilterChange}
                    onClear={handleClearFilters}
                />
            </div>
        </DashboardLayout>
    );
}
