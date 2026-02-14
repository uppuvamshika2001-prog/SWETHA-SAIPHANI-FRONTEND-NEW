import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Search, Edit, Trash2, Plus, CheckCircle } from "lucide-react";
import { useState } from "react";
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

// Mock catalog data
const INITIAL_TEST_CATALOG = [
    { id: 1, name: "Complete Blood Count (CBC)", code: "HEM001", department: "Hematology", price: 500, turnaround: "24 hrs" },
    { id: 2, name: "Lipid Profile", code: "BIO001", department: "Biochemistry", price: 800, turnaround: "24 hrs" },
    { id: 3, name: "Thyroid Function Test (TFT)", code: "BIO002", department: "Biochemistry", price: 1200, turnaround: "48 hrs" },
    { id: 4, name: "Urinalysis Routine", code: "CLI001", department: "Clinical Pathology", price: 150, turnaround: "4 hrs" },
    { id: 5, name: "Liver Function Test (LFT)", code: "BIO003", department: "Biochemistry", price: 900, turnaround: "24 hrs" },
    { id: 6, name: "Blood Culture", code: "MIC001", department: "Microbiology", price: 1500, turnaround: "72 hrs" },
    { id: 7, name: "HbA1c", code: "BIO004", department: "Biochemistry", price: 600, turnaround: "4 hrs" },
    { id: 8, name: "Serum Electrolytes", code: "BIO005", department: "Biochemistry", price: 450, turnaround: "4 hrs" },
];

const LabTestCatalog = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [testCatalog, setTestCatalog] = useState(INITIAL_TEST_CATALOG);
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

    const filteredTests = testCatalog.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddTest = () => {
        if (!newTest.name || !newTest.code || !newTest.department || !newTest.price) {
            toast.error("Missing Fields", {
                description: "Please fill in all required fields",
            });
            return;
        }

        const newTestEntry = {
            id: Date.now(),
            name: newTest.name,
            code: newTest.code,
            department: newTest.department,
            price: parseInt(newTest.price),
            turnaround: newTest.turnaround || "24 hrs"
        };

        setTestCatalog([...testCatalog, newTestEntry]);
        setNewTest({ name: "", code: "", department: "", price: "", turnaround: "" });
        setIsAddDialogOpen(false);
        toast.success("Test Added", {
            description: `${newTest.name} has been added to the catalog`,
        });
    };

    const handleEditTest = (test: any) => {
        setEditingTest({ ...test });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingTest) return;

        setTestCatalog(testCatalog.map(t =>
            t.id === editingTest.id ? editingTest : t
        ));
        setIsEditDialogOpen(false);
        toast.success("Test Updated", {
            description: `${editingTest.name} has been updated`,
        });
    };

    const handleDeleteTest = (test: any) => {
        setTestCatalog(testCatalog.filter(t => t.id !== test.id));
        toast.success("Test Deleted", {
            description: `${test.name} has been removed from the catalog`,
        });
    };

    return (
        <DashboardLayout role="lab_technician">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Test Catalog</h1>
                        <p className="text-muted-foreground mt-1">Directory of available laboratory tests</p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Test
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Test</DialogTitle>
                                <DialogDescription>Add a new test to the laboratory catalog</DialogDescription>
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

                <Card className="shadow-sm">
                    <CardHeader className="p-0"></CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Test Code</TableHead>
                                    <TableHead>Test Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Turnaround</TableHead>
                                    <TableHead className="text-right">Price (₹)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell className="font-mono text-xs">{test.code}</TableCell>
                                        <TableCell className="font-medium">{test.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal">{test.department}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{test.turnaround}</TableCell>
                                        <TableCell className="text-right font-medium">{test.price}</TableCell>
                                        <TableCell className="text-right">
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
                                ))}
                                {filteredTests.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                            <DialogTitle>Edit Test</DialogTitle>
                            <DialogDescription>Update test details</DialogDescription>
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
                                            onChange={(e) => setEditingTest({ ...editingTest, price: parseInt(e.target.value) })}
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

export default LabTestCatalog;

