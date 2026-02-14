import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Plus, Save, ArrowLeft, Loader2 } from "lucide-react";
import { usePrescriptions, Prescription, PrescriptionItem } from '@/contexts/PrescriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { pharmacyService } from '@/services/pharmacyService';
import { labService } from '@/services/labService';
import { medicalRecordService, CreateMedicalRecordInput } from '@/services/medicalRecordService';
import { Appointment, Patient } from '@/types';

export default function Consultation() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const { addPrescription } = usePrescriptions();
    const { user } = useAuth();

    // Data state
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [labTests, setLabTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [diagnosis, setDiagnosis] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [notes, setNotes] = useState('');

    // Vitals State
    const [vitals, setVitals] = useState({
        bpSystolic: '',
        bpDiastolic: '',
        temperature: '',
        pulse: '',
        weight: ''
    });

    // Prescription State
    const [selectedMedicine, setSelectedMedicine] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [prescriptions, setPrescriptions] = useState<{ id: string, name: string, dosage: string, frequency: string, duration: string }[]>([]);

    // Lab Order State
    const [selectedLabTest, setSelectedLabTest] = useState('');
    const [orderedLabTests, setOrderedLabTests] = useState<{ id: string, name: string }[]>([]);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch appointment
                const appointments = await appointmentService.getAppointments();
                const apt = appointments.find(a => a.id === appointmentId) || appointments[0];
                setAppointment(apt);

                // Fetch patient
                if (apt?.patient_id) {
                    try {
                        const patientData = await patientService.getPatientById(apt.patient_id);
                        setPatient(patientData);
                    } catch {
                        // Fallback if specific patient fetch fails
                        const response: any = await patientService.getPatients();
                        const allPatients = Array.isArray(response) ? response : (response.items || []);
                        setPatient(allPatients.find((p: any) => p.uhid === apt.patient_id) || allPatients[0]);
                    }
                }

                // Fetch medicines
                try {
                    const medsResponse: any = await pharmacyService.getMedicines();
                    setMedicines(medsResponse?.items || medsResponse || []);
                } catch {
                    setMedicines([]);
                }

                // Fetch lab tests
                try {
                    const testsResponse: any = await labService.getLabTests();
                    setLabTests(testsResponse?.items || testsResponse || []);
                } catch {
                    setLabTests([]);
                }
            } catch (error) {
                console.error("Failed to load consultation data:", error);
                toast.error("Failed to load consultation data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [appointmentId]);

    const handleAddMedicine = () => {
        if (!selectedMedicine || !dosage || !frequency || !duration) {
            toast.error("Please fill all medicine details");
            return;
        }
        const med = medicines.find(m => m.id === selectedMedicine);
        if (med) {
            setPrescriptions([...prescriptions, {
                id: med.id,
                name: med.name,
                dosage,
                frequency,
                duration
            }]);
            // Reset fields
            setSelectedMedicine('');
            setDosage('');
            setFrequency('');
            setDuration('');
        }
    };

    const handleRemoveMedicine = (index: number) => {
        const newPrescriptions = [...prescriptions];
        newPrescriptions.splice(index, 1);
        setPrescriptions(newPrescriptions);
    };

    const handleAddLabTest = () => {
        if (!selectedLabTest) return;
        const test = labTests.find(t => t.id === selectedLabTest);
        if (test && !orderedLabTests.find(t => t.id === test.id)) {
            setOrderedLabTests([...orderedLabTests, { id: test.id, name: test.name }]);
            setSelectedLabTest('');
        }
    };

    const handleRemoveLabTest = (id: string) => {
        setOrderedLabTests(orderedLabTests.filter(t => t.id !== id));
    };

    const handleSaveConsultation = async () => {
        if (!diagnosis) {
            toast.error("Diagnosis is required");
            return;
        }

        if (!patient || !appointment) {
            toast.error("Patient or appointment data missing");
            return;
        }

        setSaving(true);

        try {
            // Create medical record via API
            const recordData: CreateMedicalRecordInput = {
                patientId: patient.uhid,
                doctorId: user?.id || appointment.doctor_id,
                appointmentId: appointment.id,
                chiefComplaint: symptoms,
                diagnosis: diagnosis,
                treatmentNotes: notes,
                vitals: vitals.bpSystolic ? {
                    bloodPressureSystolic: parseInt(vitals.bpSystolic) || undefined,
                    bloodPressureDiastolic: parseInt(vitals.bpDiastolic) || undefined,
                    heartRate: parseInt(vitals.pulse) || undefined,
                    temperature: parseFloat(vitals.temperature) || undefined,
                    weight: parseFloat(vitals.weight) || undefined,
                } : undefined,
                prescriptions: prescriptions.map(p => ({
                    medicineName: p.name,
                    dosage: p.dosage,
                    frequency: p.frequency,
                    duration: p.duration
                })),
                labOrders: orderedLabTests.map(t => t.id)
            };

            await medicalRecordService.createRecord(recordData);

            // Save prescriptions to context for pharmacy (existing functionality)
            if (prescriptions.length > 0) {
                const prescriptionItems: PrescriptionItem[] = prescriptions.map(p => {
                    const med = medicines.find(m => m.id === p.id);
                    return {
                        medicine_id: p.id,
                        medicine_name: p.name,
                        dosage: p.dosage,
                        frequency: p.frequency,
                        duration: p.duration,
                        quantity: 1,
                        unit_price: med?.unit_price || med?.unitPrice || 0,
                        total_price: med?.unit_price || med?.unitPrice || 0
                    };
                });

                const newPrescription: Prescription = {
                    id: Math.random().toString(36).substr(2, 9),
                    order_id: 'RX-' + Date.now().toString().slice(-6),
                    patient_id: patient.uhid,
                    patient_name: patient.full_name,
                    doctor_id: user?.id || appointment.doctor_id,
                    doctor_name: appointment.doctor_name,
                    diagnosis: diagnosis,
                    items: prescriptionItems,
                    total_amount: prescriptionItems.reduce((sum, item) => sum + item.total_price, 0),
                    status: 'pending',
                    created_at: new Date().toISOString()
                };

                addPrescription(newPrescription);
            }

            toast.success("Consultation saved successfully!", {
                description: "Medical record created and synced."
            });

            // Navigate back to dashboard after delay
            setTimeout(() => navigate('/doctor/dashboard'), 1500);
        } catch (error) {
            console.error("Failed to save consultation:", error);
            toast.error("Failed to save consultation. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="doctor">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/dashboard')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Consultation</h1>
                        <p className="text-muted-foreground">Appointment #{appointment?.appointment_id}</p>
                    </div>
                </div>

                {/* Patient Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Name</p>
                            <p className="font-medium">{patient?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Age / Gender</p>
                            <p className="font-medium">
                                {patient?.age || '-'} yrs / {patient?.gender || '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Blood Group</p>
                            <p className="font-medium">{patient?.blood_group || '-'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Known Allergies</p>
                            <p className="font-medium text-destructive">{patient?.allergies?.join(', ') || 'None'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vitals & Diagnosis */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Vitals & Symptoms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>BP (Systolic/Diastolic)</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="120" value={vitals.bpSystolic} onChange={e => setVitals({ ...vitals, bpSystolic: e.target.value })} />
                                        <span className="self-center">/</span>
                                        <Input placeholder="80" value={vitals.bpDiastolic} onChange={e => setVitals({ ...vitals, bpDiastolic: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Pulse (bpm)</Label>
                                    <Input placeholder="72" value={vitals.pulse} onChange={e => setVitals({ ...vitals, pulse: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Temperature (°F)</Label>
                                    <Input placeholder="98.6" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input placeholder="70" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Symptoms</Label>
                                <Textarea placeholder="Patient complaints..." value={symptoms} onChange={e => setSymptoms(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Diagnosis & Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Clinical Diagnosis *</Label>
                                <Input placeholder="e.g. Acute Bronchitis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Clinical Notes</Label>
                                <Textarea className="min-h-[150px]" placeholder="Detailed observations..." value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Prescriptions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Prescription</CardTitle>
                        <CardDescription>Add medicines for the patient</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-5 gap-4 items-end bg-muted/30 p-4 rounded-lg">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Medicine</Label>
                                <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select medicine" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {medicines.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Dosage</Label>
                                <Input placeholder="e.g. 500mg" value={dosage} onChange={e => setDosage(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select value={frequency} onValueChange={setFrequency}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Freq" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-0-0">1-0-0 (Morning)</SelectItem>
                                        <SelectItem value="1-0-1">1-0-1 (Morn-Night)</SelectItem>
                                        <SelectItem value="1-1-1">1-1-1 (TDS)</SelectItem>
                                        <SelectItem value="0-0-1">0-0-1 (Night)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input placeholder="e.g. 5 days" value={duration} onChange={e => setDuration(e.target.value)} />
                            </div>
                            <Button onClick={handleAddMedicine} className="w-full">
                                <Plus className="h-4 w-4 mr-2" /> Add
                            </Button>
                        </div>

                        {prescriptions.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Dosage</TableHead>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prescriptions.map((p, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell>{p.dosage}</TableCell>
                                            <TableCell>{p.frequency}</TableCell>
                                            <TableCell>{p.duration}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveMedicine(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Lab Orders */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lab Orders</CardTitle>
                        <CardDescription>Prescribe lab tests if necessary</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Select value={selectedLabTest} onValueChange={setSelectedLabTest}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select lab test to order" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {labTests.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddLabTest}>
                                <Plus className="h-4 w-4 mr-2" /> Add Test
                            </Button>
                        </div>

                        {orderedLabTests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {orderedLabTests.map(test => (
                                    <div key={test.id} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                        {test.name}
                                        <button onClick={() => handleRemoveLabTest(test.id)} className="hover:text-destructive">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-4 container max-w-7xl mx-auto z-10">
                    <Button variant="outline" onClick={() => navigate('/doctor/dashboard')}>Cancel</Button>
                    <Button onClick={handleSaveConsultation} className="min-w-[150px]" disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Saving...' : 'Complete & Save'}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
