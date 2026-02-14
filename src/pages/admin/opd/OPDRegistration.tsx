import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search } from "lucide-react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { PatientDetailsDialog } from "@/components/patients/PatientDetailsDialog";
import { usePatients } from "@/contexts/PatientContext";
import { useState } from "react";

export default function OPDRegistration() {
    const { toast } = useToast();
    const { patients, addPatient } = usePatients();
    const recentRegistrations = patients.slice(0, 10);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: '',
        department: ''
    });

    const handleRegister = () => {
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.gender) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields.",
                variant: 'destructive'
            });
            return;
        }

        const newPatient: any = {
            id: Math.random().toString(36).substr(2, 9),
            patient_id: 'P-' + Math.floor(10000 + Math.random() * 90000),
            full_name: `${formData.firstName} ${formData.lastName}`,
            date_of_birth: new Date().toISOString(), // Mock DOB for quick reg
            gender: formData.gender,
            phone: formData.phone,
            created_at: new Date().toISOString(),
            status: 'active',
            department: formData.department
        };

        addPatient(newPatient);

        toast({
            title: "Patient Registered",
            description: "New patient has been successfully registered for OPD.",
        });

        // Reset form
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            gender: '',
            department: ''
        });
    };

    const columns = [
        { key: "patient_id", header: "ID" },
        { key: "full_name", header: "Name" },
        { key: "date_of_birth", header: "Age", render: (p: any) => new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() || 'N/A' },
        { key: "gender", header: "Gender", render: (p: any) => <span className="capitalize">{p.gender}</span> },
        { key: "phone", header: "Phone" },
        { key: "created_at", header: "Reg. Date", render: (p: any) => new Date(p.created_at).toLocaleDateString() },
        { key: "status", header: "Status", render: (p: any) => <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge> },
        {
            key: "actions",
            header: "Actions",
            render: (p: any) => (
                <PatientDetailsDialog patientId={p.id}>
                    <Button variant="ghost" size="sm">View</Button>
                </PatientDetailsDialog>
            )
        }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="h-6 w-6" />
                        OPD Registration
                    </h1>
                    <p className="text-muted-foreground">Register new patients for Outpatient Department</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* New Registration Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>New Registration</CardTitle>
                            <CardDescription>Enter patient details for quick registration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(v) => setFormData({ ...formData, department: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Medicine</SelectItem>
                                        <SelectItem value="ortho">Orthopedics</SelectItem>
                                        <SelectItem value="cardio">Cardiology</SelectItem>
                                        <SelectItem value="derma">Dermatology</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full" onClick={handleRegister}>Register Patient</Button>
                        </CardContent>
                    </Card>

                    {/* Quick Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Lookup</CardTitle>
                            <CardDescription>Search for existing patients</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="Search by Name, ID or Phone" />
                                <Button variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
                                Search results will appear here
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Registrations</CardTitle>
                        <CardDescription>Latest patients registered today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={recentRegistrations}
                            columns={columns}
                            emptyMessage="No registrations found"
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
