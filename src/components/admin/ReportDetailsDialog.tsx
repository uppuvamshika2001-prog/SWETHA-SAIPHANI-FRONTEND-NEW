import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, Printer, Download, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { appointments, bills, doctors, patients } from "@/data/mockData";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ReportDetailsDialog({ children }: { children: React.ReactNode }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const today = new Date();

    // Metrics calculation
    const todayAppointments = appointments.filter(
        (apt) => format(new Date(apt.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    ).length;

    const activeDoctors = doctors.filter((d) => d.status === 'active').length;
    const newPatients = patients.filter(
        (p) => p.created_at && format(new Date(p.created_at), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    ).length;

    const todayRevenue = bills
        .filter((b) => b.status === 'paid')
        .reduce((sum, b) => sum + b.paid_amount, 0);

    const pendingBillsCount = bills.filter((b) => b.status === 'pending').length;

    // Dept stats
    const departments = Array.from(new Set(doctors.map(d => d.department)));
    const departmentStats = departments.map(dept => {
        const doctorsInDept = doctors.filter(d => d.department === dept && d.status === 'active').length;
        const appointmentsInDept = appointments.filter(
            (apt) => apt.department === dept && format(new Date(apt.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
        ).length;
        return {
            name: dept,
            activeDoctors: doctorsInDept,
            todayAppointments: appointmentsInDept
        };
    });

    const generateReport = async (action: 'download' | 'print') => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Helper: Image to Base64
            const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
                try {
                    const res = await fetch(imageUrl);
                    const blob = await res.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error("Failed to convert image to base64"));
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error("Error loading image:", imageUrl, error);
                    return "";
                }
            };

            // Helper: Load Image
            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            };

            // Images
            try {
                const logoUrl = '/images/new_logo.png';
                const base64Img = await getBase64ImageFromUrl(logoUrl);

                if (base64Img) {
                    // Watermark
                    const wmImg = await loadImage(base64Img);
                    if (wmImg.width > 0) {
                        const wmWidth = 100;
                        const wmHeight = (wmImg.height * wmWidth) / wmImg.width;
                        const wmX = (pageWidth - wmWidth) / 2;
                        const wmY = (doc.internal.pageSize.getHeight() - wmHeight) / 2;

                        try {
                            // @ts-ignore
                            if (doc.GState) {
                                // @ts-ignore
                                const gState = new doc.GState({ opacity: 0.1 });
                                doc.setGState(gState);
                            }
                        } catch (e) { console.warn(e); }

                        doc.addImage(base64Img, 'PNG', wmX, wmY, wmWidth, wmHeight, undefined, 'FAST');

                        try {
                            // @ts-ignore
                            if (doc.GState) {
                                // @ts-ignore
                                const gState = new doc.GState({ opacity: 1.0 });
                                doc.setGState(gState);
                            }
                        } catch (e) { }
                    }

                    // Header Logo
                    const logoImg = await loadImage(base64Img);
                    const logoWidth = 35;
                    const logoHeight = logoImg.height > 0 ? (logoImg.height * logoWidth) / logoImg.width : 35;
                    doc.addImage(base64Img, 'PNG', 14, 8, logoWidth, logoHeight);
                }
            } catch (e) {
                console.error("Error adding images", e);
            }

            // Header Text
            const textX = 55;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 51, 102);
            doc.setFontSize(22);
            doc.text("SWETHA SAIPHANI CLINIC", textX, 18);

            doc.setFontSize(14);
            doc.text("THE BRAIN AND BONE CENTER", textX, 26);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text("NEUROSURGERY | ORTHOROBOTICS | SPORTS INJURIES", textX, 33);
            doc.text("Karimnagar, Telangana | Ph: +91 98765 43210", textX, 39);

            doc.setDrawColor(200);
            doc.line(14, 48, pageWidth - 14, 48);

            // Report Title & Date
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Daily Hospital Report", 15, 58);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Date: ${format(today, "EEEE, MMMM d, yyyy")}`, pageWidth - 15, 58, { align: "right" });

            // Executive Summary
            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.text("Executive Summary", 15, 70);

            const summaryData = [
                ['Appointments', todayAppointments.toString(), 'Revenue', `Rs. ${todayRevenue.toLocaleString()}`],
                ['New Patients', newPatients.toString(), 'Active Doctors', activeDoctors.toString()]
            ];

            autoTable(doc, {
                startY: 75,
                head: [],
                body: summaryData,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
                    2: { fontStyle: 'bold', fillColor: [240, 240, 240] }
                }
            });

            // Operational Highlights
            // @ts-ignore
            let yPos = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Operational Highlights", 15, yPos);

            const highlightsData = [
                ['Pending Bills', pendingBillsCount.toString()],
                ['Critical Patients', '3'],
                ['Pending Lab Reports', '5']
            ];

            autoTable(doc, {
                startY: yPos + 5,
                body: highlightsData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
            });

            // Department Status
            // @ts-ignore
            yPos = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text("Department Status", 15, yPos);

            const deptColumns = ["Department", "Active Doctors", "Today's Appointments", "Status"];
            const deptRows = departmentStats.map(dept => [
                dept.name,
                dept.activeDoctors.toString(),
                dept.todayAppointments.toString(),
                "Active"
            ]);

            autoTable(doc, {
                startY: yPos + 5,
                head: [deptColumns],
                body: deptRows,
                theme: 'striped',
                headStyles: { fillColor: [66, 133, 244] },
                styles: { fontSize: 10 }
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text("Swetha Saiphani Clinic, Karimnagar, Telangana | Ph: +91 98765 43210", pageWidth / 2, doc.internal.pageSize.height - 15, { align: "center" });
                doc.text(`Generated on ${format(today, "PPpp")}`, 15, doc.internal.pageSize.height - 10);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.height - 10, { align: "right" });
            }

            if (action === 'download') {
                doc.save(`Daily_Report_${format(today, "yyyy-MM-dd")}.pdf`);
                toast.success("Report Downloaded Successfully");
            } else {
                doc.autoPrint();
                window.open(doc.output('bloburl'), '_blank');
                toast.success("Report opened for printing");
            }

        } catch (error) {
            console.error("Report generation failed:", error);
            toast.error("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Daily Hospital Report
                    </DialogTitle>
                    <DialogDescription>
                        <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {format(today, "EEEE, MMMM d, yyyy")}
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Executive Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Appointments</p>
                            <p className="text-2xl font-bold">{todayAppointments}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="text-2xl font-bold text-green-600">₹{todayRevenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            <p className="text-sm text-muted-foreground">New Patients</p>
                            <p className="text-2xl font-bold">{newPatients}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Active Doctors</p>
                            <p className="text-2xl font-bold">{activeDoctors}</p>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-2">Operational Highlights</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span>Pending Bills:</span>
                                    <span className="font-medium">{pendingBillsCount}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Critical Patients:</span>
                                    <span className="font-medium">3</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Lab Reports Pending:</span>
                                    <span className="font-medium">5</span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg border-b pb-2">Department Status</h3>
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border p-3">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-muted-foreground border-b">
                                            <th className="pb-2 font-medium">Department</th>
                                            <th className="pb-2 font-medium text-right">Doctors</th>
                                            <th className="pb-2 font-medium text-right">Appts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {departmentStats.filter((_, i) => i < 5).map((d, i) => (
                                            <tr key={i} className="border-b last:border-0 border-slate-100 dark:border-slate-800">
                                                <td className="py-2">{d.name}</td>
                                                <td className="py-2 text-right">{d.activeDoctors}</td>
                                                <td className="py-2 text-right">{d.todayAppointments}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {departmentStats.length > 5 && (
                                    <p className="text-xs text-center mt-2 text-muted-foreground">+ {departmentStats.length - 5} more departments</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="bg-muted/50 p-4 rounded-lg text-xs text-muted-foreground mt-6">
                        <p>Generated by Admin Portal on {format(new Date(), "PPpp")}</p>
                        <p>Confidential Document - For Internal Use Only</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => generateReport('print')}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                        Print
                    </Button>
                    <Button
                        onClick={() => generateReport('download')}
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Download PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
