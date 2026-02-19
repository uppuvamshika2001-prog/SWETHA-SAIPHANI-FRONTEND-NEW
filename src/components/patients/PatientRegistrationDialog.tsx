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
import { getDepartmentMapping } from '@/data/doctors';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF, { GState } from "jspdf";
import autoTable from "jspdf-autotable";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { staffService } from "@/services/staffService";
import { usePatients } from "@/contexts/PatientContext";
import {
    addWatermark,
    addHeaderLogo,
    generatePdfFilename,
    maskData,
    getTransparentTableStyles,
    getBase64ImageFromUrl
} from "@/utils/pdfUtils";
import {
    getSortedCountries,
    getStatesByCountry,
    getDistrictsByState,
    getMandalsByDistrict,
    getPhoneCodeByCountry,
    Country,
    State,
    District,
    Mandal,
    states,
    districts,
    mandals
} from "@/data/geoData";

interface PatientRegistrationDialogProps {
    children: React.ReactNode;
    onRegister?: (patient: any) => void;
    patientToEdit?: any;
}

export function PatientRegistrationDialog({ children, onRegister, patientToEdit }: PatientRegistrationDialogProps) {
    const [open, setOpen] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const { toast } = useToast();
    const { addPatient, updatePatient } = usePatients();

    // Initial State
    const initialFormState = {
        uhid: 'P-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
        title: '',
        firstName: '',
        lastName: '',
        gender: '',
        age: '',
        bloodGroup: '',
        phoneCode: '+91',
        phone: '',
        altPhone: '',
        email: '',
        address: '',
        country: 'IN',
        state: 'IN-TS',
        district: 'IN-TS-KNR',
        mandal: '',
        village: '',
        pincode: '',
        idType: '',
        idNumber: '',
        referredBy: '',
        referredPerson: '',
        consultingDoctor: '',
        department: '', // Added department field
        paymentType: '',
        paymentMode: '',
        emergencyName: '',
        emergencyPhone: '',
        relation: '',
        registrationFee: '500'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (!open) return; // Only fetch when dialog is open

        const fetchDoctors = async () => {
            try {
                const staff = await staffService.getStaff();
                const doctors = staff.filter((s: any) => s.role === 'doctor' && s.status === 'active');
                setDoctorsList(doctors);
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };
        fetchDoctors();
    }, [open]); // Depend only on 'open' state

    // Geographic data - dynamic based on selection
    const sortedCountries = useMemo(() => getSortedCountries(), []);
    const [availableStates, setAvailableStates] = useState<State[]>([]);
    const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
    const [availableMandals, setAvailableMandals] = useState<Mandal[]>([]);

    // Update phone code when country changes
    useEffect(() => {
        if (formData.country) {
            const phoneCode = getPhoneCodeByCountry(formData.country);
            setFormData(prev => ({ ...prev, phoneCode }));
        }
    }, [formData.country]);

    // Update available states when country changes
    useEffect(() => {
        if (formData.country) {
            const states = getStatesByCountry(formData.country);
            setAvailableStates(states);
            // Reset state, district, mandal when country changes
            if (!states.find(s => s.code === formData.state)) {
                setFormData(prev => ({ ...prev, state: '', district: '', mandal: '' }));
            }
        } else {
            setAvailableStates([]);
        }
    }, [formData.country]);

    // Update available districts when state changes
    useEffect(() => {
        if (formData.state) {
            const districts = getDistrictsByState(formData.state);
            setAvailableDistricts(districts);
            // Reset district, mandal when state changes
            if (!districts.find(d => d.code === formData.district)) {
                setFormData(prev => ({ ...prev, district: '', mandal: '' }));
            }
        } else {
            setAvailableDistricts([]);
        }
    }, [formData.state]);

    // Update available mandals when district changes
    useEffect(() => {
        if (formData.district) {
            const mandals = getMandalsByDistrict(formData.district);
            setAvailableMandals(mandals);
            // Reset mandal when district changes
            if (!mandals.find(m => m.code === formData.mandal)) {
                setFormData(prev => ({ ...prev, mandal: '' }));
            }
        } else {
            setAvailableMandals([]);
        }
    }, [formData.district]);

    // Effect to populate form when patientToEdit changes or dialog opens
    useEffect(() => {
        if (open && patientToEdit) {
            // Split full name if possible, or just use as first name
            const nameParts = patientToEdit.full_name ? patientToEdit.full_name.split(' ') : ['', ''];

            // Parse address components
            let address = patientToEdit.address || '';
            let village = '';
            let mandal = '';
            let district = '';
            let state = '';
            let pincode = '';

            // Attempt to parse existing address string to extract components and street address
            // This assumes the format: "Street, Village, Mandal, District, State - Pincode"
            if (address && address.includes(',')) {
                const parts = address.split(',').map((p: string) => p.trim());
                if (parts.length >= 5) {
                    // Start from the end: State - Pincode
                    const statePin = parts[parts.length - 1];
                    const statePinParts = statePin.split('-');

                    if (statePinParts.length === 2) {
                        state = statePinParts[0].trim();
                        pincode = statePinParts[1].trim();
                        // Work backwards
                        district = parts[parts.length - 2];
                        mandal = parts[parts.length - 3];
                        village = parts[parts.length - 4];
                        // Everything before village is the street address
                        address = parts.slice(0, parts.length - 4).join(', ');
                    }
                }
            }

            // Prioritize granular fields from patient object if they exist
            // (e.g. if parsed state was 'Telangana' but DB has 'IN-TS' or 'Telangana')
            if (patientToEdit.state) state = patientToEdit.state;
            if (patientToEdit.district) district = patientToEdit.district;
            if (patientToEdit.mandal) mandal = patientToEdit.mandal;
            if (patientToEdit.village) village = patientToEdit.village;
            if (patientToEdit.pincode) pincode = patientToEdit.pincode;


            // Reverse Lookup: Convert Names to Codes for Dropdowns
            // 1. State
            const foundState = states.find(s => s.name === state || s.code === state);
            if (foundState) state = foundState.code;

            // 2. District
            const foundDistrict = districts.find(d =>
                d.stateCode === state && (d.name === district || d.code === district)
            );
            if (foundDistrict) district = foundDistrict.code;

            // 3. Mandal
            const foundMandal = mandals.find(m =>
                m.districtCode === district && (m.name === mandal || m.code === mandal)
            );
            if (foundMandal) mandal = foundMandal.code;

            setFormData({
                ...initialFormState,
                ...patientToEdit,
                uhid: patientToEdit.patient_id || patientToEdit.uhid,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                age: patientToEdit.age ? String(patientToEdit.age) : '',
                bloodGroup: patientToEdit.blood_group || '',
                phone: patientToEdit.phone || '',
                email: patientToEdit.email || '',

                // Mapped address fields
                address, // This is now the street address (if parsed) or full address
                village,
                mandal,
                district,
                state,
                pincode,

                // Map other potential fields if they exist in patient object
                gender: patientToEdit.gender ? patientToEdit.gender.charAt(0).toUpperCase() + patientToEdit.gender.slice(1) : '',
            });
        }
    }, [open, patientToEdit]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string = 'phone') => {
        const value = e.target.value;
        const isIndia = formData.country === 'IN';
        const maxLength = isIndia ? 10 : 15;

        // Only allow numbers and max length
        if (value === '' || (/^\d+$/.test(value) && value.length <= maxLength)) {
            handleChange(field, value);
        }
    };

    const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow alphanumeric for international postal codes (max 10 characters)
        if (value === '' || (/^[a-zA-Z0-9\s-]+$/.test(value) && value.length <= 10)) {
            handleChange('pincode', value);
        }
    };

    const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const idType = formData.idType;

        if (idType === 'aadhaar') {
            // Allow numbers only, max 12 digits
            if (value === '' || (/^\d+$/.test(value) && value.length <= 12)) {
                handleChange('idNumber', value);
            }
        } else if (idType === 'pan' || idType === 'passport') {
            // Allow alphanumeric only
            if (value === '' || /^[a-zA-Z0-9]*$/.test(value)) {
                // Limit PAN to 10 chars
                if (idType === 'pan' && value.length > 10) return;
                // Limit Passport to 8 chars
                if (idType === 'passport' && value.length > 8) return;

                handleChange('idNumber', value.toUpperCase());
            } else {
                if (value !== '') {
                    toast({
                        title: "Validation Error",
                        description: idType === 'passport'
                            ? "Special characters are not allowed in Passport number."
                            : "Special characters are not allowed in PAN number.",
                        variant: "destructive"
                    });
                }
            }
        } else {
            // Default fallthrough if no type selected or other
            handleChange('idNumber', value);
        }
    };
    const PREDEFINED_DEPARTMENTS = [
        "Orthopaedics",
        "Neurosurgeon",
        "General Physician",
        "Paediatric Orthopaedics",
        "Pulmonology",
        "Oncology",
        "Paediatric Hemato-Oncology"
    ];

    const [doctorsList, setDoctorsList] = useState<any[]>([]);

    // Department mapping for staff/doctors that may have different department names

    // Helper function to normalize name for comparison (remove extra spaces, lowercase)
    const normalizeName = (name: string) => name?.toLowerCase().replace(/\s+/g, '').trim() || '';

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const staff = await staffService.getStaff();
                // Filter for doctors, loosen status check to include 'active' or if generic
                const activeDoctors = staff.filter((s: any) => s.role === 'doctor');
                setDoctorsList(activeDoctors);
            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };
        fetchDoctors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic required fields - mandal is only required for India
        const isIndia = formData.country === 'IN';
        const mandalRequired = isIndia && availableMandals.length > 0;

        if (!formData.firstName || !formData.phone || !formData.country || !formData.state || !formData.village) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        // District validation - if state is selected and districts are available, district is required
        if (formData.state && availableDistricts.length > 0 && !formData.district) {
            toast({
                title: "Validation Error",
                description: "Please select a district.",
                variant: "destructive"
            });
            return;
        }

        // Phone validation - flexible for international numbers
        if (isIndia && formData.phone.length !== 10) {
            toast({
                title: "Validation Error",
                description: "Phone number must be exactly 10 digits for India.",
                variant: "destructive"
            });
            return;
        }

        if (!isIndia && formData.phone.length < 6) {
            toast({
                title: "Validation Error",
                description: "Please enter a valid phone number (minimum 6 digits).",
                variant: "destructive"
            });
            return;
        }

        // ID Validation - Only validate if BOTH idType AND idNumber are provided (Identification is optional)
        if (formData.idType && formData.idNumber) {
            if (formData.idType === 'aadhaar' && formData.idNumber.length !== 12) {
                toast({
                    title: "Validation Error",
                    description: "Aadhaar number must be exactly 12 digits.",
                    variant: "destructive"
                });
                return;
            }

            if (formData.idType === 'pan') {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                // Check if length is wrong
                if (formData.idNumber.length !== 10) {
                    toast({
                        title: "Validation Error",
                        description: "PAN number must be exactly 10 characters.",
                        variant: "destructive"
                    });
                    return;
                }
                // Check if only numeric
                if (/^\d+$/.test(formData.idNumber)) {
                    toast({
                        title: "Validation Error",
                        description: "PAN number must be alphanumeric (e.g., ABCDE1234F).",
                        variant: "destructive"
                    });
                    return;
                }
                // Check full regex
                if (!panRegex.test(formData.idNumber)) {
                    toast({
                        title: "Validation Error",
                        description: "Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).",
                        variant: "destructive"
                    });
                    return;
                }
            }

            if (formData.idType === 'passport') {
                if (!/^[a-zA-Z0-9]+$/.test(formData.idNumber)) {
                    toast({
                        title: "Validation Error",
                        description: "Special characters are not allowed in Passport number.",
                        variant: "destructive"
                    });
                    return;
                }

                if (formData.idNumber.length > 8) {
                    toast({
                        title: "Validation Error",
                        description: "Passport number must be maximum 8 characters.",
                        variant: "destructive"
                    });
                    return;
                }
            }
        }

        if (formData.altPhone && isIndia && formData.altPhone.length !== 10) {
            toast({
                title: "Validation Error",
                description: "Alternate phone number must be exactly 10 digits.",
                variant: "destructive"
            });
            return;
        }



        // Resolve names from codes for legible address storage
        const stateName = states.find(s => s.code === formData.state)?.name || formData.state;
        const districtName = districts.find(d => d.code === formData.district)?.name || formData.district;
        const mandalName = mandals.find(m => m.code === formData.mandal)?.name || formData.mandal;

        const submissionData = {
            ...formData,
            state: stateName,
            district: districtName,
            mandal: mandalName,
            full_name: `${formData.title} ${formData.firstName} ${formData.lastName}`.trim(),
            date_of_birth: new Date(new Date().getFullYear() - parseInt(formData.age || '0'), 0, 1).toISOString(),
            gender: formData.gender,
            blood_group: formData.bloodGroup,
            allergies: []
        };

        try {
            if (patientToEdit && updatePatient) {
                await updatePatient(patientToEdit.uhid, submissionData);
                toast({
                    title: "Patient Updated",
                    description: "Patient details have been successfully updated.",
                });
                setOpen(false); // Close dialog after update
                if (onRegister) {
                    onRegister(submissionData);
                }
            } else {
                await addPatient(submissionData);

                if (onRegister) {
                    onRegister(submissionData);
                }

                toast({
                    title: "Patient Registered",
                    description: "New patient has been successfully registered.",
                });
                setShowReceipt(true);
            }

        } catch (error: any) {
            console.error("Registration error:", error);
            // api.ts throws an Error object with the extracted message
            const errorMessage = error.message || "Could not register patient. Please try again.";

            toast({
                variant: "destructive",
                title: "Registration Failed",
                description: errorMessage
            });
        }
    };

    const generateReceiptDoc = async (actionType: 'download' | 'print') => {
        const doc = new jsPDF();

        // Generate filename and check if masked
        // Use unique document ID for each action type to track them separately
        const patientName = `${formData.title} ${formData.firstName} ${formData.lastName}`.trim();
        const documentId = `${formData.uhid}_receipt_${actionType}`;
        const { filename, isMasked } = generatePdfFilename(patientName, formData.uhid, documentId);

        try {
            if (!isMasked) {
                // Add Full Page Background Template (Original Only)
                // Using the specific template requested by user
                const headerUrl = '/templete new.jpeg';
                const headerBase64 = await getBase64ImageFromUrl(headerUrl);
                doc.addImage(headerBase64, 'JPEG', 0, 0, 210, 297);
            } else {
                // Masked Copy: No Header/Footer, Add Watermark
                doc.saveGraphicsState();
                doc.setGState(new GState({ opacity: 0.1 }));
                doc.setFontSize(60);
                doc.setTextColor(150, 150, 150);
                doc.text("MASKED COPY", 105, 150, { align: "center", angle: 45 });
                doc.restoreGraphicsState();
            }
        } catch (error) {
            console.error("Failed to load background template or add watermark", error);
            // Fallback if image fails, continue
        }

        /* 
           Manual Header, Footer, and Watermark removed as they are part of the background template.
        */

        // Title - Positioned below the header area of the background image
        // Adjusted Y coordinate to clear the template header (approx 50-55mm)
        const contentStartY = 55;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(isMasked ? "Registration Receipt (Masked Copy)" : "Registration Receipt", 105, contentStartY, { align: "center" });

        // Prepare data (apply masking if this is 2nd+ download)
        const displayName = isMasked ? maskData(patientName, 'name') : patientName;
        const displayPhone = isMasked ? maskData(formData.phone, 'phone') : formData.phone;

        // Resolve names for the PDF document
        const stateName = states.find(s => s.code === formData.state)?.name || formData.state;
        const districtName = districts.find(d => d.code === formData.district)?.name || formData.district;
        const mandalName = mandals.find(m => m.code === formData.mandal)?.name || formData.mandal;

        const addressString = `${formData.address}, ${formData.village}, ${mandalName}, ${districtName}, ${stateName} – ${formData.pincode}`;
        const displayAddress = isMasked ? maskData(addressString, 'address') : addressString;

        // Find doctor to get specialization/qualification
        const selectedDoctor = doctorsList.find(d =>
            normalizeName(d.full_name) === normalizeName(formData.consultingDoctor)
        );

        const doctorText = selectedDoctor
            ? `${formData.consultingDoctor}\n${selectedDoctor.specialization || ''}`
            : (formData.consultingDoctor || "Not Selected");

        // Patient Details Table
        const tableData = [
            ["UHID", formData.uhid],
            ["Patient Name", displayName],
            ["Age/Gender", `${formData.age} Years / ${formData.gender}`],
            ["Phone", displayPhone],
            ["Consulting Doctor", doctorText],
            ["Address", displayAddress],
            ["Date", new Date().toLocaleString()],
        ];

        const tableStyles = getTransparentTableStyles();
        autoTable(doc, {
            startY: contentStartY + 5,
            head: [['Field', 'Details']],
            body: tableData,
            theme: 'grid',
            ...tableStyles,
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } }
        });

        // Payment Details
        const paymentY = (doc as any).lastAutoTable.finalY + 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Payment Details", 14, paymentY);

        autoTable(doc, {
            startY: paymentY + 3,
            head: [['Description', 'Amount']],
            body: [
                ['Registration Fee', `Rs. ${formData.registrationFee}`],
                ['Total Paid', `Rs. ${formData.registrationFee}`]
            ],
            theme: 'grid',
            ...tableStyles
        });

        // Patient Portal Credentials (only show on first download)
        if (!isMasked) {
            const credentialsY = (doc as any).lastAutoTable.finalY + 6;

            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.rect(14, credentialsY, 182, 28);

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 64, 175);
            doc.text("PATIENT PORTAL LOGIN CREDENTIALS", 20, credentialsY + 7);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Email (Username): ${formData.email}`, 20, credentialsY + 14);
            doc.text(`Temporary Password: ${formData.phone}`, 20, credentialsY + 20);

            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text("Please change your password after first login at the Patient Portal.", 20, credentialsY + 26);
        }

        // Footer removed (included in background)

        return { doc, filename, isMasked };
    };

    const handleDownloadReceipt = async () => {
        try {
            const { doc, filename, isMasked } = await generateReceiptDoc('download');
            doc.save(filename);
            toast({
                title: isMasked ? "Masked Receipt Downloaded" : "Receipt Downloaded",
                description: isMasked
                    ? "Masked copy saved. Sensitive data is hidden for privacy."
                    : "Registration receipt has been saved to your device."
            });
        } catch (error) {
            console.error("Download failed", error);
            toast({
                title: "Download Failed",
                description: "Could not generate receipt PDF.",
                variant: "destructive"
            });
        }
    };

    const handlePrintReceipt = async () => {
        try {
            const { doc } = await generateReceiptDoc('print');
            // Open print dialog
            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error("Print failed", error);
            toast({
                title: "Print Failed",
                description: "Could not generate receipt for printing.",
                variant: "destructive"
            });
        }
    };

    const handlePrintRecord = async () => {
        try {
            const doc = new jsPDF();

            // Track print count for Template separately
            // e.g. P-2024..._template_print
            const patientName = `${formData.title} ${formData.firstName} ${formData.lastName}`.trim();
            const documentId = `${formData.uhid}_template_print`;
            const { isMasked } = generatePdfFilename(patientName, formData.uhid, documentId);

            // Add Full Page Background Template using 2.jpg
            try {
                const backgroundUrl = '/2.jpg';
                const backgroundBase64 = await getBase64ImageFromUrl(backgroundUrl);
                doc.addImage(backgroundBase64, 'JPEG', 0, 0, 210, 297);
            } catch (error) {
                console.error("Failed to load background template", error);
                toast({
                    title: "Template Error",
                    description: "Could not load the print template background.",
                    variant: "destructive"
                });
                return;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);

            // Coordinates matching PatientDetailsDialog (all in mm)
            const leftColX = 57;
            const rightColX = 168;

            // Apply masking if isMasked is true
            const displayParams = {
                name: isMasked ? maskData(patientName, 'name') : patientName,
                phone: isMasked ? maskData(formData.phone, 'phone') : formData.phone,
                // Do not mask UHID usually, but if requested:
                // uhid: isMaskData(formData.uhid, 'id') : formData.uhid
                uhid: formData.uhid
            };

            // Row 1 (51mm): Name (Age/Gender) | Date
            const ageGender = `(${formData.age}Y/${formData.gender.charAt(0).toUpperCase()})`;
            doc.text(`${displayParams.name} ${ageGender}`, leftColX, 51);

            const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            doc.text(today, rightColX, 51);

            // Row 2 (58mm): UHID | Mobile
            doc.text(`${displayParams.uhid}`, leftColX, 58);
            doc.text(`${displayParams.phone}`, rightColX, 58);

            // Row 3 (64mm): Doctor | OPD (or Dept)
            // Resolve doctor specialization
            const selectedDoctor = doctorsList.find(d =>
                normalizeName(d.full_name) === normalizeName(formData.consultingDoctor)
            );

            // Doctor Name
            doc.text(`${formData.consultingDoctor || ''}`, leftColX, 64);

            // Doctor Specialization (Small font, slightly below)
            if (selectedDoctor && selectedDoctor.specialization) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(selectedDoctor.specialization, leftColX, 68); // 4mm below name
                // Reset font
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
            }

            // Department / OPD
            doc.text("OPD", rightColX, 64);

            // Address (79mm)
            // Resolve address details
            const stateName = states.find(s => s.code === formData.state)?.name || formData.state;
            const districtName = districts.find(d => d.code === formData.district)?.name || formData.district;
            const mandalName = mandals.find(m => m.code === formData.mandal)?.name || formData.mandal;

            const addressParts = [
                formData.address,
                formData.village,
                mandalName,
                districtName,
                stateName
            ].filter(part => part && part.trim() !== '');

            let addressString = addressParts.join(', ') + (formData.pincode ? ` - ${formData.pincode}` : '');

            if (isMasked) {
                addressString = maskData(addressString, 'address');
            }

            // Wrap text for address (width approx 125mm)
            doc.text(addressString, leftColX, 79, { maxWidth: 125 });

            doc.autoPrint();
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            console.error("Print failed", error);
            toast({
                title: "Print Failed",
                description: "Could not generate record for printing.",
                variant: "destructive"
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setShowReceipt(false);
        // Reset form data logic here if needed (omitted for brevity as it's just resetting state)
        setFormData({
            uhid: 'P-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
            title: '',
            firstName: '',
            lastName: '',
            gender: '',
            age: '',
            department: '', // Reset department
            bloodGroup: '',
            phoneCode: '+91',
            phone: '',
            altPhone: '',
            email: '',
            address: '',
            country: 'IN',
            state: 'IN-TS',
            district: 'IN-TS-KNR',
            mandal: '',
            village: '',
            pincode: '',
            idType: '',
            idNumber: '',
            referredBy: '',
            referredPerson: '',
            consultingDoctor: '',
            paymentType: '',
            paymentMode: '',
            emergencyName: '',
            emergencyPhone: '',
            relation: '',
            registrationFee: '500'
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) handleClose();
            setOpen(val);
        }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">

                {!showReceipt ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{patientToEdit ? "Edit Patient Details" : "New Patient Registration"}</DialogTitle>
                            <DialogDescription>
                                {patientToEdit ? "Update existing patient record." : "Enter patient details to create a new record."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            {/* Personal Information */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                <h3 className="font-semibold text-lg">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="uhid">UHID *</Label>
                                        <Input id="uhid" value={formData.uhid} disabled className="bg-slate-50 dark:bg-slate-900 border-primary/20 text-primary font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Select value={formData.title} onValueChange={(v) => handleChange('title', v)}>
                                            <SelectTrigger id="title">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mr">Mr.</SelectItem>
                                                <SelectItem value="Mrs">Mrs.</SelectItem>
                                                <SelectItem value="Ms">Ms.</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input id="firstName" value={formData.firstName} placeholder="First name" required onChange={(e) => handleChange('firstName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input id="lastName" value={formData.lastName} placeholder="Last name" required onChange={(e) => handleChange('lastName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender *</Label>
                                        <Select value={formData.gender} required onValueChange={(v) => handleChange('gender', v)}>
                                            <SelectTrigger id="gender">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age (Years) *</Label>
                                        <Input id="age" value={formData.age} placeholder="Age" required onChange={(e) => handleChange('age', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <Select value={formData.bloodGroup} onValueChange={(v) => handleChange('bloodGroup', v)}>
                                            <SelectTrigger id="bloodGroup">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                <h3 className="font-semibold text-lg">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <div className="flex">
                                            <Select value={formData.phoneCode} onValueChange={(v) => handleChange('phoneCode', v)}>
                                                <SelectTrigger className="w-[100px] rounded-r-none border-r-0">
                                                    <SelectValue placeholder="Code" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sortedCountries.map((country) => (
                                                        <SelectItem key={country.code} value={country.phoneCode}>
                                                            {country.flag} {country.phoneCode}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                placeholder="9876543210"
                                                required
                                                onChange={(e) => handlePhoneChange(e, 'phone')}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="altPhone">Alternate Phone</Label>
                                        <div className="flex">
                                            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                                                {formData.phoneCode}
                                            </div>
                                            <Input
                                                id="altPhone"
                                                value={formData.altPhone}
                                                placeholder="9876543210"
                                                onChange={(e) => handlePhoneChange(e, 'altPhone')}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" value={formData.email} type="email" placeholder="patient@email.com" onChange={(e) => handleChange('email', e.target.value)} />
                                    </div>
                                    <div className="col-span-1 md:col-span-3 space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea id="address" value={formData.address} placeholder="Enter complete address" onChange={(e) => handleChange('address', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Country *</Label>
                                        <Select value={formData.country} required onValueChange={(v) => handleChange('country', v)}>
                                            <SelectTrigger id="country">
                                                <SelectValue placeholder="Select Country" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {sortedCountries.map((country) => (
                                                    <SelectItem key={country.code} value={country.code}>
                                                        {country.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State *</Label>
                                        <Select
                                            value={formData.state}
                                            required
                                            onValueChange={(v) => handleChange('state', v)}
                                            disabled={availableStates.length === 0}
                                        >
                                            <SelectTrigger id="state">
                                                <SelectValue placeholder={availableStates.length === 0 ? "Select country first" : "Select State"} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {availableStates.map((state) => (
                                                    <SelectItem key={state.code} value={state.code}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                                {availableStates.length === 0 && (
                                                    <SelectItem value="other" disabled>No states available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="district">District</Label>
                                        <Select
                                            value={formData.district}

                                            onValueChange={(v) => handleChange('district', v)}
                                            disabled={availableDistricts.length === 0}
                                        >
                                            <SelectTrigger id="district">
                                                <SelectValue placeholder={availableDistricts.length === 0 ? "Select state first" : "Select District"} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {availableDistricts.map((district) => (
                                                    <SelectItem key={district.code} value={district.code}>
                                                        {district.name}
                                                    </SelectItem>
                                                ))}
                                                {availableDistricts.length === 0 && formData.state && (
                                                    <SelectItem value="other">Other</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mandal">Mandal / Region</Label>
                                        {availableMandals.length > 0 ? (
                                            <Select value={formData.mandal} onValueChange={(v) => handleChange('mandal', v)}>
                                                <SelectTrigger id="mandal">
                                                    <SelectValue placeholder="Select Mandal" />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                    {availableMandals.map((mandal) => (
                                                        <SelectItem key={mandal.code} value={mandal.code}>
                                                            {mandal.name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id="mandal"
                                                value={formData.mandal}
                                                placeholder="Enter mandal/region"
                                                onChange={(e) => handleChange('mandal', e.target.value)}
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="village">Village / City *</Label>
                                        <Input id="village" value={formData.village} placeholder="Village or City" required onChange={(e) => handleChange('village', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pincode">PIN / ZIP Code</Label>
                                        <Input id="pincode" value={formData.pincode} placeholder="PIN Code" onChange={handlePincodeChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Identification */}
                                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                    <h3 className="font-semibold text-lg">Identification</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="idType">ID Type</Label>
                                            <Select value={formData.idType} onValueChange={(v) => {
                                                handleChange('idType', v);
                                                handleChange('idNumber', ''); // Clear number on type change
                                            }}>
                                                <SelectTrigger id="idType">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="aadhaar">Aadhaar</SelectItem>
                                                    <SelectItem value="pan">PAN Card</SelectItem>
                                                    <SelectItem value="passport">Passport</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="idNumber">ID Number</Label>
                                            <Input id="idNumber" value={formData.idNumber} placeholder="ID Number" onChange={handleIdNumberChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* Referral */}
                                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                    <h3 className="font-semibold text-lg">Referral</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="referredBy">Referred By</Label>
                                            <Select value={formData.referredBy} onValueChange={(v) => handleChange('referredBy', v)}>
                                                <SelectTrigger id="referredBy">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="doctor">Doctor</SelectItem>
                                                    <SelectItem value="friend">Friend/Family</SelectItem>
                                                    <SelectItem value="newspaper">Newspaper</SelectItem>
                                                    <SelectItem value="social_media">Social Media</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="referredPerson">Referred Person</Label>
                                            <Input id="referredPerson" value={formData.referredPerson} placeholder="Name" onChange={(e) => handleChange('referredPerson', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Consultation */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                <h3 className="font-semibold text-lg">Consultation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reg-department">Department</Label>
                                        <Select value={formData.department} onValueChange={(v) => {
                                            handleChange('department', v);
                                            handleChange('consultingDoctor', ''); // Reset doctor when department changes
                                        }}>
                                            <SelectTrigger id="reg-department">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PREDEFINED_DEPARTMENTS.map(dept => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="consultingDoctor">Consulting Doctor</Label>
                                        <Select value={formData.consultingDoctor} onValueChange={(v) => handleChange('consultingDoctor', v)}>
                                            <SelectTrigger id="consultingDoctor">
                                                <SelectValue placeholder="Select Doctor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctorsList
                                                    .filter(d => !formData.department || getDepartmentMapping(d.department) === formData.department)
                                                    .map((doctor) => (
                                                        <SelectItem key={doctor.id} value={doctor.full_name}>
                                                            {doctor.full_name} ({doctor.specialization})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Payment */}
                                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                    <h3 className="font-semibold text-lg">Payment Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <div className="space-y-2">
                                            <Label htmlFor="paymentMode">Payment Mode</Label>
                                            <Select value={formData.paymentMode} onValueChange={(v) => handleChange('paymentMode', v)}>
                                                <SelectTrigger id="paymentMode">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="card">Card</SelectItem>
                                                    <SelectItem value="upi">UPI</SelectItem>
                                                    <SelectItem value="pay_at_clinic">Pay at Clinic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationFee">Registration Fee</Label>
                                            <Input id="registrationFee" value={formData.registrationFee} placeholder="Enter Fee" onChange={(e) => handleChange('registrationFee', e.target.value)} className="bg-white dark:bg-slate-950 border-input" />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                                    <h3 className="font-semibold text-lg">Emergency Contact</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyName">Name</Label>
                                            <Input id="emergencyName" value={formData.emergencyName} placeholder="Emergency contact name" onChange={(e) => handleChange('emergencyName', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="emergencyPhone">Phone</Label>
                                            <Input id="emergencyPhone" value={formData.emergencyPhone} placeholder="Emergency contact phone" onChange={(e) => handlePhoneChange(e, 'emergencyPhone')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="relation">Relation</Label>
                                            <Input id="relation" value={formData.relation} placeholder="Relation to patient" onChange={(e) => handleChange('relation', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{patientToEdit ? "Update Details" : "Register Patient"}</Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Registration Successful!</h2>
                            <p className="text-muted-foreground">Patient has been registered with UHID: <span className="font-mono font-bold text-primary">{formData.uhid}</span></p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-md bg-slate-50 dark:bg-slate-900 p-6 rounded-lg border">
                            <div>
                                <p className="text-sm text-muted-foreground">Patient Name</p>
                                <p className="font-medium">{formData.title} {formData.firstName} {formData.lastName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Registration Date</p>
                                <p className="font-medium">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Payment Status</p>
                                <p className="font-medium text-green-600">Paid (Rs. {formData.registrationFee})</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{formData.phone}</p>
                            </div>
                        </div>

                        {/* Patient Portal Login Credentials */}
                        <div className="w-full max-w-md bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                                </svg>
                                Patient Portal Login Credentials
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Email (Username):</span>
                                    <span className="font-mono font-bold text-blue-800 dark:text-blue-200">{formData.email}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Temporary Password:</span>
                                    <span className="font-mono font-bold text-blue-800 dark:text-blue-200">{formData.phone}</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                ⚠️ Please inform the patient to change their password after first login at the Patient Portal.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                            <Button onClick={handleDownloadReceipt} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Receipt
                            </Button>
                            <Button variant="secondary" className="gap-2" onClick={handlePrintReceipt}>
                                <Printer className="h-4 w-4" />
                                Print Receipt
                            </Button>
                            <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrintRecord}>
                                <Printer className="h-4 w-4" />
                                Print Template
                            </Button>
                        </div>
                    </div>
                )
                }
            </DialogContent >
        </Dialog >
    );
}
export default PatientRegistrationDialog;
