import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, User, Phone, Search } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";
import { appointmentService } from "@/services/appointmentService";
import { staffService } from "@/services/staffService";

interface AppointmentBookingDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultTrigger?: boolean;
    preSelectedDoctorId?: string;
    preSelectedPatient?: {
        uhid: string;
        full_name: string;
        phone: string;
    };
    onBook?: (appointment: any) => void;
}

export function AppointmentBookingDialog({
    children,
    open,
    onOpenChange,
    defaultTrigger = true,
    preSelectedDoctorId,
    preSelectedPatient,
    onBook
}: AppointmentBookingDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const { patients } = usePatients();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [step, setStep] = useState(1);
    const [department, setDepartment] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [patientSearch, setPatientSearch] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");

    // Initialize with preSelectedPatient if provided
    useEffect(() => {
        if (preSelectedPatient?.uhid) {
            setSelectedPatientId(preSelectedPatient.uhid);
        }
    }, [preSelectedPatient]);

    // Fetch doctors on mount
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const staff = await staffService.getStaff();
                const activeDoctors = staff.filter((s: any) => s.role === 'doctor');

                // Merge API doctors with predefined doctors to ensure all 9 specific doctors are always visible
                const mergedDoctors = [...activeDoctors.map(d => ({ ...d, isPredefined: false }))];

                predefinedDoctors.forEach(fallback => {
                    const exists = mergedDoctors.some(d =>
                        normalizeName(d.full_name) === normalizeName(fallback.full_name)
                    );
                    if (!exists) {
                        mergedDoctors.push({ ...fallback, isPredefined: true });
                    }
                });

                setDoctors(mergedDoctors);
            } catch (error) {
                console.error("Failed to fetch doctors", error);
                toast.error("Failed to load doctor list");
            }
        };
        fetchDoctors();
    }, []);

    // Effect to handle pre-selection
    useEffect(() => {
        if (preSelectedDoctorId && doctors.length > 0) {
            const doc = doctors.find(d => d.id === preSelectedDoctorId);
            if (doc) {
                setDepartment(doc.department);
                setSelectedDoctor(doc.id);
            }
        }
    }, [preSelectedDoctorId, open, internalOpen, doctors]);

    // ... (rest of predefinedDepartments, predefinedDoctors, allDoctors logic same as original) ...
    // Predefined departments as requested
    const predefinedDepartments = [
        "Orthopaedics",
        "Neurosurgeon",
        "General Physician",
        "Paediatric Orthopaedics",
        "Pulmonology",
        "Oncology",
        "Paediatric Hemato-Oncology"
    ];

    // Predefined doctors mapped to departments (with valid UUID format)
    // These are only shown as fallback if no doctors are fetched from the database
    const predefinedDoctors = [
        { id: '00000000-0000-0000-0000-000000000001', full_name: 'Dr. Ravikanti Nagaraju', department: 'General Physician', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000002', full_name: 'Dr. Roshan Kumar Jaiswal', department: 'Paediatric Orthopaedics', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000003', full_name: 'Dr. Swetha Pendyala', department: 'Neurosurgeon', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000004', full_name: 'Dr. B. Sai Phani Chandra', department: 'Orthopaedics', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000005', full_name: 'Dr. Hariprakash', department: 'Orthopaedics', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000006', full_name: 'Dr. Mahesh Gudelli', department: 'Pulmonology', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000007', full_name: 'Dr. Sneha Sagar', department: 'Oncology', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000008', full_name: 'Dr. T Dheeraj', department: 'Oncology', role: 'doctor', isPredefined: true },
        { id: '00000000-0000-0000-0000-000000000009', full_name: 'Dr. Navya Sri Yenigalla', department: 'Paediatric Hemato-Oncology', role: 'doctor', isPredefined: true },
    ];

    // Helper function to normalize name for comparison (remove extra spaces, lowercase)
    const normalizeName = (name: string) => name?.toLowerCase().replace(/\s+/g, '').trim() || '';

    // If we have doctors from the database, use ONLY those (no merging with predefined)
    // Only show predefined doctors as fallback when database returns empty
    // Use the merged doctors list (state) which includes both API and Fallback
    const allDoctors = doctors.length > 0 ? doctors : predefinedDoctors;

    // Department mapping for staff/doctors that may have different department names
    const getDepartmentMapping = (dept: string): string | null => {
        const deptLower = (dept || "").toLowerCase();
        if (deptLower.includes("oncology") && !deptLower.includes("paediatric")) return "Oncology";
        if (deptLower.includes("pulmonology")) return "Pulmonology";
        if (deptLower.includes("hemato") || deptLower.includes("paediatric hemato")) return "Paediatric Hemato-Oncology";
        if (deptLower.includes("ortho") && !deptLower.includes("paediatric")) return "Orthopaedics";
        if (deptLower.includes("general physician") || deptLower === "general physician" || deptLower.includes("general medicine")) return "General Physician";
        if (deptLower.includes("paediatric ortho") || deptLower.includes("pediatric ortho")) return "Paediatric Orthopaedics";
        if (deptLower.includes("neuro")) return "Neurosurgeon";
        return null;
    };

    const departments = Array.from(new Set([
        ...predefinedDepartments,
        ...allDoctors.map(d => getDepartmentMapping(d.department)).filter(Boolean) as string[]
    ])).filter(dept =>
        dept &&
        !['Neurology', 'Neurosurgen', 'Neurosurgern', 'Orthopedics'].includes(dept)
    );

    const availableDoctors = allDoctors.filter(d => !department || getDepartmentMapping(d.department) === department);

    // Filter patients based on search
    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.phone.includes(patientSearch) ||
        (p.uhid && p.uhid.toLowerCase().includes(patientSearch.toLowerCase()))
    ).slice(0, 5); // Limit to 5 results for cleaner UI

    // Use preSelectedPatient if available, otherwise find in list
    const selectedPatient = preSelectedPatient?.uhid === selectedPatientId
        ? (preSelectedPatient as any)
        : patients.find(p => p.uhid === selectedPatientId);

    const handleBook = async () => {
        // Predefined doctors are now allowed for booking as they represent local fallback data
        // which may still be valid for mock workflows.

        try {
            await appointmentService.createAppointment({
                patientId: selectedPatientId,
                doctorId: selectedDoctor,
                scheduledAt: `${date}T${time}:00`,
                duration: 10, // Default duration (10 mins)
                notes: `Payment Method: ${paymentMethod}`
            });

            // Re-find doctor for consistent display
            const bookedDoc = doctors.find(d => d.id === selectedDoctor) || predefinedDoctors.find(d => d.id === selectedDoctor);

            toast.success("Appointment booked successfully!", {
                description: `Scheduled for ${selectedPatient?.full_name} with ${bookedDoc?.full_name} on ${date}.`
            });

            if (onBook) {
                onBook({} as any); // Trigger refresh
            }

            // Reset and close
            setStep(1);
            setDepartment("");
            setSelectedDoctor("");
            if (!preSelectedPatient) {
                setSelectedPatientId("");
                setPatientSearch("");
            }
            setDate("");
            setTime("");
            setPaymentMethod("");

            if (setShowOpen) setShowOpen(false);

        } catch (error) {
            console.error("Booking failed", error);

            // Extract error message if available
            let errorMessage = "Please try again later.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast.error("Failed to book appointment", {
                description: errorMessage
            });
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Select Specialist";
            case 2: return "Select Patient";
            case 3: return "Choose Slot";
            case 4: return "Payment";
            default: return "Book Appointment";
        }
    };

    const getStepDescription = () => {
        switch (step) {
            case 1: return "Select department and doctor.";
            case 2: return "Search and select a registered patient.";
            case 3: return "Choose a date and time.";
            case 4: return "Select a payment method to confirm.";
            default: return "";
        }
    };

    // Helper for navigation
    const goNext = () => {
        if (step === 1 && preSelectedPatient) {
            // Skip patient selection if patient is pre-selected
            setStep(3);
        } else {
            setStep(step + 1);
        }
    };

    const goBack = () => {
        if (step === 3 && preSelectedPatient) {
            // Skip patient selection when going back too
            setStep(1);
        } else {
            setStep(step - 1);
        }
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            {defaultTrigger && (
                <DialogTrigger asChild>
                    {children || <Button>Book Appointment</Button>}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{getStepTitle()}</DialogTitle>
                    <DialogDescription>
                        {getStepDescription()}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 min-h-[300px]">
                    {step === 1 && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Select value={department} onValueChange={setDepartment}>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="doctor">Doctor</Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor} disabled={!department}>
                                    <SelectTrigger id="doctor">
                                        <SelectValue placeholder="Select doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDoctors.map((doc) => (
                                            <SelectItem key={doc.id} value={doc.id}>{doc.full_name} ({doc.department})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {step === 2 && !preSelectedPatient && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, phone or ID..."
                                    className="pl-9"
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto border rounded-md p-2">
                                {selectedPatientId ? (
                                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm">{selectedPatient?.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedPatient?.phone}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedPatientId("")}>
                                            Change
                                        </Button>
                                    </div>
                                ) : (
                                    filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient) => (
                                            <div
                                                key={patient.uhid}
                                                className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                                onClick={() => setSelectedPatientId(patient.uhid)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{patient.full_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {patient.phone}</span>
                                                            <span>|</span>
                                                            <span>{patient.uhid}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost">Select</Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            {patientSearch ? "No patients found." : "Search to find a patient."}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <div className="relative">
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">Time</Label>
                                <Select value={time} onValueChange={setTime}>
                                    <SelectTrigger id="time">
                                        <SelectValue placeholder="Select time slot" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {(() => {
                                            const slots = [];
                                            const periods = [
                                                { start: 9, end: 13 }, // 9 AM - 1 PM
                                                { start: 14, end: 20 } // 2 PM - 8 PM
                                            ];

                                            periods.forEach(({ start, end }) => {
                                                for (let hour = start; hour < end; hour++) {
                                                    for (let minute = 0; minute < 60; minute += 10) {
                                                        const h = hour.toString().padStart(2, '0');
                                                        const m = minute.toString().padStart(2, '0');
                                                        const time24 = `${h}:${m}`;

                                                        // Format for display
                                                        const period = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                                                        const displayTime = `${displayHour.toString().padStart(2, '0')}:${m} ${period}`;

                                                        slots.push(
                                                            <SelectItem key={time24} value={time24}>
                                                                {displayTime}
                                                            </SelectItem>
                                                        );
                                                    }
                                                }
                                            });
                                            return slots;
                                        })()}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-sm mb-2">Appointment Summary</h4>
                                <div className="text-sm space-y-1 text-slate-600">
                                    <p><span className="font-medium">Patient:</span> {selectedPatient?.full_name}</p>
                                    <p><span className="font-medium">Doctor:</span> {doctors.find(d => d.id === selectedDoctor)?.full_name || predefinedDoctors.find(d => d.id === selectedDoctor)?.full_name}</p>
                                    <p><span className="font-medium">Date:</span> {date}</p>
                                    <p><span className="font-medium">Time:</span> {time}</p>
                                    <p><span className="font-medium">Consultation Fee:</span> Rs. 500</p>
                                </div>
                            </div>
                            {/* ... payment method buttons simplified for brevity but kept in mind ... */}
                            <div className="grid gap-2">
                                <Label>Select Payment Method</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button
                                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                        className="justify-start h-auto py-3 px-4"
                                        onClick={() => setPaymentMethod('card')}
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold">Credit/Debit Card</span>
                                            <span className="text-xs font-normal opacity-80">Pay securely with your card</span>
                                        </div>
                                    </Button>
                                    <Button
                                        variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                                        className="justify-start h-auto py-3 px-4"
                                        onClick={() => setPaymentMethod('upi')}
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold">UPI / Digital Wallet</span>
                                            <span className="text-xs font-normal opacity-80">Google Pay, PhonePe, Paytm</span>
                                        </div>
                                    </Button>
                                    <Button
                                        variant={paymentMethod === 'pay_at_clinic' ? 'default' : 'outline'}
                                        className="justify-start h-auto py-3 px-4"
                                        onClick={() => setPaymentMethod('pay_at_clinic')}
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-semibold">Pay at Clinic</span>
                                            <span className="text-xs font-normal opacity-80">Pay cash/card at the counter</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step > 1 && (
                        <Button variant="outline" onClick={goBack} className="mr-auto">
                            Back
                        </Button>
                    )}

                    {step === 1 && (
                        <Button onClick={goNext} disabled={!selectedDoctor}>
                            Next
                        </Button>
                    )}

                    {/* Step 2 buttons only show if not pre-selected */}
                    {step === 2 && !preSelectedPatient && (
                        <Button onClick={goNext} disabled={!selectedPatientId}>
                            Next
                        </Button>
                    )}

                    {step === 3 && (
                        <Button onClick={goNext} disabled={!date || !time}>
                            Proceed to Payment
                        </Button>
                    )}

                    {step === 4 && (
                        <Button onClick={handleBook} disabled={!paymentMethod}>
                            Pay & Book
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
