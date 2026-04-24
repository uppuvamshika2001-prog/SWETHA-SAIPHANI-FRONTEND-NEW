import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, Mail, UserCheck, ShieldCheck } from "lucide-react";
import { staffService } from "@/services/staffService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Plus, Building2, LayoutPanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Departments() {
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState("");

    // Initial list of departments
    const defaultDepartments = ["Orthopaedics", "Neurosurgery", "General Physician", "Paediatric Orthopaedics", "Pulmonology", "Oncology", "Paediatric Hemato-Oncology"];
    
    const [allowedDepartments, setAllowedDepartments] = useState<string[]>(() => {
        const saved = localStorage.getItem('hospital_departments');
        return saved ? JSON.parse(saved) : defaultDepartments;
    });

    useEffect(() => {
        localStorage.setItem('hospital_departments', JSON.stringify(allowedDepartments));
    }, [allowedDepartments]);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await staffService.getStaff();
                setStaffList(data);
            } catch (error) {
                console.error("Failed to fetch staff:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []); // Empty dependency array ensures run once on mount

    // Department mapping for staff/doctors that may have different department names
    const getDepartmentMapping = (dept: string): string | null => {
        const deptLower = (dept || "").toLowerCase();
        if (deptLower.includes("oncology") && !deptLower.includes("paediatric")) return "Oncology";
        if (deptLower.includes("pulmonology")) return "Pulmonology";
        if (deptLower.includes("hemato") || deptLower.includes("paediatric hemato")) return "Paediatric Hemato-Oncology";
        if (deptLower.includes("ortho") && !deptLower.includes("paediatric")) return "Orthopaedics";
        if (deptLower.includes("general physician") || deptLower === "general physician") return "General Physician";
        if (deptLower.includes("paediatric ortho") || deptLower.includes("pediatric ortho")) return "Paediatric Orthopaedics";
        if (deptLower.includes("neuro")) return "Neurosurgery";
        
        // Fallback: check for exact match in our list
        const exactMatch = allowedDepartments.find(d => d.toLowerCase() === deptLower);
        if (exactMatch) return exactMatch;
        
        return null;
    };

    const handleAddDepartment = () => {
        if (!newDeptName.trim()) {
            toast.error("Department name is required");
            return;
        }
        if (allowedDepartments.includes(newDeptName.trim())) {
            toast.error("Department already exists");
            return;
        }
        setAllowedDepartments([...allowedDepartments, newDeptName.trim()]);
        setNewDeptName("");
        setIsAddDialogOpen(false);
        toast.success("Department added successfully");
    };

    const departments = allowedDepartments.map((deptName) => {
        // Filter doctors that belong to this department (including similar names)
        const deptDoctors = staffList.filter(s => s.role === 'doctor' && getDepartmentMapping(s.department) === deptName);
        const deptStaff = staffList.filter(s => s.role !== 'doctor' && getDepartmentMapping(s.department) === deptName);
        const totalMembers = staffList.filter(s => getDepartmentMapping(s.department) === deptName);

        // Define a "Head" for the department - picking the most experienced doctor or first staff
        const head = deptDoctors.sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0))[0]?.full_name
            || deptStaff[0]?.full_name
            || "To be assigned";

        return {
            name: deptName,
            head: head,
            count: totalMembers.length,
            doctors: deptDoctors,
            staff: deptStaff
        };
    });

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            <Building2 className="h-8 w-8 text-blue-600" />
                            Departments
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage and view hospital department staff and hierarchy</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl gap-2 h-11 px-6">
                                <Plus className="h-5 w-5" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Department</DialogTitle>
                                <DialogDescription>
                                    Create a new department category for hospital staff.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-semibold ml-1">Department Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Cardiology, Radiology..."
                                        value={newDeptName}
                                        onChange={(e) => setNewDeptName(e.target.value)}
                                        className="h-12 rounded-xl focus:ring-blue-500 border-slate-200"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-2">
                                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button 
                                    onClick={handleAddDepartment}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-sm"
                                >
                                    Save Department
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <Dialog key={dept.name}>
                            <DialogTrigger asChild>
                                <Card className="hover:shadow-lg transition-all cursor-pointer border-transparent hover:border-blue-200 dark:hover:border-blue-900 group">
                                    <CardHeader>
                                        <CardTitle className="group-hover:text-blue-600 transition-colors">{dept.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                            Head: {dept.head}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex -space-x-2">
                                                {[...Array(Math.min(3, dept.count))].map((_, i) => (
                                                    <div key={i} className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center">
                                                        <Users className="h-3 w-3" />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="ml-2 font-medium">{dept.count} Members Total</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[85vh]">
                                <DialogHeader>
                                    <DialogTitle>{dept.name} Department</DialogTitle>
                                    <DialogDescription>
                                        Detailed list of doctors and staff members in this department
                                    </DialogDescription>
                                </DialogHeader>

                                <ScrollArea className="mt-4 max-h-[60vh] pr-4">
                                    <div className="space-y-6">
                                        {/* Doctors List */}
                                        {dept.doctors.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                    <UserCheck className="h-4 w-4" /> Doctors
                                                </h3>
                                                <div className="space-y-3">
                                                    {dept.doctors.map((doc) => (
                                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-colors">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{doc.full_name}</span>
                                                                <span className="text-xs text-muted-foreground">{doc.specialization}</span>
                                                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                                                                    <Mail className="h-3 w-3" /> {doc.email}
                                                                </div>
                                                            </div>
                                                            <Badge variant={doc.status === 'active' ? 'default' : 'secondary'} className="capitalize border-none bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                {doc.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}



                                        {dept.doctors.length === 0 && (
                                            <div className="text-center py-10 text-muted-foreground">
                                                No staff members found in this department.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
