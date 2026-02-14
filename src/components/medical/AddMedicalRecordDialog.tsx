import { useState, ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Search,
    Loader2,
    Plus,
    Trash2,
    User,
    Calendar,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '@/services/patientService';
import { medicalRecordService, CreateMedicalRecordInput } from '@/services/medicalRecordService';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types';
import { format } from 'date-fns';

interface PrescriptionItem {
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
}

interface AddMedicalRecordDialogProps {
    children: ReactNode;
    onSuccess?: () => void;
}

export function AddMedicalRecordDialog({ children, onSuccess }: AddMedicalRecordDialogProps) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    // Patient lookup state
    const [searchQuery, setSearchQuery] = useState('');
    const [patient, setPatient] = useState<Patient | null>(null);
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [lookupError, setLookupError] = useState('');

    // Form state
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setSearchQuery('');
        setPatient(null);
        setSearchResults([]);
        setShowResults(false);
        setLookupError('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setSymptoms('');
        setDiagnosis('');
        setTreatment('');
        setPrescriptions([]);
    };

    const handlePatientLookup = async () => {
        if (!searchQuery.trim()) {
            setLookupError('Please enter a Name or UHID');
            return;
        }

        setLookingUp(true);
        setLookupError('');
        setPatient(null);
        setSearchResults([]);
        setShowResults(false);

        try {
            // First try direct UHID lookup if it looks like one
            if (/^[A-Z]*\d+$/.test(searchQuery.trim())) {
                try {
                    const patientData = await patientService.getPatientById(searchQuery.trim());
                    if (patientData) {
                        setPatient(patientData);
                        setSearchQuery(patientData.uhid || '');
                        toast.success('Patient found');
                        setLookingUp(false);
                        return;
                    }
                } catch (e) {
                    // Ignore and fall back to general search
                }
            }

            // General search by name or UHID
            const response = await patientService.getPatients({ search: searchQuery.trim() });
            const foundPatients = response.items || [];

            if (foundPatients.length === 0) {
                setLookupError('No patients found matching your search.');
            } else if (foundPatients.length === 1) {
                setPatient(foundPatients[0]);
                setSearchQuery(foundPatients[0].uhid || '');
                toast.success('Patient found');
            } else {
                setSearchResults(foundPatients);
                setShowResults(true);
            }
        } catch (error) {
            console.error('Patient lookup failed:', error);
            setLookupError('An error occurred while searching. Please try again.');
        } finally {
            setLookingUp(false);
        }
    };

    const handleSelectPatient = (p: Patient) => {
        setPatient(p);
        setSearchQuery(p.uhid || '');
        setSearchResults([]);
        setShowResults(false);
    };

    const addPrescriptionRow = () => {
        if (!patient) {
            toast.error("Please lookup a patient first to add prescriptions");
            return;
        }
        setPrescriptions([
            ...prescriptions,
            { medicine: '', dosage: '', frequency: '', duration: '', notes: '' }
        ]);
        // Optional: toast.success("Medicine row added");
    };

    const removePrescriptionRow = (index: number) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const updatePrescription = (index: number, field: keyof PrescriptionItem, value: string) => {
        const updated = [...prescriptions];
        updated[index] = { ...updated[index], [field]: value };
        setPrescriptions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!patient) {
            toast.error('Please lookup and select a patient first');
            return;
        }

        if (!diagnosis.trim()) {
            toast.error('Diagnosis is required');
            return;
        }

        setSubmitting(true);

        try {
            const recordData: CreateMedicalRecordInput = {
                patientId: patient.uhid,
                doctorId: user?.id || '',
                chiefComplaint: symptoms,
                diagnosis: diagnosis,
                treatmentNotes: treatment,
                prescriptions: prescriptions
                    .filter(p => p.medicine.trim())
                    .map(p => ({
                        medicineName: p.medicine,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        instructions: p.notes
                    })),
            };

            await medicalRecordService.createRecord(recordData);

            toast.success('Medical record created successfully');
            setOpen(false);
            resetForm();
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create medical record:', error);
            toast.error('Failed to save medical record. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const isFormDisabled = !patient;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Add Medical Record</DialogTitle>
                    <DialogDescription>
                        Create a new medical record entry for a patient.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Lookup Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Patient Information
                        </h3>

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="Enter Patient Name or UHID"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePatientLookup())}
                                />
                                {showResults && searchResults.length > 0 && (
                                    <Card className="absolute z-50 w-full mt-1 shadow-lg max-h-60 overflow-y-auto border-primary/20">
                                        <div className="p-1">
                                            {searchResults.map((p) => (
                                                <div
                                                    key={p.uhid}
                                                    className="p-3 hover:bg-accent rounded-sm cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors"
                                                    onClick={() => handleSelectPatient(p)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm">{p.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{p.uhid} • {p.gender} • {p.age}y</span>
                                                    </div>
                                                    <Plus className="h-4 w-4 text-primary" />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handlePatientLookup}
                                disabled={lookingUp}
                            >
                                {lookingUp ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Lookup</span>
                            </Button>
                        </div>

                        {lookupError && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {lookupError}
                            </div>
                        )}

                        {patient && (
                            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="font-medium text-green-700 dark:text-green-400">Patient Found</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Name</span>
                                            <p className="font-medium">{patient.full_name}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Age / Gender</span>
                                            <p className="font-medium">{patient.age} yrs / {patient.gender}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Contact</span>
                                            <p className="font-medium">{patient.phone}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Blood Group</span>
                                            <p className="font-medium">{patient.blood_group || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {patient.allergies && patient.allergies.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-muted-foreground text-sm">Allergies: </span>
                                            <span className="text-destructive font-medium">{patient.allergies.join(', ')}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Separator />

                    {/* Medical Details Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Medical Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={isFormDisabled}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="symptoms">Symptoms / Chief Complaint</Label>
                            <Textarea
                                id="symptoms"
                                placeholder="Describe the patient's symptoms..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                disabled={isFormDisabled}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="diagnosis">Diagnosis *</Label>
                            <Textarea
                                id="diagnosis"
                                placeholder="Enter clinical diagnosis..."
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                disabled={isFormDisabled}
                                required
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="treatment">Treatment Plan</Label>
                            <Textarea
                                id="treatment"
                                placeholder="Treatment notes and plan..."
                                value={treatment}
                                onChange={(e) => setTreatment(e.target.value)}
                                disabled={isFormDisabled}
                                rows={3}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Prescriptions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Prescriptions</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPrescriptionRow}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Medicine
                            </Button>
                        </div>

                        {prescriptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No prescriptions added. Click "Add Medicine" to add.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map((prescription, index) => (
                                    <Card key={index} className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                                                <div className="md:col-span-2">
                                                    <Label className="text-xs">Medicine Name *</Label>
                                                    <Input
                                                        placeholder="e.g., Metformin"
                                                        value={prescription.medicine}
                                                        onChange={(e) => updatePrescription(index, 'medicine', e.target.value)}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Dosage</Label>
                                                    <Input
                                                        placeholder="e.g., 500mg"
                                                        value={prescription.dosage}
                                                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Frequency</Label>
                                                    <Input
                                                        placeholder="e.g., 1-0-1"
                                                        value={prescription.frequency}
                                                        onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Duration</Label>
                                                    <Input
                                                        placeholder="e.g., 30 days"
                                                        value={prescription.duration}
                                                        onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                                                        disabled={isFormDisabled}
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive mt-5"
                                                onClick={() => removePrescriptionRow(index)}
                                                disabled={isFormDisabled}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-2">
                                            <Label className="text-xs">Notes (optional)</Label>
                                            <Input
                                                placeholder="Additional instructions..."
                                                value={prescription.notes}
                                                onChange={(e) => updatePrescription(index, 'notes', e.target.value)}
                                                disabled={isFormDisabled}
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isFormDisabled || submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Record'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
