import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, FlaskConical, Search, User, Loader2, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useLab } from "@/contexts/LabContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { staffService } from "@/services/staffService";
import { WalkInLabPatientDialog } from "@/components/patients/WalkInLabPatientDialog";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { LabTest } from "@/types";

interface PatientInfo {
    uhid: string; // The primary identifier
    firstName: string;
    lastName: string;
    phone: string;
}

export function CreateLabOrderDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const { user } = useAuth();
    const isReceptionist = user?.role === 'receptionist';

    // Patient state
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
    const [isWalkInLab, setIsWalkInLab] = useState(false);
    const [searchResults, setSearchResults] = useState<PatientInfo[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Test state
    const [selectedTests, setSelectedTests] = useState<(LabTest | { id: string, name: string, code?: string })[]>([]);
    const [priority, setPriority] = useState<"normal" | "urgent" | "stat">("normal");
    const [notes, setNotes] = useState("");
    
    // Doctor state
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

    const { createLabOrder } = useLab();

    useEffect(() => {
        if (open) {
            const fetchDoctors = async () => {
                try {
                    const staff = await staffService.getStaff();
                    const activeDoctors = staff.filter((s: any) => s.role === 'doctor');
                    setDoctors(activeDoctors);
                } catch (error) {
                    console.error("Failed to fetch doctors:", error);
                }
            };
            fetchDoctors();
        }
    }, [open]);

    const handlePatientSearch = async () => {
        if (!patientSearch.trim()) {
            toast.error("Please enter a UHID or patient name to search");
            return;
        }

        setSearchLoading(true);
        setShowResults(true);
        try {
            const response = await api.get<{ items: PatientInfo[] }>(`/patients?search=${encodeURIComponent(patientSearch)}&limit=10`);
            setSearchResults(response.items || []);
            if ((response.items || []).length === 0) {
                toast.info("No patients found matching your search");
            }
        } catch (error: any) {
            console.error("Patient search error:", error);
            toast.error("Failed to search patients. Please try again.");
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectPatient = (patient: PatientInfo) => {
        setSelectedPatient(patient);
        setIsWalkInLab(false);
        setPatientSearch("");
        setSearchResults([]);
        setShowResults(false);
    };

    const handleSearchTests = async (q: string) => {
        try {
            const response = await api.get<LabTest[]>(`/lab/tests?search=${encodeURIComponent(q)}`);
            return response;
        } catch (error) {
            console.error("Search tests error:", error);
            return [];
        }
    };

    const handleSubmit = async () => {
        if (!selectedPatient) {
            toast.error("Please select a patient");
            return;
        }

        if (selectedTests.length === 0) {
            toast.error("Please select at least one lab test");
            return;
        }

        if (!isReceptionist && !selectedDoctorId) {
            // If not receptionist, doctor selection might be required depending on flow, 
            // but for doctor role it defaults to self on backend usually.
            // For now let's allow optional if receptionist.
        }

        setLoading(true);
        try {
            // Create separate orders for each test for structured results
            for (const test of selectedTests) {
                await createLabOrder({
                    patientId: selectedPatient.uhid,
                    testId: test.id.length > 10 ? test.id : undefined, // UUID check
                    testName: test.name,
                    testCode: (test as any).code,
                    doctorId: selectedDoctorId || undefined,
                    priority,
                    notes: notes || undefined,
                    isWalkInLab: isWalkInLab,
                });
            }
            
            toast.success(`${selectedTests.length} Lab order(s) created successfully`);
            setOpen(false);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to create lab order");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedPatient(null);
        setSelectedTests([]);
        setSelectedDoctorId("");
        setPriority("normal");
        setNotes("");
        setPatientSearch("");
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Order Lab Test
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        Order Lab Test
                    </DialogTitle>
                    <DialogDescription>
                        Create a new lab test order for a patient
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Patient *</Label>
                            {!selectedPatient && (
                                <WalkInLabPatientDialog onPatientCreated={(patient) => {
                                    setSelectedPatient({
                                        uhid: patient.uhid,
                                        firstName: patient.full_name.split(' ')[0],
                                        lastName: patient.full_name.split(' ').slice(1).join(' '),
                                        phone: patient.phone,
                                    });
                                    setIsWalkInLab(true);
                                    setShowResults(false);
                                }} />
                            )}
                        </div>
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedPatient.uhid || 'No UHID'} · {selectedPatient.phone}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>
                                    Change
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter UHID or Patient Name..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handlePatientSearch}
                                        disabled={searchLoading}
                                    >
                                        {searchLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {showResults && (
                                    <div className="max-h-40 overflow-y-auto border rounded-md">
                                        {searchLoading ? (
                                            <div className="p-4 text-center text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                                                Searching...
                                            </div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y">
                                                {searchResults.map((patient) => (
                                                    <button
                                                        key={patient.uhid}
                                                        className="w-full p-3 text-left hover:bg-muted flex justify-between items-center"
                                                        onClick={() => handleSelectPatient(patient)}
                                                    >
                                                        <div>
                                                            <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                                                            <p className="text-xs text-muted-foreground">{patient.phone}</p>
                                                        </div>
                                                        <span className="text-xs bg-muted px-2 py-1 rounded">{patient.uhid || 'No UHID'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center space-y-2">
                                                <p className="text-muted-foreground">No patients found</p>
                                                <WalkInLabPatientDialog onPatientCreated={(patient) => {
                                                    setSelectedPatient({
                                                        uhid: patient.uhid,
                                                        firstName: patient.full_name.split(' ')[0],
                                                        lastName: patient.full_name.split(' ').slice(1).join(' '),
                                                        phone: patient.phone,
                                                    });
                                                    setShowResults(false);
                                                }}>
                                                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                                                        + Register Walk-in Lab Patient
                                                    </button>
                                                </WalkInLabPatientDialog>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lab Test - Searchable Selection */}
                    <div className="space-y-4">
                        <Label>Select Lab Test(s) *</Label>
                        <SearchableSelect<LabTest>
                            onSearch={handleSearchTests}
                            onSelect={(test) => {
                                if (selectedTests.some(t => t.id === test.id)) {
                                    toast.info(`${test.name} is already selected`);
                                    return;
                                }
                                setSelectedTests([...selectedTests, test]);
                            }}
                            renderItem={(test) => (
                                <div className="flex flex-col">
                                    <span>{test.name}</span>
                                    <span className="text-xs text-muted-foreground">{test.code} · {test.department}</span>
                                </div>
                            )}
                            getDisplayValue={() => ""}
                            placeholder="Type to search tests (e.g., CBP, LFT)..."
                            emptyMessage="No tests found in catalog"
                        />

                        {selectedTests.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {selectedTests.map((test, index) => (
                                    <div key={test.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{test.name}</span>
                                            <span className="text-xs text-muted-foreground">{test.code}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                            onClick={() => setSelectedTests(selectedTests.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Manual Entry Fallback */}
                        {selectedTests.length === 0 && (
                            <div className="pt-2 border-t mt-4 flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Or Manual Entry</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="manualTest"
                                        placeholder="Enter test name manually..." 
                                        className="text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.currentTarget as HTMLInputElement).value;
                                                if (val) {
                                                    setSelectedTests([...selectedTests, { id: `manual-${Date.now()}`, name: val }]);
                                                    (e.currentTarget as HTMLInputElement).value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            const input = document.getElementById('manualTest') as HTMLInputElement;
                                            if (input.value) {
                                                setSelectedTests([...selectedTests, { id: `manual-${Date.now()}`, name: input.value }]);
                                                input.value = "";
                                            }
                                        }}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-1">
                            Search from the catalog for structured results, or enter manually for others.
                        </p>
                    </div>

                    {/* Doctor Selection */}
                    <div className="space-y-2">
                        <Label>Consulting Doctor {isReceptionist ? "(Optional)" : "*"}</Label>
                        <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a doctor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                        <div className="flex items-center gap-2">
                                            <UserRound className="h-4 w-4 text-muted-foreground" />
                                            <span>Dr. {doctor.firstName} {doctor.lastName}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {doctors.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No active doctors found
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                        {isReceptionist && (
                            <p className="text-[10px] text-muted-foreground">
                                Leave blank to order as Receptionist without a specific doctor.
                            </p>
                        )}
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Routine</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                                <SelectItem value="stat">STAT (Emergency)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Clinical Notes (Optional)</Label>
                        <Textarea
                            placeholder="Any special instructions or clinical context..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedPatient || selectedTests.length === 0}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating...
                            </>
                        ) : (
                            "Create Order"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
