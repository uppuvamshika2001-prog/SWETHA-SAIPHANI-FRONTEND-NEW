import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Stethoscope, Pill, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { patientService } from "@/services/patientService";

const PatientMedicalRecords = () => {
    const [myRecords, setMyRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchData = async () => {
            try {
                const profile = await patientService.getMyProfile();
                console.log("Logged in profile:", profile);
                if (!profile?.id) {
                    console.error("No profile ID found");
                    return;
                }

                const data = await patientService.getPatientMedicalRecords(profile.uhid);
                console.log("Fetched medical records:", data);
                setMyRecords(data);
            } catch (error) {
                console.error("Failed to fetch medical records:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Loading medical records...</div>;
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Medical Records</h1>

                <div className="grid gap-6">
                    {myRecords.map((record) => (
                        <Card key={record.id} className="shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Stethoscope className="h-5 w-5 text-blue-600" />
                                            {record.doctor_name}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(record.date).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">{record.icd_code}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm text-slate-500 uppercase tracking-wider">Diagnosis</h4>
                                    <p className="text-slate-900 dark:text-slate-100">{record.diagnosis}</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Chief Complaint
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{record.chief_complaint}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Treatment Notes
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{record.treatment_notes}</p>
                                    </div>
                                </div>

                                {record.prescriptions && record.prescriptions.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm text-slate-500 uppercase tracking-wider">
                                                <Pill className="h-4 w-4" />
                                                Prescriptions
                                            </h4>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {record.prescriptions.map((script) => (
                                                    <div key={script.id} className="p-3 border rounded-lg hover:border-blue-200 transition-colors">
                                                        <div className="font-medium text-blue-600">{script.medicine_name}</div>
                                                        <div className="text-sm text-slate-500 mt-1">
                                                            {script.dosage} • {script.frequency} • {script.duration}
                                                        </div>
                                                        {script.instructions && (
                                                            <div className="text-xs text-slate-400 mt-1 italic">
                                                                "{script.instructions}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {myRecords.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <p>No medical records found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientMedicalRecords;
