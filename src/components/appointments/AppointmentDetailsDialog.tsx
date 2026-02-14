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
            <DialogContent className="sm:max-w-[425px]">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : appointment ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Appointment Details</DialogTitle>
                            <DialogDescription>
                                Reference ID: {appointment.appointment_id}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <StatusBadge status={appointment.status} />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                                    <User className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Patient</p>
                                        <p className="text-sm text-muted-foreground">{appointment.patient_name}</p>
                                        <p className="text-xs text-muted-foreground">ID: {appointment.patient_id}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                                    <Stethoscope className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Doctor</p>
                                        <p className="text-sm text-muted-foreground">{appointment.doctor_name}</p>
                                        <p className="text-xs text-muted-foreground">{appointment.department}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Date & Time</p>
                                        <p className="text-sm text-muted-foreground">{appointment.date}</p>
                                        <p className="text-sm text-muted-foreground">{appointment.time}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="py-10 text-center text-muted-foreground">
                        <p>Failed to load appointment details.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
