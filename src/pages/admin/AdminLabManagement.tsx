import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Search, Edit, Trash2, Plus, FlaskConical } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { labService } from "@/services/labService";

const AdminLabManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [testCatalog, setTestCatalog] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<any>(null);
    const [newTest, setNewTest] = useState({
        name: "",
        code: "",
        department: "",
        price: "",
        turnaround: ""
    });

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setIsLoading(true);
            const tests = await labService.getLabTests();
            setTestCatalog(tests || []);
        } catch (error) {
            toast.error("Failed to fetch tests");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTests = (testCatalog || []).filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddTest = async () => {
        if (!newTest.name || !newTest.code || !newTest.department || !newTest.price) {
            toast.error("Missing Fields", {
                description: "Please fill in all required fields",
            });
            return;
        }

        try {
            await labService.createTest({
                ...newTest,
                price: parseFloat(newTest.price),
                turnaround: newTest.turnaround || "24 hrs"
            });
            toast.success("Test Added", {
                description: `${newTest.name} has been added to the catalog`,
            });
            setNewTest({ name: "", code: "", department: "", price: "", turnaround: "" });
            setIsAddDialogOpen(false);
            fetchTests();
        } catch (error: any) {
            toast.error(error.message || "Failed to add test");
            console.error(error);
        }
    };

    const handleEditTest = (test: any) => {
        setEditingTest({ ...test });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTest) return;

        try {
            await labService.updateTest(editingTest.id, {
                ...editingTest,
                price: parseFloat(editingTest.price)
            });
            toast.success("Test Updated", {
                description: `${editingTest.name} has been updated`,
            });
            setIsEditDialogOpen(false);
            fetchTests();
        } catch (error: any) {
            toast.error(error.message || "Failed to update test");
            console.error(error);
        }
    };

    const handleDeleteTest = async (test: any) => {
        if (!confirm(`Are you sure you want to delete ${test.name}?`)) return;

        try {
            await labService.deleteTest(test.id);
            toast.success("Test Deleted", {
                description: `${test.name} has been removed from the catalog`,
            });
            fetchTests();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete test");
            console.error(error);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <FlaskConical className="h-8 w-8 text-primary" />
                            Lab Management
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage available laboratory tests and pricing</p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Test
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Test</DialogTitle>
                                <DialogDescription>Create a new test entry in the laboratory catalog</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Test Name *</Label>
                                    <Input
                                        id="name"
                                        value={newTest.name}
                                        onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                                        placeholder="Complete Blood Count (CBC)"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Test Code *</Label>
                                    <Input
                                        id="code"
                                        value={newTest.code}
                                        onChange={(e) => setNewTest({ ...newTest, code: e.target.value })}
                                        placeholder="HEM002"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="department">Department *</Label>
                                    <Input
                                        id="department"
                                        value={newTest.department}
                                        onChange={(e) => setNewTest({ ...newTest, department: e.target.value })}
                                        placeholder="Hematology"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Price (₹) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={newTest.price}
                                            onChange={(e) => setNewTest({ ...newTest, price: e.target.value })}
                                            placeholder="500"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="turnaround">Turnaround</Label>
                                        <Input
                                            id="turnaround"
                                            value={newTest.turnaround}
                                            onChange={(e) => setNewTest({ ...newTest, turnaround: e.target.value })}
                                            placeholder="24 hrs"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddTest}>Add Test</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search tests, codes, or departments..."
                            className="pl-8 bg-white dark:bg-slate-950"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle className="text-lg">Test Catalog</CardTitle>
                        <CardDescription>Directory of all laboratory services offered by the clinic</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-6">Test Code</TableHead>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Turnaround</TableHead>
                                    <TableHead className="text-right">Price (₹)</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            <Activity className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
                                            Loading catalog...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTests.length > 0 ? (
                                    filteredTests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell className="font-mono text-xs pl-6">{test.code}</TableCell>
                                            <TableCell className="font-medium">{test.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">{test.department}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{test.turnaround}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">₹{test.price}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleEditTest(test)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteTest(test)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                            No tests found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Test Details</DialogTitle>
                            <DialogDescription>Use the form below to update the test information</DialogDescription>
                        </DialogHeader>
                        {editingTest && (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Test Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingTest.name}
                                        onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Test Code</Label>
                                    <Input
                                        id="edit-code"
                                        value={editingTest.code}
                                        onChange={(e) => setEditingTest({ ...editingTest, code: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-department">Department</Label>
                                    <Input
                                        id="edit-department"
                                        value={editingTest.department}
                                        onChange={(e) => setEditingTest({ ...editingTest, department: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-price">Price (₹)</Label>
                                        <Input
                                            id="edit-price"
                                            type="number"
                                            value={editingTest.price}
                                            onChange={(e) => setEditingTest({ ...editingTest, price: e.target.value === "" ? "" : parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-turnaround">Turnaround</Label>
                                        <Input
                                            id="edit-turnaround"
                                            value={editingTest.turnaround}
                                            onChange={(e) => setEditingTest({ ...editingTest, turnaround: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default AdminLabManagement;
