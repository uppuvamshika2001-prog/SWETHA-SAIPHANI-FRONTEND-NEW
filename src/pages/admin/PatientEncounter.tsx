import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    Printer,
    Stethoscope,
    Heart,
    Pill,
    FlaskConical,
    ClipboardList,
    CalendarCheck,
    FileText,
    User,
    Phone,
    Droplets,
    AlertTriangle,
} from "lucide-react";
import { patientService } from "@/services/patientService";
import { medicalRecordService } from "@/services/medicalRecordService";
import { Patient } from "@/types";
import { toast } from "sonner";

// --- Types ---
interface Medication {
    id: string;
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    notes: string;
}

interface LabTest {
    id: string;
    testName: string;
    priority: "routine" | "urgent" | "stat";
    instructions: string;
}

let idCounter = 0;
const genId = () => `tmp-${++idCounter}-${Date.now()}`;

// --- Component ---
export default function PatientEncounter() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const role = location.pathname.includes("/reception")
        ? "receptionist"
        : location.pathname.includes("/doctor")
            ? "doctor"
            : "admin";

    // Patient data
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [chiefComplaints, setChiefComplaints] = useState("");
    const [vitals, setVitals] = useState({
        bpSystolic: "",
        bpDiastolic: "",
        pulse: "",
        temperature: "",
        weight: "",
        spo2: "",
    });
    const [diagnosis, setDiagnosis] = useState("");
    const [medications, setMedications] = useState<Medication[]>([]);
    const [labTests, setLabTests] = useState<LabTest[]>([]);
    const [treatmentPlan, setTreatmentPlan] = useState("");
    const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
    const [followUpInstructions, setFollowUpInstructions] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");

    // Load patient
    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            try {
                const p = await patientService.getPatientById(id);
                setPatient(p);
            } catch (err) {
                console.error("Failed to load patient", err);
                toast.error("Failed to load patient data");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // --- Medication helpers ---
    const addMedication = () =>
        setMedications((prev) => [
            ...prev,
            { id: genId(), drugName: "", dosage: "", frequency: "", duration: "", notes: "" },
        ]);

    const updateMedication = (idx: number, field: keyof Medication, value: string) =>
        setMedications((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

    const removeMedication = (idx: number) =>
        setMedications((prev) => prev.filter((_, i) => i !== idx));

    // --- Lab test helpers ---
    const addLabTest = () =>
        setLabTests((prev) => [
            ...prev,
            { id: genId(), testName: "", priority: "routine", instructions: "" },
        ]);

    const updateLabTest = (idx: number, field: keyof LabTest, value: string) =>
        setLabTests((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));

    const removeLabTest = (idx: number) =>
        setLabTests((prev) => prev.filter((_, i) => i !== idx));

    // --- Save ---
    const handleSave = async (printAfter = false) => {
        if (!patient) return;
        if (!chiefComplaints.trim() && !diagnosis.trim()) {
            toast.error("Please enter at least Chief Complaints or Diagnosis");
            return;
        }

        setSaving(true);
        try {
            const record = await medicalRecordService.createRecord({
                patientId: patient.uhid, // Enforce UHID linking
                doctorId: "current-doctor", // placeholder – backend should resolve from auth
                chiefComplaint: chiefComplaints,
                diagnosis,
                treatmentNotes:
                    [treatmentPlan, followUpInstructions, additionalNotes].filter(Boolean).join("\n\n---\n\n"),
                vitals: {
                    bloodPressureSystolic: vitals.bpSystolic ? Number(vitals.bpSystolic) : undefined,
                    bloodPressureDiastolic: vitals.bpDiastolic ? Number(vitals.bpDiastolic) : undefined,
                    heartRate: vitals.pulse ? Number(vitals.pulse) : undefined,
                    temperature: vitals.temperature ? Number(vitals.temperature) : undefined,
                    weight: vitals.weight ? Number(vitals.weight) : undefined,
                    oxygenSaturation: vitals.spo2 ? Number(vitals.spo2) : undefined,
                },
                prescriptions: medications
                    .filter((m) => m.drugName.trim())
                    .map((m) => ({
                        medicineName: m.drugName,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        duration: m.duration,
                        instructions: m.notes,
                    })),
                labOrders: labTests.filter((t) => t.testName.trim()).map((t) => t.testName),
            });

            toast.success("Encounter saved successfully!");

            if (printAfter) {
                printRecord(record);
            }
        } catch (err) {
            console.error("Failed to save encounter", err);
            toast.error("Failed to save encounter. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // --- Print Record (Clinic Branded Template) ---
    const printRecord = (_record: any) => {
        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) return;

        const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

        const hasVitals = Object.values(vitals).some((v) => v.trim());
        const vitalsHtml = hasVitals
            ? `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Vitals</h3>
                <table style="width:100%;font-size:12px"><tr>
                  ${vitals.bpSystolic || vitals.bpDiastolic ? `<td style="padding:3px 8px"><strong>BP:</strong> ${vitals.bpSystolic || "-"}/${vitals.bpDiastolic || "-"} mmHg</td>` : ""}
                  ${vitals.pulse ? `<td style="padding:3px 8px"><strong>Pulse:</strong> ${vitals.pulse} bpm</td>` : ""}
                  ${vitals.temperature ? `<td style="padding:3px 8px"><strong>Temp:</strong> ${vitals.temperature} °F</td>` : ""}
                  ${vitals.weight ? `<td style="padding:3px 8px"><strong>Weight:</strong> ${vitals.weight} kg</td>` : ""}
                  ${vitals.spo2 ? `<td style="padding:3px 8px"><strong>SpO₂:</strong> ${vitals.spo2}%</td>` : ""}
                </tr></table>
               </div>`
            : "";

        const activeMeds = medications.filter((m) => m.drugName.trim());
        const medsHtml = activeMeds.length > 0
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
                  <tbody>${activeMeds.map((m, i) => `<tr>
                    <td style="padding:4px 6px;border:1px solid #ddd">${i + 1}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.drugName}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.dosage || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.frequency || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.duration || "-"}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${m.notes || "-"}</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Current Medications</h3>
                <p style="font-style:italic;color:#888;font-size:11px;margin:4px 0">No active medications</p>
               </div>`;

        const activeTests = labTests.filter((t) => t.testName.trim());
        const labHtml = activeTests.length > 0
            ? `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Lab Tests Ordered</h3>
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                  <thead><tr style="background:#f0f4f8">
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">#</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Test Name</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Priority</th>
                    <th style="padding:5px 6px;border:1px solid #ddd;text-align:left">Instructions</th>
                  </tr></thead>
                  <tbody>${activeTests.map((t, i) => `<tr>
                    <td style="padding:4px 6px;border:1px solid #ddd">${i + 1}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${t.testName}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd;text-transform:capitalize">${t.priority}</td>
                    <td style="padding:4px 6px;border:1px solid #ddd">${t.instructions || "-"}</td>
                  </tr>`).join("")}</tbody>
                </table>
               </div>`
            : `<div style="margin-bottom:18px">
                <h3 style="color:#00509e;font-size:13px;margin:0 0 6px;border-bottom:1px solid #ccc;padding-bottom:3px">Lab Tests</h3>
                <p style="font-style:italic;color:#888;font-size:11px;margin:4px 0">No lab tests ordered</p>
               </div>`;

        const templateUrl = origin + '/templete%20new.jpeg';

        const allergiesRow = patient?.allergies && patient.allergies.length > 0
            ? '<div class="row"><span class="label">ALLERGIES</span><span class="value" style="color:#c11a1a;font-weight:600">' + patient.allergies.join(", ") + '</span></div>'
            : '';

        const chiefComplaintsHtml = chiefComplaints.trim()
            ? '<div class="section-content">' + chiefComplaints + '</div>'
            : '<p class="empty-note">No chief complaints recorded</p>';

        const diagnosisHtml = diagnosis.trim()
            ? '<div class="section-content">' + diagnosis + '</div>'
            : '<p class="empty-note">No diagnosis recorded</p>';

        const treatmentPlanHtml = treatmentPlan.trim()
            ? '<div class="section-content">' + treatmentPlan + '</div>'
            : '<p class="empty-note">No treatment plan specified</p>';

        const followUpHtml = (followUpDate
            ? '<p style="font-size:11.5px;margin-bottom:3px"><strong>Next Visit:</strong> ' + followUpDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + '</p>'
            : '') +
            (followUpInstructions.trim()
                ? '<p style="font-size:11.5px"><strong>Instructions:</strong> ' + followUpInstructions + '</p>'
                : '') +
            (!followUpDate && !followUpInstructions.trim()
                ? '<p class="empty-note">No follow-up scheduled</p>'
                : '');

        const additionalNotesHtml = additionalNotes.trim()
            ? '<div class="section-block"><h3 class="section-title">Additional Notes</h3><div class="section-content">' + additionalNotes + '</div></div>'
            : '';

        const html = `<!DOCTYPE html>
<html>
<head>
  <title>Patient Report - ${patient?.full_name}</title>
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
          <div class="row"><span class="label">NAME</span><span class="value">${patient?.full_name || "-"}</span></div>
          <div class="row"><span class="label">PATIENT ID</span><span class="value">${patient?.uhid || "-"}</span></div>
          <div class="row"><span class="label">AGE / GENDER</span><span class="value">${patient?.age || "-"} / <span style="text-transform:capitalize">${patient?.gender || "-"}</span></span></div>
          <div class="row"><span class="label">BLOOD GROUP</span><span class="value">${patient?.blood_group || "N/A"}</span></div>
          <div class="row"><span class="label">CONTACT</span><span class="value">${patient?.phone || "-"}</span></div>
          <div class="row"><span class="label">EMAIL</span><span class="value">${patient?.email || "N/A"}</span></div>
          <div class="row" style="grid-column:1/-1"><span class="label">ADDRESS</span><span class="value">${patient?.address || "N/A"}</span></div>
          <div class="row"><span class="label">DATE</span><span class="value">${today}</span></div>
          ${allergiesRow}
        </div>
      </div>
      <div class="section-block"><h3 class="section-title">Chief Complaints</h3>${chiefComplaintsHtml}</div>
      ${vitalsHtml}
      <div class="section-block"><h3 class="section-title">Diagnosis / Doctor Notes</h3>${diagnosisHtml}</div>
      ${medsHtml}
      ${labHtml}
      <div class="section-block"><h3 class="section-title">Treatment Plan</h3>${treatmentPlanHtml}</div>
      <div class="section-block"><h3 class="section-title">Follow-Up</h3>${followUpHtml}</div>
      ${additionalNotesHtml}
      <div class="signature-block"><div class="signature-line">Doctor's Signature</div></div>
    </div>
  </div>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 600);
    };


    // --- Render helpers ---
    const SectionHeader = ({
        icon,
        title,
        subtitle,
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle?: string;
    }) => (
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );

    if (loading) {
        return (
            <DashboardLayout role={role}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!patient) {
        return (
            <DashboardLayout role={role}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <p className="text-muted-foreground">Patient not found</p>
                    <Button variant="outline" onClick={() => navigate(role === "receptionist" ? "/reception/patients" : role === "doctor" ? "/doctor/patients" : "/admin/patients")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patients
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role={role}>
            <div className="space-y-6 pb-8">
                {/* Back button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(role === "receptionist" ? "/reception/patients" : role === "doctor" ? "/doctor/patients" : "/admin/patients")}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Patients
                </Button>

                {/* ─── PATIENT HEADER (Sticky) ─── */}
                <Card className="sticky top-0 z-20 border-primary/20 shadow-md bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            {/* Left: avatar + name */}
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {patient.full_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{patient.full_name}</h2>
                                    <p className="text-sm text-muted-foreground">UHID: {patient.uhid}</p>
                                </div>
                            </div>

                            {/* Info pills */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <Badge variant="outline" className="gap-1 py-1">
                                    <User className="h-3 w-3" />
                                    {patient.age}y / <span className="capitalize">{patient.gender}</span>
                                </Badge>
                                <Badge variant="outline" className="gap-1 py-1">
                                    <Phone className="h-3 w-3" />
                                    {patient.phone}
                                </Badge>
                                {patient.blood_group && (
                                    <Badge variant="outline" className="gap-1 py-1 border-red-300 text-red-700">
                                        <Droplets className="h-3 w-3" />
                                        {patient.blood_group}
                                    </Badge>
                                )}
                                {patient.allergies && patient.allergies.length > 0 && (
                                    <Badge variant="destructive" className="gap-1 py-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Allergies: {patient.allergies.join(", ")}
                                    </Badge>
                                )}
                                <Badge
                                    variant={patient.status === "active" ? "default" : "secondary"}
                                    className="py-1"
                                >
                                    {patient.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SECTION 1: Chief Complaints ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<Stethoscope className="h-5 w-5" />}
                            title="Chief Complaints"
                            subtitle="Primary reason for visit"
                        />
                        <Textarea
                            placeholder="Enter patient's chief complaints..."
                            className="min-h-[120px] text-base"
                            value={chiefComplaints}
                            onChange={(e) => setChiefComplaints(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* ─── SECTION 2: Vitals ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<Heart className="h-5 w-5" />}
                            title="Vitals"
                            subtitle="Optional but recommended"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { key: "bpSystolic", label: "BP Systolic", unit: "mmHg", placeholder: "120" },
                                { key: "bpDiastolic", label: "BP Diastolic", unit: "mmHg", placeholder: "80" },
                                { key: "pulse", label: "Pulse", unit: "bpm", placeholder: "72" },
                                { key: "temperature", label: "Temp", unit: "°F", placeholder: "98.6" },
                                { key: "weight", label: "Weight", unit: "kg", placeholder: "70" },
                                { key: "spo2", label: "SpO₂", unit: "%", placeholder: "98" },
                            ].map((v) => (
                                <div key={v.key} className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        {v.label}{" "}
                                        <span className="text-muted-foreground/60">({v.unit})</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder={v.placeholder}
                                        value={vitals[v.key as keyof typeof vitals]}
                                        onChange={(e) =>
                                            setVitals((prev) => ({ ...prev, [v.key]: e.target.value }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SECTION 3: Diagnosis ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<ClipboardList className="h-5 w-5" />}
                            title="Doctor Notes / Diagnosis"
                        />
                        <Textarea
                            placeholder="Enter diagnosis and clinical notes..."
                            className="min-h-[120px] text-base"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* ─── SECTION 4: Medications ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<Pill className="h-5 w-5" />}
                            title="Medications / Prescription"
                        />

                        {medications.length > 0 && (
                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-2 font-medium">Drug Name</th>
                                            <th className="text-left p-2 font-medium">Dosage</th>
                                            <th className="text-left p-2 font-medium">Frequency</th>
                                            <th className="text-left p-2 font-medium">Duration</th>
                                            <th className="text-left p-2 font-medium">Notes</th>
                                            <th className="p-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medications.map((med, idx) => (
                                            <tr key={med.id} className="border-b">
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="Drug name"
                                                        value={med.drugName}
                                                        onChange={(e) => updateMedication(idx, "drugName", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="e.g. 500mg"
                                                        value={med.dosage}
                                                        onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Select
                                                        value={med.frequency}
                                                        onValueChange={(v) => updateMedication(idx, "frequency", v)}
                                                    >
                                                        <SelectTrigger className="w-[140px]">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="OD">OD (Once daily)</SelectItem>
                                                            <SelectItem value="BD">BD (Twice daily)</SelectItem>
                                                            <SelectItem value="TDS">TDS (Thrice daily)</SelectItem>
                                                            <SelectItem value="QID">QID (Four times)</SelectItem>
                                                            <SelectItem value="SOS">SOS (As needed)</SelectItem>
                                                            <SelectItem value="STAT">STAT (Immediately)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="e.g. 5 days"
                                                        value={med.duration}
                                                        onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="Instructions"
                                                        value={med.notes}
                                                        onChange={(e) => updateMedication(idx, "notes", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeMedication(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <Button variant="outline" size="sm" className="gap-2" onClick={addMedication}>
                            <Plus className="h-4 w-4" /> Add Medication
                        </Button>
                    </CardContent>
                </Card>

                {/* ─── SECTION 5: Lab Tests ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<FlaskConical className="h-5 w-5" />}
                            title="Lab Tests"
                        />

                        {labTests.length > 0 && (
                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-2 font-medium">Test Name</th>
                                            <th className="text-left p-2 font-medium">Priority</th>
                                            <th className="text-left p-2 font-medium">Instructions</th>
                                            <th className="p-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {labTests.map((test, idx) => (
                                            <tr key={test.id} className="border-b">
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="Test name"
                                                        value={test.testName}
                                                        onChange={(e) => updateLabTest(idx, "testName", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Select
                                                        value={test.priority}
                                                        onValueChange={(v) => updateLabTest(idx, "priority", v)}
                                                    >
                                                        <SelectTrigger className="w-[120px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="routine">Routine</SelectItem>
                                                            <SelectItem value="urgent">Urgent</SelectItem>
                                                            <SelectItem value="stat">STAT</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="p-1.5">
                                                    <Input
                                                        placeholder="Special instructions"
                                                        value={test.instructions}
                                                        onChange={(e) => updateLabTest(idx, "instructions", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeLabTest(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <Button variant="outline" size="sm" className="gap-2" onClick={addLabTest}>
                            <Plus className="h-4 w-4" /> Add Lab Test
                        </Button>
                    </CardContent>
                </Card>

                {/* ─── SECTION 6: Treatment Plan ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<ClipboardList className="h-5 w-5" />}
                            title="Treatment Plan"
                        />
                        <Textarea
                            placeholder="Enter treatment plan..."
                            className="min-h-[120px] text-base"
                            value={treatmentPlan}
                            onChange={(e) => setTreatmentPlan(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* ─── SECTION 7: Follow-Up ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<CalendarCheck className="h-5 w-5" />}
                            title="Follow-Up"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Next Visit Date</Label>
                                <DatePicker
                                    date={followUpDate}
                                    setDate={setFollowUpDate}
                                    placeholder="Select follow-up date"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Follow-up Instructions</Label>
                                <Textarea
                                    placeholder="Enter follow-up instructions..."
                                    className="min-h-[80px]"
                                    value={followUpInstructions}
                                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SECTION 8: Additional Notes ─── */}
                <Card>
                    <CardContent className="pt-6">
                        <SectionHeader
                            icon={<FileText className="h-5 w-5" />}
                            title="Additional Notes"
                        />
                        <Textarea
                            placeholder="Any additional notes..."
                            className="min-h-[100px] text-base"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* ─── ACTION BUTTONS ─── */}
                <div className="flex items-center justify-end gap-3 sticky bottom-4 z-20">
                    <Card className="inline-flex p-2 shadow-lg border-primary/20">
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "Saving..." : "Save Encounter"}
                            </Button>
                            <Button
                                className="gap-2"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                            >
                                <Printer className="h-4 w-4" />
                                {saving ? "Saving..." : "Save & Print Record"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
