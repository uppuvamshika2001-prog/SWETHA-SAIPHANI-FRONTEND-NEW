import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";

const PharmacyCategories = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await pharmacyService.getCategories();
            setCategories(data || []);
        } catch (error) {
            console.error("Failed to fetch categories", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            setSubmitting(true);
            await pharmacyService.createCategory(newCategory.trim());
            setNewCategory("");
            fetchCategories();
            toast.success("Category added successfully");
        } catch (error: any) {
            console.error("Failed to add category", error);
            const message = error.response?.data?.message || "Failed to add category";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            await pharmacyService.deleteCategory(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
            toast.success("Category deleted successfully");
        } catch (error) {
            console.error("Failed to delete category", error);
            toast.error("Failed to delete category");
        }
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Category Master</h1>
                    <p className="text-muted-foreground mt-1">Manage medicine categories dynamically</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Plus className="h-5 w-5 text-purple-600" />
                                Add New Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <Input
                                    placeholder="Enter category name (e.g. Antibiotics)"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="bg-white dark:bg-slate-950"
                                    disabled={submitting}
                                />
                                <Button 
                                    type="submit" 
                                    disabled={submitting || !newCategory.trim()}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {submitting ? "Adding..." : "Add"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Tag className="h-5 w-5 text-purple-600" />
                                Existing Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading...</div>
                            ) : categories.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">No categories found.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category Name</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">{cat.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyCategories;
