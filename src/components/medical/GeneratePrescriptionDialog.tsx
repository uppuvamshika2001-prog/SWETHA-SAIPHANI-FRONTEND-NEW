import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pill, Search } from "lucide-react";
import { usePrescriptions, Prescription } from "@/contexts/PrescriptionContext";
import { usePatients } from "@/contexts/PatientContext";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function GeneratePrescriptionDialog() {
    const [open, setOpen] = useState(false);
    const { addPrescription } = usePrescriptions();
    const { patients } = usePatients();
    const { user, profile } = useAuth();

    const [formData, setFormData] = useState({
        patientId: "",
        patientName: "",
        diagnosis: "",
    });

    const [selectedPatientUhid, setSelectedPatientUhid] = useState<string>("");

    const [items, setItems] = useState<Array<{
        id: string;
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        quantity: number;
    }>>([
        { id: '1', name: '', dosage: '', frequency: '', duration: '', quantity: 1 }
    ]);

    const handlePatientLookup = () => {
        if (!formData.patientId) return;
        const patient = patients.find(p =>
            (p.uhid && p.uhid.toLowerCase() === formData.patientId.toLowerCase()) ||
            (p.full_name && p.full_name.toLowerCase().includes(formData.patientId.toLowerCase()))
        );

        if (patient) {
            setFormData(prev => ({ ...prev, patientName: patient.full_name, patientId: patient.uhid }));
            setSelectedPatientUhid(patient.uhid); // Store UHID
            toast.success(`Patient found: ${patient.full_name}`);
        } else {
            toast.error("Patient not found");
            setSelectedPatientUhid("");
        }
    };

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), name: '', dosage: '', frequency: '', duration: '', quantity: 1 }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleSubmit = async () => {
        if (!formData.patientName || !formData.diagnosis) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!selectedPatientUhid) {
            toast.error("Please search and select a valid patient");
            return;
        }

        if (items.some(i => !i.name)) {
            toast.error("Please enter medicine names");
            return;
        }

        const newPrescription: any = {
            id: `pres-${Date.now()}`,
            order_id: `RX-${Math.floor(Math.random() * 10000)}`,
            patient_id: selectedPatientUhid, // Use UHID
            patient_name: formData.patientName,
            doctor_id: user?.id || 'unknown',
            doctor_name: profile?.full_name || user?.full_name || user?.email || 'Doctor',
            diagnosis: formData.diagnosis,
            items: items.map(i => ({
                medicine_id: `med-${Math.floor(Math.random() * 10000)}`,
                medicine_name: i.name,
                dosage: i.dosage,
                frequency: i.frequency,
                duration: i.duration,
                quantity: i.quantity,
                unit_price: 0,
                total_price: 0
            })),
            total_amount: 0,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        try {
            await addPrescription(newPrescription);
            setOpen(false);
            // Reset form
            setFormData({ patientId: "", patientName: "", diagnosis: "" });
            setSelectedPatientUhid("");
            setItems([{ id: '1', name: '', dosage: '', frequency: '', duration: '', quantity: 1 }]);
        } catch (e) {
            // Toast handled in context
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate New Prescription</DialogTitle>
                    <DialogDescription>Enter patient details and medications</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patientId">Patient ID / Search</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="patientId"
                                    placeholder="Enter ID or Name"
                                    value={formData.patientId}
                                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                    onBlur={handlePatientLookup}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handlePatientLookup}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="patientName">Patient Name</Label>
                            <Input
                                id="patientName"
                                placeholder="Patient Name"
                                value={formData.patientName}
                                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnosis</Label>
                        <Textarea
                            id="diagnosis"
                            placeholder="Clinical diagnosis and notes"
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        />
                    </div>

                    <div className="space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                Medications
                            </h4>
                            <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Medicine
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-end border-b pb-4 last:border-0 last:pb-0">
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-xs">Medicine Name</Label>
                                    <Input
                                        placeholder="Name"
                                        value={item.name}
                                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Dosage</Label>
                                    <Input
                                        placeholder="e.g. 500mg"
                                        value={item.dosage}
                                        onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Freq</Label>
                                    <Input
                                        placeholder="1-0-1"
                                        value={item.frequency}
                                        onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Duration</Label>
                                    <Input
                                        placeholder="5 days"
                                        value={item.duration}
                                        onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Qty</Label>
                                    <Input
                                        type="number"
                                        placeholder="10"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Generate Prescription</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
