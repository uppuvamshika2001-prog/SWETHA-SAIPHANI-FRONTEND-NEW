import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Phone } from "lucide-react";
import { appointments, patients } from "@/data/mockData";
import { format, addDays } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface FollowUpDialogProps {
    children?: React.ReactNode;
}

export function FollowUpDialog({ children }: FollowUpDialogProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Mock generating follow-up data from recent appointments
    const followUps = appointments.slice(0, 5).map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        return {
            id: apt.id,
            patientName: apt.patient_name,
            patientId: apt.patient_id,
            phone: patient?.phone || "N/A",
            lastVisit: apt.date,
            followUpDate: format(addDays(new Date(apt.date), 7), 'yyyy-MM-dd'), // Mock 7 days later
            doctorName: apt.doctor_name,
            status: 'pending'
        };
    });

    const filteredFollowUps = followUps.filter(f =>
        f.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Follow-up Visits</DialogTitle>
                    <DialogDescription>
                        View and manage upcoming patient follow-ups.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 relative">
                        <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
                        <Input
                            placeholder="Search by patient name or ID..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Last Visit</TableHead>
                                    <TableHead>Follow-up Due</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFollowUps.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.patientName}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {item.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.lastVisit}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                                    {item.followUpDate}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.doctorName}</TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="outline">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Book
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredFollowUps.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            No follow-ups found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
