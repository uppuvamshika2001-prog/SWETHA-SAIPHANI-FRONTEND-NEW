import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
    DialogHeader
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Loader2, AlertCircle, ChevronLeft, ChevronRight, History } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";
import { useState, useEffect } from "react";
import { DOCTORS } from "@/data/doctors";


import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { Patient } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { staffService } from "@/services/staffService";
import { format } from "date-fns";

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

    // Real data state
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
    const [staffList, setStaffList] = useState<any[]>([]);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await staffService.getStaff();
                setStaffList(data);
            } catch (error) {
                console.error("Failed to fetch staff info:", error);
            }
        }
        fetchStaff();
    }, []);

    useEffect(() => {
        if (showOpen && showMedicalRecords && (patientId || patient?.uhid)) {
            const fetchRecords = async () => {
                setLoadingRecords(true);
                try {
                    // Enforce UHID linking for fetching records
                    // Prioritize patient.uhid if available to avoid ID collisions
                    const id = patient?.uhid || patientId;
                    if (id) {
                        const data = await medicalRecordService.getPatientRecords(id);

                        // If patient is not yet available, we can't filter by creation date just yet safely
                        // But usually we should have patient by now.
                        // Lets wrap date filtering safely
                        let validRecords = data;
                        if (patient) {
                            const patientCreationDate = new Date(patient.created_at || 0);
                            validRecords = data.filter(record => {
                                const recordDate = new Date(record.date || record.createdAt);
                                return recordDate.getTime() >= patientCreationDate.getTime() - (24 * 60 * 60 * 1000);
                            });
                        }

                        // Sort by date descending
                        const sorted = validRecords.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
                        setRecords(sorted);
                        setCurrentRecordIndex(0);
                    }
                } catch (error) {
                    console.error("Failed to fetch patient records", error);
                } finally {
                    setLoadingRecords(false);
                }
            };
            fetchRecords();
        }
    }, [showOpen, showMedicalRecords, patientId, patient?.uhid, patient?.created_at]);

    if (!patient) return null;

    const activeRecord = records.length > 0 ? records[currentRecordIndex] : null;

    const parseTreatmentNotes = (notes: string) => {
        if (!notes) return { plan: "", followUp: "", additional: "" };
        const parts = notes.split("\n\n---\n\n");
        return {
            plan: parts[0] || "",
            followUp: parts[1] || "",
            additional: parts[2] || ""
        };
    };

    const { plan, followUp, additional } = activeRecord ? parseTreatmentNotes(activeRecord.treatmentNotes) : { plan: "", followUp: "", additional: "" };

    const getDoctorQualification = (docName: string, doctorObj?: any) => {
        if (!docName) return "";
        // 1. Try to find in fetched staff list
        const foundStaff = staffList.find(s =>
            s.full_name === docName ||
            `Dr. ${s.full_name}` === docName ||
            s.full_name === docName.replace('Dr. ', '')
        );
        if (foundStaff && foundStaff.specialization) return foundStaff.specialization;

        // 2. Fallback to object if provided
        if (doctorObj && doctorObj.qualification) return doctorObj.qualification;

        // 3. Last resort - look at the string for clues or return empty
        return "";
    };

    const handlePrint = () => {
        if (!patient) return;

        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) return;

        const today = activeRecord
            ? format(new Date(activeRecord.date || activeRecord.createdAt), 'dd/MM/yyyy')
            : format(new Date(), 'dd/MM/yyyy');

        const logoUrl = window.location.origin + '/optimized/swetha-saiphani-logo.webp';
        const templateUrl = window.location.origin + '/templete%20new.jpeg';

        const docInfo = getDoctorQualification(activeRecord && activeRecord.doctor ? `Dr. ${activeRecord.doctor.firstName} ${activeRecord.doctor.lastName}` : (patient.consulting_doctor || ""), activeRecord?.doctor);

        // Helper to generate HTML for tables/sections
        const activeConditionsHtml = activeRecord && activeRecord.diagnosis
            ? `<div class="section-block">
                <h3 class="section-title">Active Medical Conditions</h3>
                <div class="section-content">${activeRecord.diagnosis}</div>
               </div>`
            : `<div class="section-block">
                <h3 class="section-title">Active Medical Conditions</h3>
                <p class="empty-note">No active conditions recorded</p>
               </div>`;

        const historyHtml = records.length > 0
            ? `<div class="section-block">
                 <h3 class="section-title">Medical Records History</h3>
                 <div class="section-content">
                    <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
                        ${records.slice(0, 5).map(r => `<li>${format(new Date(r.date || r.createdAt), 'dd MMM yyyy')} - ${r.diagnosis || 'No Diagnosis'}</li>`).join('')}
                    </ul>
                 </div>
                </div>`
            : `<div class="section-block">
                 <h3 class="section-title">Medical Records History</h3>
                 <p class="empty-note">No medical records found.</p>
                </div>`;

        const medsHtml = activeRecord && activeRecord.prescriptions && activeRecord.prescriptions.length > 0
            ? `<div class="section-block">
                <h3 class="section-title">Current Medications</h3>
                <table>
                  <thead><tr>
                    <th style="width:5%">#</th>
                    <th style="width:25%">Drug Name</th>
                    <th style="width:15%">Dosage</th>
                    <th style="width:15%">Frequency</th>
                    <th style="width:15%">Duration</th>
                    <th style="width:25%">Instructions</th>
                  </tr></thead>
                  <tbody>${activeRecord.prescriptions.map((m, i) => `<tr>
                    <td>${i + 1}</td>
                    <td><strong>${m.medicineName}</strong></td>
                    <td>${m.dosage || "-"}</td>
                    <td>${m.frequency || "-"}</td>
                    <td>${m.duration || "-"}</td>
                    <td>${m.instructions || "-"}</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div class="section-block">
                <h3 class="section-title">Current Medications</h3>
                <p class="empty-note">No active medications</p>
               </div>`;

        const labHtml = activeRecord && activeRecord.labOrders && activeRecord.labOrders.length > 0
            ? `<div class="section-block">
                <h3 class="section-title">Recent Lab Results</h3>
                <table>
                  <thead><tr>
                    <th style="width:5%">#</th>
                    <th style="width:45%">Test Name</th>
                    <th style="width:25%">Priority</th>
                    <th style="width:25%">Instructions</th>
                  </tr></thead>
                  <tbody>${activeRecord.labOrders.map((t, i) => `<tr>
                    <td>${i + 1}</td>
                    <td><strong>${t}</strong></td>
                    <td>-</td>
                    <td>-</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div class="section-block">
                <h3 class="section-title">Recent Lab Results</h3>
                <p class="empty-note">No recent lab results found</p>
               </div>`;

        // Body Content
        let bodyContent = '';
        if (activeRecord) {
            bodyContent = `
                ${activeConditionsHtml}
                ${historyHtml}
                ${medsHtml}
                ${labHtml}
             `;
        } else {
            bodyContent = `
                <div style="padding: 40px 0; text-align: center;">
                    <p style="color: #555; font-style: italic;">This patient has no old records</p>
                </div>
            `;
        }

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Patient Report - ${patient.full_name}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 10pt; color: #333; margin: 0; padding: 0; }
    
    .page-container {
        position: relative;
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding-top: 55mm; 
        padding-bottom: 20mm;
        padding-left: 15mm;
        padding-right: 15mm;
        overflow: hidden;
    }

    .template-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -2;
        object-fit: fill;
    }

    .content-wrapper {
        position: relative;
        z-index: 1;
    }

    .report-title {
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 20px;
        color: #2c3e50;
        border-bottom: 3px solid #00aeef;
        display: inline-block;
        padding-bottom: 5px;
    }
    .title-container { text-align: center; margin-bottom: 20px; }

    /* Patient Info Grid */
    .patient-info-header {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 10px;
        color: #2c3e50;
    }

    .patient-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 40px;
        margin-bottom: 25px;
        font-size: 10pt;
    }
    
    .info-row { display: grid; grid-template-columns: 120px 1fr; align-items: baseline; }
    .info-label { 
        font-weight: 700; 
        color: #7f8c8d; 
        text-transform: uppercase;
        font-size: 9pt;
    }
    .info-value { 
        font-weight: 600; 
        color: #2c3e50; 
    }

    /* Sections */
    .section-block { margin-bottom: 20px; }
    .section-title {
        font-size: 11pt;
        font-weight: 700;
        color: #2c3e50;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
        margin-bottom: 10px;
        text-transform: none; /* User requested: "Active Medical Conditions" (Title Case) */
    }
    .section-content { font-size: 10pt; line-height: 1.5; white-space: pre-line; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    th { text-align: left; background-color: #f8f9fa; padding: 8px; border-bottom: 2px solid #dde2e6; color: #495057; font-weight: bold; }
    td { padding: 8px; border-bottom: 1px solid #eee; color: #333; }
    
    .empty-note { font-style: italic; color: #999; font-size: 10pt; margin: 0; }

    @media print {
      body { -webkit-print-color-adjust: exact; }
      @page { margin: 0; }
    }
  </style>
</head>
<body>
    <div class="page-container">
        <img src="${templateUrl}" class="template-bg" />

        <div class="content-wrapper">
            <div class="title-container">
                <span class="report-title">PATIENT REPORT</span>
            </div>

            <div class="patient-info-header">Patient Information</div>
            <div class="patient-info-grid">
                <!-- Left Column -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="info-row">
                        <span class="info-label">NAME</span>
                        <span class="info-value" style="text-transform: uppercase;">${patient.full_name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">AGE / GENDER</span>
                        <span class="info-value">${patient.age || '-'} / ${patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">CONTACT</span>
                        <span class="info-value">${patient.phone}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">ADDRESS</span>
                        <span class="info-value">${patient.address || '-'}</span>
                    </div>
                </div>

                <!-- Right Column -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                     <div class="info-row">
                        <span class="info-label">PATIENT ID</span>
                        <span class="info-value">${patient.uhid || patient.id || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">BLOOD GROUP</span>
                        <span class="info-value">${patient.blood_group || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">EMAIL</span>
                        <span class="info-value">${patient.email || '-'}</span>
                    </div>
                     <div class="info-row">
                        <span class="info-label">CONSULTANT</span>
                        <span class="info-value">
                            ${patient.consulting_doctor || '-'} 
                            ${getDoctorQualification(patient.consulting_doctor) ? `<br/><span style="font-size: 8pt; font-weight: normal;">(${getDoctorQualification(patient.consulting_doctor)})</span>` : ''}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Sections Order: Active Medical Conditions -> Medical Records History -> Current Medications -> Recent Lab Results -->
            
            ${activeConditionsHtml}
            ${historyHtml}
            ${medsHtml}
            ${labHtml}

        </div>
    </div>
    <script>
        window.onload = function() { 
            setTimeout(function() {
                window.print();
            }, 500); 
        }
    </script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    }



    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>
                        <VisuallyHidden>Medical Record Details</VisuallyHidden>
                    </DialogTitle>
                    <DialogDescription>
                        <VisuallyHidden>View and manage patient medical record information.</VisuallyHidden>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex h-full">
                    {/* Left Sidebar - History List (Same as before) */}
                    <div className="w-64 border-r bg-gray-50 flex flex-col hidden md:flex">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Patient History
                            </h3>
                        </div>
                        <ScrollArea className="flex-1">
                            {loadingRecords ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                            ) : records.length === 0 ? (
                                <div className="p-4 text-sm text-gray-500 text-center italic">No history found</div>
                            ) : (
                                <div className="divide-y">
                                    {records.map((record, index) => (
                                        <button
                                            key={record.id}
                                            onClick={() => setCurrentRecordIndex(index)}
                                            className={`w-full text-left p-4 hover:bg-white transition-colors ${currentRecordIndex === index ? 'bg-white border-l-4 border-primary shadow-sm' : ''}`}
                                        >
                                            <div className="font-medium text-sm text-gray-900">
                                                {format(new Date(record.date || record.createdAt), 'dd MMM yyyy')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                {record.diagnosis || "No diagnosis"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between p-2 border-b bg-white z-10">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="md:hidden">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium text-gray-500">
                                    {activeRecord
                                        ? `Record Date: ${format(new Date(activeRecord.date || activeRecord.createdAt), 'dd MMM yyyy')}`
                                        : "New Record"}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
                                    <Printer className="h-4 w-4" /> Print Report
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Content Area - mimicking the A4 report */}
                        <div className="flex-1 bg-gray-100/50 p-4 md:p-8 overflow-y-auto">
                            <div
                                className="bg-white mx-auto shadow-sm text-xs md:text-sm text-gray-900 relative"
                                style={{
                                    maxWidth: '210mm',
                                    minHeight: '297mm',
                                    margin: '0 auto',
                                    backgroundColor: 'white',
                                    paddingTop: '55mm', // Clear template header
                                    paddingLeft: '15mm',
                                    paddingRight: '15mm',
                                    paddingBottom: '20mm',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Template Background Image */}
                                <img
                                    src="/templete%20new.jpeg"
                                    alt="Template"
                                    className="absolute top-0 left-0 w-full h-full object-fill z-0 pointer-events-none"
                                />

                                {loadingRecords ? (
                                    <div className="flex items-center justify-center h-64 z-10 relative">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="relative z-10">

                                        {/* Title */}
                                        <div className="text-center mb-6">
                                            <span className="text-2xl font-bold text-[#2c3e50] tracking-wider uppercase border-b-[3px] border-[#00aeef] pb-1 inline-block">
                                                PATIENT REPORT
                                            </span>
                                        </div>

                                        {/* Patient Information Header */}
                                        <div className="mb-3 font-bold text-[#2c3e50] text-[12pt]">Patient Information</div>

                                        {/* Patient Info Grid */}
                                        <div className="grid grid-cols-2 gap-x-10 gap-y-2 mb-8 text-[10pt]">
                                            {/* Left Column */}
                                            <div className="flex flex-col gap-2">
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Name</span>
                                                    <span className="font-semibold text-gray-900 uppercase">{patient.full_name}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Age / Gender</span>
                                                    <span className="text-gray-900">{patient.age || '-'} / {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '-'}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Contact</span>
                                                    <span className="text-gray-900">{patient.phone}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Address</span>
                                                    <span className="text-gray-900">{patient.address || '-'}</span>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="flex flex-col gap-2">
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Patient ID</span>
                                                    <span className="text-gray-900">{patient.uhid || patient.id || '-'}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Blood Group</span>
                                                    <span className="text-gray-900">{patient.blood_group || '-'}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Email</span>
                                                    <span className="text-gray-900">{patient.email || '-'}</span>
                                                </div>
                                                <div className="grid grid-cols-[100px_1fr] items-baseline">
                                                    <span className="font-bold text-gray-500 uppercase text-xs">Consultant</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900">{patient.consulting_doctor || '-'}</span>
                                                        {getDoctorQualification(patient.consulting_doctor) && (
                                                            <span className="text-gray-500 text-[10px]">{getDoctorQualification(patient.consulting_doctor)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Conditions */}
                                        <div className="mb-6">
                                            <h3 className="text-[#2c3e50] text-[11pt] font-bold border-b border-gray-300 mb-2 pb-1">Active Medical Conditions</h3>
                                            <div className="text-[10pt] whitespace-pre-line leading-relaxed">
                                                {activeRecord && activeRecord.diagnosis
                                                    ? activeRecord.diagnosis
                                                    : <span className="italic text-gray-400">No active conditions recorded</span>}
                                            </div>
                                        </div>

                                        {/* Medical Records History */}
                                        <div className="mb-6">
                                            <h3 className="text-[#2c3e50] text-[11pt] font-bold border-b border-gray-300 mb-2 pb-1">Medical Records History</h3>
                                            {records.length > 0 ? (
                                                <ul className="list-disc pl-5 text-[10pt] space-y-1">
                                                    {records.slice(0, 5).map(r => (
                                                        <li key={r.id}>
                                                            {format(new Date(r.date || r.createdAt), 'dd MMM yyyy')} - {r.diagnosis || 'No Diagnosis'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="italic text-gray-400 text-[10pt]">No medical records found.</span>
                                            )}
                                        </div>

                                        {/* Current Medications */}
                                        <div className="mb-6">
                                            <h3 className="text-[#2c3e50] text-[11pt] font-bold border-b border-gray-300 mb-2 pb-1">Current Medications</h3>
                                            {activeRecord && activeRecord.prescriptions && activeRecord.prescriptions.length > 0 ? (
                                                <table className="w-full text-[9pt] border-collapse mt-2">
                                                    <thead>
                                                        <tr className="bg-[#f8f9fa]">
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">#</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Drug Name</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Dosage</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Frequency</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Duration</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Instructions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeRecord.prescriptions.map((m, i) => (
                                                            <tr key={i} className="border-b border-gray-100">
                                                                <td className="p-2">{i + 1}</td>
                                                                <td className="p-2 font-medium">{m.medicineName}</td>
                                                                <td className="p-2">{m.dosage || "-"}</td>
                                                                <td className="p-2">{m.frequency || "-"}</td>
                                                                <td className="p-2">{m.duration || "-"}</td>
                                                                <td className="p-2">{m.instructions || "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="italic text-gray-400 text-[10pt]">No active medications</p>
                                            )}
                                        </div>

                                        {/* Recent Lab Results */}
                                        <div className="mb-6">
                                            <h3 className="text-[#2c3e50] text-[11pt] font-bold border-b border-gray-300 mb-2 pb-1">Recent Lab Results</h3>
                                            {activeRecord && activeRecord.labOrders && activeRecord.labOrders.length > 0 ? (
                                                <table className="w-full text-[9pt] border-collapse mt-2">
                                                    <thead>
                                                        <tr className="bg-[#f8f9fa]">
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">#</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Test Name</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Priority</th>
                                                            <th className="border-b-2 border-gray-200 p-2 text-left font-bold text-gray-600">Instructions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeRecord.labOrders.map((t, i) => (
                                                            <tr key={i} className="border-b border-gray-100">
                                                                <td className="p-2">{i + 1}</td>
                                                                <td className="p-2 font-medium">{t}</td>
                                                                <td className="p-2">-</td>
                                                                <td className="p-2">-</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="italic text-gray-400 text-[10pt]">No recent lab results found</p>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions if needed, but we have them in header */}
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}

