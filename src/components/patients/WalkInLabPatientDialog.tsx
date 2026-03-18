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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, TestTube } from "lucide-react";
import { toast } from "sonner";
import { patientService } from "@/services/patientService";
import { Patient } from "@/types";

interface WalkInLabPatientDialogProps {
    children?: React.ReactNode;
    onPatientCreated: (patient: Patient) => void;
}

export function WalkInLabPatientDialog({ children, onPatientCreated }: WalkInLabPatientDialogProps) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [referredBy, setReferredBy] = useState("");
    const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().slice(0, 10));

    const resetForm = () => {
        setFirstName("");
        setLastName("");
        setPhone("");
        setAge("");
        setGender("");
        setReferredBy("");
        setRegistrationDate(new Date().toISOString().slice(0, 10));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
        setPhone(value);
    };

    const handleSubmit = async () => {
        if (!firstName.trim()) {
            toast.error("Patient name is required");
            return;
        }
        if (!phone || phone.length < 10) {
            toast.error("Valid 10-digit phone number is required");
            return;
        }

        setSubmitting(true);
        try {
            const patient = await patientService.createWalkInPatient({
                firstName: firstName.trim(),
                lastName: lastName.trim() || undefined,
                phone,
                age: age ? parseInt(age) : undefined,
                gender: gender || undefined,
                referredBy: referredBy.trim() || undefined,
                registrationDate: registrationDate,
            });

            toast.success("Walk-in Patient Registered", {
                description: `${patient.full_name} (${patient.uhid}) created successfully`,
            });

            onPatientCreated(patient);
            resetForm();
            setOpen(false);
        } catch (error: any) {
            console.error("Failed to create walk-in patient:", error);
            toast.error(error.message || "Failed to register walk-in patient");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Walk-in Patient
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        Quick Walk-in Lab Patient
                    </DialogTitle>
                    <DialogDescription>
                        Register a walk-in patient for lab tests. Only name and phone are required.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Registration Date Row */}
                    <div className="space-y-1.5">
                        <Label htmlFor="walkin-registrationDate" className="text-sm">
                            Registration Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="walkin-registrationDate"
                            type="date"
                            value={registrationDate}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setRegistrationDate(e.target.value)}
                        />
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="walkin-firstName" className="text-sm">
                                First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="walkin-firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Patient first name"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="walkin-lastName" className="text-sm">Last Name</Label>
                            <Input
                                id="walkin-lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <Label htmlFor="walkin-phone" className="text-sm">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="walkin-phone"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="10-digit phone number"
                            maxLength={10}
                        />
                    </div>

                    {/* Age & Gender Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="walkin-age" className="text-sm">Age</Label>
                            <Input
                                id="walkin-age"
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Age"
                                min="0"
                                max="150"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Gender</Label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Referred By */}
                    <div className="space-y-1.5">
                        <Label htmlFor="walkin-referredBy" className="text-sm">Referred By (Doctor / Hospital)</Label>
                        <Input
                            id="walkin-referredBy"
                            value={referredBy}
                            onChange={(e) => setReferredBy(e.target.value)}
                            placeholder="e.g. Dr. Sharma, Apollo Hospital"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !firstName.trim() || phone.length < 10}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Register & Select
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
