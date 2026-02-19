import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Download, Filter as FilterIcon, Search, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PatientRegistrationDialog } from "@/components/patients/PatientRegistrationDialog";
import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";
import { printPatientCard } from "@/utils/printPatientCard";
import { downloadPatientCardPDF } from "@/utils/downloadPatientPDF";
import { PatientFilterPanel } from "@/components/patients/PatientFilterPanel";
import { FilterChips } from "@/components/patients/FilterChips";
import { SavedViews } from "@/components/patients/SavedViews";
import { PatientFilter } from "@/types/filters";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types";
import { Input } from "@/components/ui/input";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function AdminPatients() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Date Filtering State (Default: None for "All Patients" view)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    // Filter State
    const [filters, setFilters] = useState<PatientFilter>({
        page: 1,
        pageSize: 100,
        sortBy: 'created_at',
        sortDir: 'desc',
        date: undefined
    });

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);


    const columns = [
        { key: "uhid", header: "ID" },
        { key: "full_name", header: "Name" },
        { key: "gender", header: "Gender", render: (p: any) => <span className="capitalize">{p.gender}</span> },
        { key: "phone", header: "Phone" },
        { key: "blood_group", header: "Blood Group" },
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
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedPatientId(p.uhid);
                        setShowDetailsDialog(true);
                    }}>View Details</Button>

                    <Button variant="outline" size="sm" onClick={() => downloadPatientCardPDF(p)}>
                        <Download className="h-4 w-4" />
                    </Button>

                    <PatientRegistrationDialog patientToEdit={p} onRegister={() => fetchPatients()}>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </PatientRegistrationDialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete the record for <strong>{p.full_name}</strong>? This action cannot be undone and will remove all associated data, including bills and prescriptions.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(p.uhid)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )
        }
    ];

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await patientService.getPatients(filters);
            setPatients(response.items || []);
            // Assuming response structure has meta, if not fallbacks
            setMeta({
                page: filters.page || 1,
                totalPages: response.meta?.totalPages || response.totalPages || 1,
                total: response.meta?.total || response.total || (response.items?.length || 0)
            });
        } catch (error) {
            console.error("Failed to fetch patients", error);
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
        setFilters({ ...newFilters, page: 1 }); // Reset to page 1 on filter change
    };

    const handleClearFilters = () => {
        setSelectedDate(undefined);
        setFilters({
            page: 1,
            pageSize: 15,
            sortBy: 'created_at',
            sortDir: 'desc',
            date: undefined,
            search: ''
        });
    };


    const handleRemoveFilter = (key: keyof PatientFilter) => {
        if (key === 'date') {
            setSelectedDate(undefined);
        }
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

    const handleDelete = async (uhid: string) => {
        try {
            await patientService.deletePatient(uhid);
            toast.success("Patient record deleted successfully");
            fetchPatients(); // Refresh the list
        } catch (error) {
            console.error("Failed to delete patient", error);
            toast.error("Failed to delete patient record");
        }
    };


    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Patient Management
                        </h1>
                        <p className="text-muted-foreground">View and manage patient records</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PatientRegistrationDialog onRegister={() => fetchPatients()}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Register Patient
                            </Button>
                        </PatientRegistrationDialog>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div>
                                <CardTitle>All Patients</CardTitle>
                                <CardDescription>Total {meta.total} registered patients</CardDescription>
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

                        <DataTable
                            data={patients}
                            columns={columns}
                            onRowClick={(p: any) => navigate(`/admin/patients/${p.uhid}/encounter`)}
                            emptyMessage={loading ? "Loading..." : "No patients found matching your filters"}
                        />

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

                <PatientDetailsDialog
                    open={showDetailsDialog}
                    onOpenChange={setShowDetailsDialog}
                    patientId={selectedPatientId || undefined}
                    patient={patients.find(p => p.uhid === selectedPatientId)}
                    showMedicalRecords={true}
                />
            </div>
        </DashboardLayout>
    );
}
