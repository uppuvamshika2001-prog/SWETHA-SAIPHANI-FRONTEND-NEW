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
import { Calendar, Clock, User, Stethoscope, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { appointmentService } from "@/services/appointmentService";
import { Appointment } from "@/types";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AppointmentDetailsDialogProps {
    children?: React.ReactNode;
    appointmentId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AppointmentDetailsDialog({
    children,
    appointmentId,
    open,
    onOpenChange
}: AppointmentDetailsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (showOpen && appointmentId) {
            setLoading(true);
            appointmentService.getAppointmentById(appointmentId)
                .then(setAppointment)
                .catch(err => console.error("Failed to fetch appointment details", err))
                .finally(() => setLoading(false));
        }
    }, [showOpen, appointmentId]);

    // If loading, render dialog with spinner
    // If not loading and no appointment, return null (or maybe show error state inside dialog?)


    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : appointment ? (
                    <div className="flex flex-col">
                        {/* Letterhead Header */}
                        <div className="p-8 border-b-2 border-slate-900/10">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="h-20 w-20 flex-shrink-0 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                                    <span className="text-2xl font-bold text-slate-400">LOGO</span>
                                </div>
                                <div className="flex-1 text-center pr-20">
                                    <h1 className="text-3xl font-black tracking-tight text-[#0056b3] uppercase leading-none">
                                        Swetha SaiPhani Clinic
                                    </h1>
                                    <p className="text-xl font-bold text-[#dc3545] mt-1 italic">
                                        The Brain & Bone Center
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-700 tracking-[0.1em] mt-1 uppercase">
                                        NEUROSURGERY | ORTHOROBOTICS | SPORTS INJURIES
                                    </p>
                                </div>
                            </div>
                            <div className="h-[1.5px] w-full bg-slate-800" />
                        </div>

                        {/* Invoice-style Content */}
                        <div className="p-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                    Appointment Details
                                </h2>
                                <div className="text-right space-y-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Status</p>
                                    <StatusBadge status={appointment.status} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 text-sm">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</p>
                                    <p className="font-mono font-bold text-slate-700">{appointment.appointment_id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</p>
                                    <p className="font-bold text-slate-700">{appointment.date} @ {appointment.time}</p>
                                </div>

                                <div className="space-y-1 col-span-2 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Information</p>
                                    <p className="text-xl font-black text-slate-900">{appointment.patient_name}</p>
                                    <p className="font-bold text-slate-500">UHID: {appointment.patient_id}</p>
                                </div>

                                <div className="space-y-1 col-span-2 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulting Specialist</p>
                                    <p className="text-lg font-black text-slate-800">{appointment.doctor_name}</p>
                                    <p className="font-bold text-slate-500 uppercase tracking-wider">{appointment.department}</p>
                                </div>
                            </div>

                            {/* Terms & Footer */}
                            <div className="pt-12 mt-8 border-t border-slate-200">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Important Note:</p>
                                        <p className="text-[10px] text-slate-500 leading-tight max-w-[300px]">
                                            Please present this slip at the reception counter upon arrival. 
                                            Scheduled times are subject to emergency cases.
                                        </p>
                                    </div>
                                    <div className="text-right space-y-4">
                                        <div className="w-48 h-[1px] bg-slate-300 ml-auto" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Authorized Signatory
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="h-2 w-full bg-slate-900/5" />
                    </div>
                ) : (
                    <div className="py-20 text-center text-muted-foreground">
                        <p>Failed to load appointment details.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
