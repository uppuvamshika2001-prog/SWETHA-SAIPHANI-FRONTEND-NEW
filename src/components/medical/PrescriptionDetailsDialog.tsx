import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prescription } from "@/contexts/PrescriptionContext";
import { format } from "date-fns";
import { User, Calendar, Stethoscope, Pill } from "lucide-react";

interface PrescriptionDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    prescription: Prescription | null;
}

export function PrescriptionDetailsDialog({
    open,
    onOpenChange,
    prescription,
}: PrescriptionDetailsDialogProps) {
    if (!prescription) return null;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "dispensed":
                return "bg-green-100 text-green-800 hover:bg-green-100";
            case "cancelled":
                return "bg-red-100 text-red-800 hover:bg-red-100";
            default:
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-xl">Prescription Details</DialogTitle>
                        <Badge className={getStatusColor(prescription.status)}>
                            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh] pr-4">
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" /> Patient
                                </div>
                                <div className="font-medium">{prescription.patient_name}</div>
                                <div className="text-xs text-muted-foreground">ID: {prescription.patient_id}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" /> Date
                                </div>
                                <div className="font-medium">
                                    {format(new Date(prescription.created_at), "PPP")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Ref: {prescription.order_id}
                                </div>
                            </div>

                            <div className="space-y-1 col-span-2 md:col-span-2 border-t pt-2 mt-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Stethoscope className="h-4 w-4" /> Consultant
                                </div>
                                <div className="font-medium">
                                    {prescription.doctor_name || "Dr. Swetha Saiphani"}
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold">
                                <Stethoscope className="h-4 w-4 text-blue-600" />
                                Diagnosis
                            </div>
                            <div className="p-3 border rounded-md text-sm">
                                {prescription.diagnosis}
                            </div>
                        </div>

                        <Separator />

                        {/* Medicines */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 font-semibold">
                                <Pill className="h-4 w-4 text-purple-600" />
                                Prescribed Medicines
                            </div>

                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Dosage</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Instructions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {prescription.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{item.medicine_name}</TableCell>
                                                <TableCell>{item.dosage}</TableCell>
                                                <TableCell>{item.frequency}</TableCell>
                                                <TableCell>{item.duration}</TableCell>
                                                <TableCell>{item.instructions || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
