import { useState } from "react";
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
import { Plus, FlaskConical, Search, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLab } from "@/contexts/LabContext";
import { api } from "@/services/api";

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

    // Patient state
    const [patientSearch, setPatientSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
    const [searchResults, setSearchResults] = useState<PatientInfo[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Test state
    const [testName, setTestName] = useState("");
    const [priority, setPriority] = useState<"normal" | "urgent" | "stat">("normal");
    const [notes, setNotes] = useState("");

    const { createLabOrder } = useLab();

    const handlePatientSearch = async () => {
        if (!patientSearch.trim()) {
            toast.error("Please enter a UHID or patient name to search");
            return;
        }

        setSearchLoading(true);
        setShowResults(true);
        try {
            // Search by UHID or name using the patients API
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
        setPatientSearch("");
        setSearchResults([]);
        setShowResults(false);
    };

    const handleSubmit = async () => {
        if (!selectedPatient) {
            toast.error("Please select a patient");
            return;
        }
        if (!testName.trim()) {
            toast.error("Please enter a lab test name");
            return;
        }

        setLoading(true);
        try {
            await createLabOrder({
                patientId: selectedPatient.uhid,
                testName: testName.trim(),
                priority,
                notes: notes || undefined,
            });
            toast.success("Lab order created successfully");
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
        setTestName("");
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
                        <Label>Patient *</Label>
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
                                            <div className="p-4 text-center text-muted-foreground">
                                                No patients found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lab Test - Manual Entry */}
                    <div className="space-y-2">
                        <Label>Lab Test Name *</Label>
                        <Input
                            placeholder="e.g., Complete Blood Count, Lipid Profile, Thyroid Test..."
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the name of the lab test to be performed
                        </p>
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
                    <Button onClick={handleSubmit} disabled={loading || !selectedPatient || !testName.trim()}>
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
