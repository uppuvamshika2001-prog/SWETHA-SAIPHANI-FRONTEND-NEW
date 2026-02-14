import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Phone, Mail, MapPin, Activity, Printer } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { usePatients } from "@/contexts/PatientContext";
import { useState } from "react";

import { printPatientCard } from "@/utils/printPatientCard";
import { medicalRecords } from "@/data/mockData";
import { states, mandals, districts } from "@/data/geoData";

import { Patient } from "@/types";

interface PatientDetailsDialogProps {
    children?: React.ReactNode;
    patientId?: string;
    patient?: Patient;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showMedicalRecords?: boolean;
}

export function PatientDetailsDialog({
    children,
    patientId,
    patient: propPatient,
    open,
    onOpenChange,
    showMedicalRecords = false
}: PatientDetailsDialogProps) {
    const { patients } = usePatients();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const patient = propPatient || patients.find(p => p.uhid === patientId);
    const patientRecords = medicalRecords.filter(r => r.patient_id === (patient?.uhid || patientId));

    const handlePrint = () => {
        printPatientCard(patient, showMedicalRecords ? patientRecords : [], showMedicalRecords);
    }

    if (!patient) return null;

    const formatAddress = (fullAddress: string) => {
        if (!fullAddress) return 'N/A';
        const parts = fullAddress.split(',');
        // Expected format from service: Street, Village, Mandal, District, State - Pincode
        // We need at least 5 parts to reliably extract everything
        if (parts.length >= 5) {
            try {
                const count = parts.length;

                // Extract components from the end backwards to handle variable length street address
                // Structure: [Street...], Village, Mandal, District, State - Pincode

                const mandalIndex = count - 4;
                const districtIndex = count - 3;
                const statePinIndex = count - 1; // Last part
                // Village is before Mandal
                const villageIndex = mandalIndex - 1;

                // Everything before Village is the Street Address
                const streetAddress = parts.slice(0, villageIndex).join(',').trim();
                const village = parts[villageIndex].trim();
                let mandal = parts[mandalIndex].trim();
                let district = parts[districtIndex].trim();

                // Extract State and Pin
                const stateAndPin = parts[statePinIndex].trim();
                let stateName = stateAndPin;
                let pincode = '';

                if (stateAndPin.includes('-')) {
                    const spParts = stateAndPin.split('-');
                    // Check if last part is numeric (pincode)
                    const potentialPin = spParts[spParts.length - 1].trim();
                    if (/^\d+$/.test(potentialPin)) {
                        pincode = potentialPin;
                        stateName = spParts.slice(0, spParts.length - 1).join('-').trim();
                    }
                }

                // Resolve Codes to Names
                const mandalObj = mandals.find(m => m.code === mandal);
                if (mandalObj) mandal = mandalObj.name;

                const districtObj = districts.find(d => d.code === district);
                if (districtObj) district = districtObj.name;

                const stateObj = states.find(s => s.code === stateName);
                if (stateObj) stateName = stateObj.name;

                // Reconstruct full address: House No/Street Name, Village, Mandal, District, State – PIN Code
                return `${streetAddress}, ${village}, ${mandal}, ${district}, ${stateName} – ${pincode}`;
            } catch (e) {
                return fullAddress;
            }
        }
        return fullAddress;
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
                <div
                    className="space-y-6 p-2"
                    style={{
                        backgroundImage: "url('/header_template.jpg')",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundSize: "100% 100%", /* Ensure it fits width and height */
                        paddingTop: "180px", /* Push content down */
                        minHeight: "800px"
                    }}
                >
                    {/* Header Section (Background Image Used) */}

                    {/* Patient Information Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-1">Patient Information</h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            {/* ... existing fields ... */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                                <p className="font-medium text-gray-900">{patient.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Patient ID</p>
                                <p className="font-medium text-gray-900">{patient.uhid || patient.id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Age / Gender</p>
                                <p className="font-medium text-gray-900">
                                    {patient.age || 'N/A'} / <span className="capitalize">{patient.gender}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Blood Group</p>
                                <p className="font-medium text-gray-900">{patient.blood_group || 'Not recorded'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
                                <p className="font-medium text-gray-900">{patient.phone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                                <p className="font-medium text-gray-900 lowercase">{patient.email || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                                {(() => {
                                    const addr = patient.address || '';
                                    if (!addr || addr.trim() === '' || addr.trim() === ',') {
                                        return <p className="font-medium text-gray-900">N/A</p>;
                                    }

                                    // Remove leading commas and clean up
                                    const cleanAddr = addr.replace(/^[,\s]+/, '').trim();
                                    const parts = cleanAddr.split(',').map(p => p.trim()).filter(p => p);

                                    // Expected structure: House No, Street/Area, City/Village, District, State - PIN
                                    // Parse into structured format
                                    let houseLine = '';
                                    let streetLine = '';
                                    let city = '';
                                    let state = '';
                                    let pinCode = '';

                                    if (parts.length >= 1) {
                                        houseLine = parts[0]; // House No / Building
                                    }
                                    if (parts.length >= 2) {
                                        streetLine = parts[1]; // Street / Area
                                    }
                                    if (parts.length >= 3) {
                                        city = parts.slice(2, parts.length - 1).join(', '); // City/District
                                    }
                                    if (parts.length >= 4) {
                                        // Last part typically contains State - PIN
                                        const lastPart = parts[parts.length - 1];
                                        if (lastPart.includes('–') || lastPart.includes('-')) {
                                            const statePinParts = lastPart.split(/[–-]/);
                                            state = statePinParts[0].trim();
                                            pinCode = statePinParts[1]?.trim() || '';
                                        } else {
                                            state = lastPart;
                                        }
                                    }

                                    return (
                                        <div className="font-medium text-gray-900 space-y-0.5">
                                            {houseLine && <p>{houseLine}</p>}
                                            {streetLine && <p>{streetLine}</p>}
                                            {city && <p>{city}</p>}
                                            {state && <p>{state}{pinCode ? ` - ${pinCode}` : ''}</p>}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {showMedicalRecords && (
                        <>
                            {/* Active Medical Conditions */}
                            <div className="space-y-2">
                                <h2 className="text-sm font-bold text-gray-900 border-b pb-1">Active Medical Conditions</h2>
                                <p className="text-xs text-gray-500 italic py-2">No active conditions recorded</p>
                            </div>

                            {/* Medical Records History */}
                            <div className="space-y-2">
                                <h2 className="text-sm font-bold text-gray-900 border-b pb-1">Medical Records History</h2>
                                {patientRecords.length > 0 ? (
                                    <div className="space-y-2">
                                        {patientRecords.map((record) => (
                                            <div key={record.id} className="grid grid-cols-12 gap-2 text-xs p-2 bg-muted/20 rounded">
                                                <div className="col-span-2 font-medium">{record.date}</div>
                                                <div className="col-span-3 text-muted-foreground">{record.doctor_name}</div>
                                                <div className="col-span-7">
                                                    <span className="font-semibold">Dx:</span> {record.diagnosis}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic py-2">No medical records found</p>
                                )}
                            </div>

                            {/* Current Medications */}
                            <div className="space-y-2">
                                <h2 className="text-sm font-bold text-gray-900 border-b pb-1">Current Medications</h2>
                                <p className="text-xs text-gray-500 italic py-2">No active medications</p>
                            </div>

                            {/* Recent Lab Results */}
                            <div className="space-y-2">
                                <h2 className="text-sm font-bold text-gray-900 border-b pb-1">Recent Lab Results</h2>
                                <p className="text-xs text-gray-500 italic py-2">No recent lab results found</p>
                            </div>
                        </>
                    )}

                    {/* Footer (Background Image Used) */}

                    <div className="flex justify-end gap-2 mt-4 no-print">
                        <Button variant="outline" onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print Report
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}

