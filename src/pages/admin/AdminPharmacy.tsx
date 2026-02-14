import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertTriangle, Pill, CheckCircle2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { pharmacyService } from "@/services/pharmacyService";
import { Medicine } from "@/types";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const AdminPharmacy = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [medicineList, setMedicineList] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                setLoading(true);
                const data = await pharmacyService.getMedicines();
                setMedicineList(data || []);
            } catch (error) {
                console.error("Failed to fetch pharmacy stock:", error);
                toast.error("Failed to load pharmacy stock.");
            } finally {
                setLoading(false);
            }
        };

        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const data = await pharmacyService.getMedicines();
            setMedicineList(data || []);
        } catch (error) {
            console.error("Failed to fetch pharmacy stock:", error);
            toast.error("Failed to load pharmacy stock.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMedicine = async (id: string) => {
        console.log('[AdminPharmacy] Attempting to delete medicine with ID:', id);
        if (!id) {
            console.error('[AdminPharmacy] No ID provided for medicine deletion');
            toast.error('Invalid ID for deletion');
            return;
        }
        try {
            await pharmacyService.deleteMedicine(id);
            toast.success("Medicine deleted successfully");
            fetchMedicines();
        } catch (error) {
            console.error("Failed to delete medicine:", error);
        }
    };

    const filteredMedicines = medicineList.filter(med => {
        const name = med.name || '';
        const generic = med.generic_name || '';
        const category = med.category || '';

        const matchesSearch =
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            generic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus ? med.status === filterStatus : true;

        return matchesSearch && matchesFilter;
    });

    const lowStockCount = medicineList.filter(m => m.status === 'low_stock').length;
    const outOfStockCount = medicineList.filter(m => m.status === 'out_of_stock').length;
    const inStockCount = medicineList.filter(m => m.status === 'in_stock').length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_stock': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'low_stock': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'out_of_stock': return 'bg-red-100 text-red-800 hover:bg-red-100';
            case 'expired': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Stock Monitoring</h1>
                        <p className="text-muted-foreground mt-1">Monitor medicine inventory, track shortages, and view stock levels.</p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card onClick={() => setFilterStatus(filterStatus === 'low_stock' ? null : 'low_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'low_stock' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Low Stock Items</h3>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{lowStockCount}</div>
                            <p className="text-xs text-muted-foreground">Medicines needing reorder</p>
                        </CardContent>
                    </Card>
                    <Card onClick={() => setFilterStatus(filterStatus === 'out_of_stock' ? null : 'out_of_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'out_of_stock' ? 'border-red-500 bg-red-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Out of Stock</h3>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{outOfStockCount}</div>
                            <p className="text-xs text-muted-foreground">Critical Shortages</p>
                        </CardContent>
                    </Card>
                    <Card onClick={() => setFilterStatus(filterStatus === 'in_stock' ? null : 'in_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'in_stock' ? 'border-green-500 bg-green-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">In Stock</h3>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inStockCount}</div>
                            <p className="text-xs text-muted-foreground">Healthy Inventory Levels</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search medicines..."
                            className="pl-8 bg-white dark:bg-slate-950"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {filterStatus && (
                        <Button variant="ghost" onClick={() => setFilterStatus(null)}>
                            Clear Filter ({filterStatus.replace('_', ' ')})
                            <Filter className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="p-0"></CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="text-muted-foreground">Loading stock data...</div>
                            </div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <p>No medicines found.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Stock Level</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Expiry</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMedicines.map((med) => (
                                        <TableRow key={med.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{med.name || 'Unknown Medicine'}</span>
                                                    <span className="text-xs text-muted-foreground">{med.generic_name || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{med.category || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">{med.stock_quantity} units</span>
                                                    {med.stock_quantity <= med.min_stock_level && (
                                                        <span className="text-[10px] text-red-500 font-medium">Below Min: {med.min_stock_level}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(med.status || 'unknown')}>
                                                    {(med.status || 'unknown').replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(med.unit_price)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete <strong>{med.name}</strong> from the inventory.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteMedicine(med.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminPharmacy;
