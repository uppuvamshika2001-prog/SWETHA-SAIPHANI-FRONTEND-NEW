import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Loader2, AlertCircle, ChevronLeft, ChevronRight, History } from "lucide-react";
import { usePatients } from "@/contexts/PatientContext";
import { useState, useEffect } from "react";
import { DOCTORS } from "@/data/doctors";


import { medicalRecordService, MedicalRecord } from "@/services/medicalRecordService";
import { Patient } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
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

                        // Filter out "ghost" records (records older than patient creation)
                        // This handles the database ID reuse issue
                        const patientCreationDate = new Date(patient?.created_at || 0);
                        const validRecords = data.filter(record => {
                            const recordDate = new Date(record.date || record.createdAt);
                            // Allow a small buffer (e.g., 24 hours) in case of timezone diffs or pre-dated records
                            // But strictly exclude records from weeks/months ago if patient is new
                            return recordDate.getTime() >= patientCreationDate.getTime() - (24 * 60 * 60 * 1000);
                        });

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
    }, [showOpen, showMedicalRecords, patientId, patient?.uhid]);

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

    const getDoctorQualification = (doctorName: string, doctorObj?: any) => {
        if (doctorObj && doctorObj.specialization) {
            return `Dr. ${doctorObj.firstName} ${doctorObj.lastName}, ${doctorObj.specialization}`;
        }

        // Normalize name for lookup
        const normalizeName = (name: string) => name?.toLowerCase().replace(/\s+/g, '').trim() || '';
        const target = normalizeName(doctorName);

        const found = DOCTORS.find(d => normalizeName(d.full_name) === target || normalizeName(d.full_name).includes(target));

        if (found) {
            return `${found.full_name}, ${found.specialization}`; // Use full name from list which includes "Dr."
        }

        return doctorName || "-";
    };

    const handlePrint = () => {
        if (!patient) return;

        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) return;

        const today = activeRecord
            ? format(new Date(activeRecord.date || activeRecord.createdAt), 'dd/MM/yyyy')
            : format(new Date(), 'dd/MM/yyyy');



        const doctorDetails = getDoctorDetails(activeRecord && activeRecord.doctor ? `Dr. ${activeRecord.doctor.firstName} ${activeRecord.doctor.lastName}` : (patient.consulting_doctor || ""), activeRecord?.doctor);

        // Helper to generate HTML for tables/sections
        const vitalsHtml = activeRecord && activeRecord.vitals && Object.values(activeRecord.vitals).some(v => v)
            ? `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Vitals</h3>
                <table style="width:100%;font-size:12px"><tr>
                  ${activeRecord.vitals.bloodPressureSystolic || activeRecord.vitals.bloodPressureDiastolic ? `<td style="padding:3px 8px"><strong>BP:</strong> ${activeRecord.vitals.bloodPressureSystolic || "-"}/${activeRecord.vitals.bloodPressureDiastolic || "-"} mmHg</td>` : ""}
                  ${activeRecord.vitals.heartRate ? `<td style="padding:3px 8px"><strong>Pulse:</strong> ${activeRecord.vitals.heartRate} bpm</td>` : ""}
                  ${activeRecord.vitals.temperature ? `<td style="padding:3px 8px"><strong>Temp:</strong> ${activeRecord.vitals.temperature} °F</td>` : ""}
                  ${activeRecord.vitals.weight ? `<td style="padding:3px 8px"><strong>Weight:</strong> ${activeRecord.vitals.weight} kg</td>` : ""}
                  ${activeRecord.vitals.oxygenSaturation ? `<td style="padding:3px 8px"><strong>SpO₂:</strong> ${activeRecord.vitals.oxygenSaturation}%</td>` : ""}
                </tr></table>
               </div>`
            : "";

        const medsHtml = activeRecord && activeRecord.prescriptions && activeRecord.prescriptions.length > 0
            ? `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Current Medications</h3>
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                  <thead><tr style="background:#f0f4f8">
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">#</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Drug Name</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Dosage</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Frequency</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Duration</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Instructions</th>
                  </tr></thead>
                  <tbody>${activeRecord.prescriptions.map((m, i) => `<tr>
                    <td style="padding:4px 6px;border:1px solid #ddd">${i + 1}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.medicineName}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.dosage || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.frequency || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.duration || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.instructions || "-"}</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Current Medications</h3>
                <p style="font-style:italic;color:#888;font-size:11px;margin:4px 0">No active medications</p>
               </div>`;

        const labHtml = activeRecord && activeRecord.labOrders && activeRecord.labOrders.length > 0
            ? `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Lab Tests Ordered</h3>
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                  <thead><tr style="background:#f0f4f8">
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">#</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Test Name</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Priority</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Instructions</th>
                  </tr></thead>
                  <tbody>${activeRecord.labOrders.map((t, i) => `<tr>
                    <td style="padding:4px 6px;border:1px solid #ddd">${i + 1}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${t}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">-</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">-</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Lab Tests</h3>
                <p style="font-style:italic;color:#888;font-size:11px;margin:4px 0">No lab tests ordered</p>
               </div>`;

        // Body Content Generation
        let bodyContent = '';
        if (activeRecord) {
            bodyContent = `
                <div class="section-block"><h3 class="section-title">Chief Complaints</h3><div class="section-content">${activeRecord.chiefComplaint || '<span class="empty-note">No chief complaints recorded</span>'}</div></div>
                ${vitalsHtml}
                <div class="section-block"><h3 class="section-title">Diagnosis / Doctor Notes</h3><div class="section-content">${activeRecord.diagnosis || '<span class="empty-note">No diagnosis recorded</span>'}</div></div>
                ${medsHtml}
                ${labHtml}
                <div class="section-block"><h3 class="section-title">Treatment Plan</h3><div class="section-content">${plan || '<span class="empty-note">No treatment plan specified</span>'}</div></div>
                <div class="section-block"><h3 class="section-title">Follow-Up</h3><div class="section-content">${followUp || '<span class="empty-note">No follow-up scheduled</span>'}</div></div>
                ${additional ? `<div class="section-block"><h3 class="section-title">Additional Notes</h3><div class="section-content">${additional}</div></div>` : ''}
                <div class="signature-block"><div class="signature-line">Doctor's Signature</div></div>
             `;
        } else {
            bodyContent = `
                <div style="padding: 40px 0; text-align: center;">
                    <p style="color: #555; font-style: italic; font-size: 13px;">This patient has no old records</p>
                </div>
            `;
        }

        const templateUrl = window.location.origin + '/templete%20new.jpeg';

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Patient Report - ${patient.full_name}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #212121; margin: 0; padding: 0; }
    .page {
      position: relative; width: 210mm; min-height: 297mm;
      background-image: url('${templateUrl}');
      background-size: 210mm 297mm;
      background-repeat: no-repeat;
      background-position: top left;
      page-break-after: auto;
    }
    .content { padding: 160px 40px 70px 40px; }
    .title-bar { text-align: center; padding: 4px 0; margin: 0 0 10px 0; }
    .title-bar h2 { font-size: 15px; font-weight: bold; color: #00509e; letter-spacing: 1px; }
    .title-bar .title-line { width: 100%; height: 2px; background: #1a365d; margin-top: 3px; }
    .patient-info { margin-bottom: 12px; }
    .patient-info h3 { color: #00509e; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 20px; font-size: 11.5px; }
    .info-grid .row { display: flex; padding: 2px 0; }
    .info-grid .label { color: #555; width: 105px; flex-shrink: 0; font-weight: 600; }
    .info-grid .value { color: #212121; }
    .section-title { color: #00509e; font-size: 12.5px; margin: 0 0 4px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
    .section-content { font-size: 11.5px; margin-bottom: 8px; white-space: pre-line; line-height: 1.4; }
    .section-block { margin-bottom: 10px; page-break-inside: avoid; }
    .empty-note { font-style: italic; color: #888; font-size: 10.5px; margin: 3px 0; }
    .signature-block { margin-top: 24px; text-align: right; padding-right: 20px; }
    .signature-line { display: inline-block; border-top: 1px solid #333; padding-top: 5px; font-size: 11px; min-width: 170px; text-align: center; }
    table { page-break-inside: avoid; border-collapse: collapse; width: 100%; font-size: 11px; }
    th { padding: 5px 6px; border: 1px solid #ddd; text-align: left; background: #f0f4f8; }
    td { padding: 4px 6px; border: 1px solid #ddd; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { background-image: url('${templateUrl}') !important; background-size: 210mm 297mm !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">
      <div class="title-bar"><h2>PATIENT REPORT</h2><div class="title-line"></div></div>
      <div class="patient-info">
        <h3>Patient Information</h3>
        <div class="info-grid">
          <div class="row"><span class="label">NAME</span><span class="value">${patient.full_name || "-"}</span></div>
          <div class="row"><span class="label">PATIENT ID</span><span class="value">${patient.uhid || "-"}</span></div>
          <div class="row"><span class="label">AGE / GENDER</span><span class="value">${patient.age || "-"} / <span style="text-transform:capitalize">${patient.gender || "-"}</span></span></div>
          <div class="row"><span class="label">BLOOD GROUP</span><span class="value">${patient.blood_group || "N/A"}</span></div>
          <div class="row"><span class="label">CONTACT</span><span class="value">${patient.phone || "-"}</span></div>
          <div class="row"><span class="label">EMAIL</span><span class="value">${patient.email || "N/A"}</span></div>
          <div class="row" style="grid-column:1/-1"><span class="label">ADDRESS</span><span class="value">${patient.address || "N/A"}</span></div>
          <div class="row"><span class="label">CONSULTANT</span><span class="value">${getDoctorQualification(activeRecord && activeRecord.doctor ? `Dr. ${activeRecord.doctor.firstName} ${activeRecord.doctor.lastName}` : (patient.consulting_doctor || ""), activeRecord?.doctor)}</span></div>
          <div class="row"><span class="label">DATE</span><span class="value">${today}</span></div>
        </div>
      </div>
      ${bodyContent}
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

    if (!patient) return null;

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-[850px] w-full p-0 gap-0 h-[90vh] flex flex-col bg-white">
                {/* Fixed Header with Navigation if multiple records */}
                <div className="p-4 border-b flex items-center justify-between bg-white shrink-0 z-10 w-full">
                    <div>
                        <DialogTitle className="text-lg font-bold text-gray-900">Patient Details</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            View patient medical history and report
                        </DialogDescription>
                        {records.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Record {currentRecordIndex + 1} of {records.length} • {activeRecord && format(new Date(activeRecord.date || activeRecord.createdAt), 'dd MMM yyyy')}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {records.length > 1 && (
                            <div className="flex items-center mr-2 bg-muted rounded-md border">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={currentRecordIndex >= records.length - 1}
                                    onClick={() => setCurrentRecordIndex(prev => Math.min(prev + 1, records.length - 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs px-2 min-w-[60px] text-center font-medium">
                                    {format(new Date(records[currentRecordIndex].date || records[currentRecordIndex].createdAt), 'dd/MM/yy')}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={currentRecordIndex <= 0}
                                    onClick={() => setCurrentRecordIndex(prev => Math.max(prev - 1, 0))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowOpen(false)}>Close</Button>
                    </div>
                </div>

                {/* Scrollable Content Area - mimicking the A4 report */}
                <ScrollArea className="flex-1 bg-gray-100/50 p-4 md:p-8">
                    <div
                        className="bg-white mx-auto shadow-sm text-xs md:text-sm text-gray-900 relative"
                        style={{
                            maxWidth: '210mm',
                            minHeight: '297mm',
                            padding: '160px 40px 70px 40px',
                            backgroundImage: "url('/templete%20new.jpeg')", // Corrected path from code
                            backgroundSize: '100% 100%', // Changed to fit container
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'top center',
                        }}
                    >
                        {loadingRecords ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* PATIENT INFO - ALWAYS VISIBLE */}
                                <div className="mb-6">
                                    <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1 uppercase">Patient Information</h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px]">
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">NAME</span><span className="font-medium">{patient.full_name}</span></div>
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">PATIENT ID</span><span className="font-medium">{patient.uhid}</span></div>
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">AGE / GENDER</span><span className="font-medium">{patient.age} / <span className="capitalize">{patient.gender}</span></span></div>
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">BLOOD GROUP</span><span className="font-medium">{patient.blood_group || 'N/A'}</span></div>
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">CONTACT</span><span className="font-medium">{patient.phone}</span></div>
                                        <div className="flex"><span className="w-24 text-[#555] font-semibold shrink-0">EMAIL</span><span className="font-medium lowercase">{patient.email || 'N/A'}</span></div>
                                        <div className="col-span-2 flex mt-1"><span className="w-24 text-[#555] font-semibold shrink-0">ADDRESS</span><span className="font-medium">{patient.address || 'N/A'}</span></div>
                                        <div className="flex mt-1"><span className="w-24 text-[#555] font-semibold shrink-0">CONSULTANT</span><span className="font-medium">{getDoctorQualification(activeRecord && activeRecord.doctor ? `Dr. ${activeRecord.doctor.firstName} ${activeRecord.doctor.lastName}` : (patient.consulting_doctor || ""), activeRecord?.doctor)}</span></div>
                                        <div className="flex mt-1"><span className="w-24 text-[#555] font-semibold shrink-0">DATE</span><span className="font-medium">{activeRecord ? format(new Date(activeRecord.date || activeRecord.createdAt), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}</span></div>
                                    </div>
                                </div>

                                {!activeRecord ? (
                                    <div className="py-8">
                                        <p className="text-[#555] italic text-[12px]">This patient has no old records</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* CHIEF COMPLAINTS */}
                                        <div className="mb-4">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Chief Complaints</h3>
                                            <div className="text-[11.5px] whitespace-pre-line leading-relaxed">
                                                {activeRecord.chiefComplaint || <span className="italic text-gray-400">No chief complaints recorded</span>}
                                            </div>
                                        </div>

                                        {/* VITALS */}
                                        {activeRecord.vitals && Object.values(activeRecord.vitals).some(v => v) && (
                                            <div className="mb-6">
                                                <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Vitals</h3>
                                                <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12px] pt-1">
                                                    {(activeRecord.vitals.bloodPressureSystolic || activeRecord.vitals.bloodPressureDiastolic) && (
                                                        <div><span className="font-bold">BP:</span> {activeRecord.vitals.bloodPressureSystolic || '-'}/{activeRecord.vitals.bloodPressureDiastolic || '-'} mmHg</div>
                                                    )}
                                                    {activeRecord.vitals.heartRate && (
                                                        <div><span className="font-bold">Pulse:</span> {activeRecord.vitals.heartRate} bpm</div>
                                                    )}
                                                    {activeRecord.vitals.temperature && (
                                                        <div><span className="font-bold">Temp:</span> {activeRecord.vitals.temperature} °F</div>
                                                    )}
                                                    {activeRecord.vitals.weight && (
                                                        <div><span className="font-bold">Weight:</span> {activeRecord.vitals.weight} kg</div>
                                                    )}
                                                    {activeRecord.vitals.oxygenSaturation && (
                                                        <div><span className="font-bold">SpO₂:</span> {activeRecord.vitals.oxygenSaturation}%</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* DIAGNOSIS */}
                                        <div className="mb-4">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Diagnosis / Doctor Notes</h3>
                                            <div className="text-[11.5px] whitespace-pre-line leading-relaxed">
                                                {activeRecord.diagnosis || <span className="italic text-gray-400">No diagnosis recorded</span>}
                                            </div>
                                        </div>

                                        {/* MEDICATIONS */}
                                        <div className="mb-6">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Current Medications</h3>
                                            {activeRecord.prescriptions && activeRecord.prescriptions.length > 0 ? (
                                                <table className="w-full text-[11px] border-collapse">
                                                    <thead>
                                                        <tr className="bg-[#f0f4f8]">
                                                            <th className="border border-gray-300 p-1.5 text-left w-8">#</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Drug Name</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Dosage</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Frequency</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Duration</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Instructions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeRecord.prescriptions.map((med, idx) => (
                                                            <tr key={idx}>
                                                                <td className="border border-gray-300 p-1.5">{idx + 1}</td>
                                                                <td className="border border-gray-300 p-1.5 font-medium">{med.medicineName}</td>
                                                                <td className="border border-gray-300 p-1.5">{med.dosage}</td>
                                                                <td className="border border-gray-300 p-1.5">{med.frequency}</td>
                                                                <td className="border border-gray-300 p-1.5">{med.duration}</td>
                                                                <td className="border border-gray-300 p-1.5">{med.instructions || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="italic text-gray-500 text-[11px]">No active medications</p>
                                            )}
                                        </div>

                                        {/* LAB TESTS */}
                                        <div className="mb-6">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Lab Tests Ordered</h3>
                                            {activeRecord.labOrders && activeRecord.labOrders.length > 0 ? (
                                                <table className="w-full text-[11px] border-collapse">
                                                    <thead>
                                                        <tr className="bg-[#f0f4f8]">
                                                            <th className="border border-gray-300 p-1.5 text-left w-8">#</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Test Name</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Priority</th>
                                                            <th className="border border-gray-300 p-1.5 text-left">Instructions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeRecord.labOrders.map((test, idx) => (
                                                            <tr key={idx}>
                                                                <td className="border border-gray-300 p-1.5">{idx + 1}</td>
                                                                <td className="border border-gray-300 p-1.5 font-medium">{test}</td>
                                                                <td className="border border-gray-300 p-1.5">-</td>
                                                                <td className="border border-gray-300 p-1.5">-</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="italic text-gray-500 text-[11px]">No lab tests ordered</p>
                                            )}
                                        </div>

                                        {/* TREATMENT PLAN */}
                                        <div className="mb-4">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Treatment Plan</h3>
                                            <div className="text-[11.5px] whitespace-pre-line leading-relaxed">
                                                {plan || <span className="italic text-gray-400">No treatment plan specified</span>}
                                            </div>
                                        </div>

                                        {/* FOLLOW UP */}
                                        <div className="mb-4">
                                            <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Follow-Up</h3>
                                            <div className="text-[11.5px] whitespace-pre-line leading-relaxed">
                                                {followUp ? (
                                                    followUp
                                                ) : (
                                                    <span className="italic text-gray-400">No follow-up scheduled</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ADDITIONAL NOTES */}
                                        {additional && (
                                            <div className="mb-4">
                                                <h3 className="text-[#00509e] text-[13px] font-bold border-b border-gray-300 mb-2 pb-1">Additional Notes</h3>
                                                <div className="text-[11.5px] whitespace-pre-line leading-relaxed">{additional}</div>
                                            </div>
                                        )}

                                        {/* Signature */}
                                        <div className="mt-12 text-right">
                                            <div className="inline-block border-t border-gray-800 pt-1 text-[11px] min-w-[150px] text-center">
                                                Doctor's Signature
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer Actions if needed, but we have them in header */}
            </DialogContent>
        </Dialog>
    );
}

