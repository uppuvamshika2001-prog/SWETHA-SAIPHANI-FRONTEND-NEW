import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { staffService } from "@/services/staffService"; // Changed from mockData
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCog, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppRole } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface StaffProps {
    role?: AppRole;
}

export default function Staff({ role = "admin" }: StaffProps) {
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [deletingStaff, setDeletingStaff] = useState<any>(null);
    const [staffCredentials, setStaffCredentials] = useState<{
        email: string;
        temporaryPassword: string;
        passwordResetLink: string;
        staffName: string;
        role: string;
    } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [newStaff, setNewStaff] = useState({
        full_name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active'
    });
    const { toast } = useToast();

    // Fetch Staff Data
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await staffService.getStaff();
                setStaffList(data);
            } catch (error) {
                console.error("Failed to fetch staff:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load staff members."
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, [toast]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updated = await staffService.updateStaff(editingStaff.id, editingStaff);
            setStaffList(prev => prev.map(staff =>
                staff.id === editingStaff.id ? updated : staff
            ));
            setEditingStaff(null);
            toast({
                title: "Staff Updated",
                description: "Staff details have been successfully updated.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: (error as any)?.message || "Failed to update staff member."
            });
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newStaff.phone && newStaff.phone.length !== 10) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Phone number must be exactly 10 digits."
            });
            return;
        }

        try {
            const added = await staffService.createStaff(newStaff);
            setStaffList(prev => [...prev, added]);
            setIsAddOpen(false);

            // Show credentials dialog
            if (added.temporaryPassword || added.passwordResetLink) {
                setStaffCredentials({
                    email: added.email,
                    temporaryPassword: added.temporaryPassword || '',
                    passwordResetLink: added.passwordResetLink || '',
                    staffName: added.full_name,
                    role: added.role
                });
            }

            setNewStaff({
                full_name: '',
                email: '',
                phone: '',
                role: '',
                department: '',
                status: 'active'
            });

            toast({
                title: "Staff Added",
                description: "New staff member has been successfully added. Credentials are ready to share.",
            });
        } catch (error: any) {
            // Check for specific error types
            let errorMessage = "Failed to add staff member.";

            if (error?.message?.includes('409') || error?.message?.includes('Conflict') || error?.message?.includes('already exists')) {
                errorMessage = "This email is already registered. Please use a different email address.";
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast({
                variant: "destructive",
                title: "Error",
                description: typeof error === 'object' ? JSON.stringify(error.message || error) : errorMessage
            });
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
            toast({
                title: "Copied!",
                description: `${field} copied to clipboard.`,
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy to clipboard."
            });
        }
    };

    const handleDelete = async () => {
        if (!deletingStaff) return;

        try {
            await staffService.deleteStaff(deletingStaff.id);
            setStaffList(prev => prev.filter(staff => staff.id !== deletingStaff.id));
            setDeletingStaff(null);
            toast({
                title: "Staff Deleted",
                description: `${deletingStaff.full_name} has been removed from the system.`,
            });
        } catch (error: any) {
            let errorMessage = "Failed to delete staff member.";
            if (error?.message) {
                errorMessage = error.message;
            }
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage
            });
        }
    };

    const columns = [
        { key: "full_name", header: "Name" },
        { key: "role", header: "Role", render: (staff: any) => <Badge variant="outline" className="capitalize">{staff.role.replace('_', ' ')}</Badge> },
        { key: "department", header: "Department" },
        { key: "email", header: "Email" },
        {
            key: "status", header: "Status", render: (staff: any) => (
                <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                    {staff.status}
                </Badge>
            )
        },
        {
            key: "actions",
            header: "Actions",
            render: (staff: any) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingStaff(staff)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingStaff(staff)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return <div className="p-8 text-center">Loading staff data...</div>;
    }

    return (
        <DashboardLayout role={role}>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <UserCog className="h-6 w-6" />
                            Staff Management
                        </h1>
                        <p className="text-muted-foreground">Manage hospital staff members and roles</p>
                    </div>
                    {(role === 'admin' || role === 'receptionist') && (
                        <Button onClick={() => setIsAddOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Staff Directory</CardTitle>
                        <CardDescription>List of all registered staff members</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={staffList}
                            columns={columns}
                            emptyMessage="No staff members found"
                        />
                    </CardContent>
                </Card>

                <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Staff Details</DialogTitle>
                            <DialogDescription>
                                Make changes to the staff member's profile here. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        {editingStaff && (
                            <form onSubmit={handleSave}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={editingStaff.full_name}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="email" className="text-right">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            value={editingStaff.email}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="role" className="text-right">
                                            Role
                                        </Label>
                                        <Select
                                            value={editingStaff.role}
                                            onValueChange={(value) => setEditingStaff({ ...editingStaff, role: value })}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="doctor">Doctor</SelectItem>

                                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                                <SelectItem value="lab_technician">Lab Technician</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="department" className="text-right">
                                            Dept
                                        </Label>
                                        <Input
                                            id="department"
                                            value={editingStaff.department}
                                            onChange={(e) => setEditingStaff({ ...editingStaff, department: e.target.value })}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="status" className="text-right">
                                            Status
                                        </Label>
                                        <Select
                                            value={editingStaff.status}
                                            onValueChange={(value) => setEditingStaff({ ...editingStaff, status: value })}
                                        >
                                            <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save changes</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Staff</DialogTitle>
                            <DialogDescription>
                                Enter the details for the new staff member.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="new-name"
                                        value={newStaff.full_name}
                                        onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-email" className="text-right">
                                        Email
                                    </Label>
                                    <Input
                                        id="new-email"
                                        type="email"
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-phone" className="text-right">
                                        Phone
                                    </Label>
                                    <Input
                                        id="new-phone"
                                        type="tel"
                                        value={newStaff.phone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || (/^\d+$/.test(val) && val.length <= 10)) {
                                                setNewStaff({ ...newStaff, phone: val });
                                            }
                                        }}
                                        className="col-span-3"
                                        placeholder="Used as temporary password"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-role" className="text-right">
                                        Role
                                    </Label>
                                    <Select
                                        value={newStaff.role}
                                        onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="doctor">Doctor</SelectItem>

                                            <SelectItem value="receptionist">Receptionist</SelectItem>
                                            <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                            <SelectItem value="lab_technician">Lab Technician</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-department" className="text-right">
                                        Dept
                                    </Label>
                                    <Input
                                        id="new-department"
                                        value={newStaff.department}
                                        onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="new-status" className="text-right">
                                        Status
                                    </Label>
                                    <Select
                                        value={newStaff.status}
                                        onValueChange={(value) => setNewStaff({ ...newStaff, status: value })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Add Staff</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deletingStaff} onOpenChange={(open) => !open && setDeletingStaff(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Delete Staff Member</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{deletingStaff?.full_name}</strong>?
                                This action cannot be undone and will remove all associated records.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setDeletingStaff(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Staff Credentials Dialog */}
                <Dialog open={!!staffCredentials} onOpenChange={(open) => !open && setStaffCredentials(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500" />
                                Staff Account Created Successfully
                            </DialogTitle>
                            <DialogDescription>
                                Share these login credentials with <strong>{staffCredentials?.staffName}</strong> ({staffCredentials?.role?.replace('_', ' ')}).
                                They can use these to log in to their portal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Username (Email)</p>
                                        <p className="font-mono font-medium">{staffCredentials?.email}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(staffCredentials?.email || '', 'Email')}
                                    >
                                        {copiedField === 'Email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Temporary Password</p>
                                        <p className="font-mono font-medium">{staffCredentials?.temporaryPassword}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(staffCredentials?.temporaryPassword || '', 'Password')}
                                    >
                                        {copiedField === 'Password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            {staffCredentials?.passwordResetLink && (
                                <div className="rounded-lg border p-4">
                                    <p className="text-sm text-muted-foreground mb-2">Password Reset Link</p>
                                    <p className="text-xs font-mono break-all text-blue-600 mb-2">{staffCredentials.passwordResetLink}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(staffCredentials?.passwordResetLink || '', 'Reset Link')}
                                        className="w-full"
                                    >
                                        {copiedField === 'Reset Link' ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                                        Copy Reset Link
                                    </Button>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                An email has been sent to the staff member with these credentials and a link to set their password.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setStaffCredentials(null)}>
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
