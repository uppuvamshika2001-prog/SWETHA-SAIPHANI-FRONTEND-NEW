import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { AddMedicineDialog } from "@/components/pharmacy/AddMedicineDialog";
import { MedicineDetailsDialog } from "@/components/pharmacy/MedicineDetailsDialog";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";
import { Medicine } from "@/types";

const PharmacyInventory = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [medicineList, setMedicineList] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const data = await pharmacyService.getMedicines();
            setMedicineList(data || []);
        } catch (error) {
            console.error("Failed to fetch medicines", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const filteredMedicines = medicineList.filter(med => {
        // Handle both snake_case (frontend) and camelCase (backend) field names
        const genericName = med.generic_name || (med as any).genericName || '';
        const category = med.category || '';
        const name = med.name || '';

        const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = !filterStatus || med.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_stock': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'low_stock': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'out_of_stock': return 'bg-red-100 text-red-800 hover:bg-red-100';
            case 'expired': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleAddMedicine = async () => {
        // Re-fetch the complete list from backend after adding
        await fetchMedicines();
    };

    const handleDeleteMedicine = (id: string) => {
        setMedicineList(prev => prev.filter(med => med.id !== id));
    };

    const handleFilterToggle = () => {
        if (!filterStatus) {
            setFilterStatus('low_stock');
            toast.info("Showing Low Stock Items");
        } else if (filterStatus === 'low_stock') {
            setFilterStatus('out_of_stock');
            toast.info("Showing Out of Stock Items");
        } else {
            setFilterStatus(null);
            toast.info("Showing All Items");
        }
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-muted-foreground mt-1">Track medicine stock, expiry dates, and batches</p>
                    </div>
                    <AddMedicineDialog onAdd={handleAddMedicine} />
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search medicines, generic names, categories..."
                            className="pl-8 bg-white dark:bg-slate-950"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant={filterStatus ? "default" : "outline"}
                        size="icon"
                        onClick={handleFilterToggle}
                        className={filterStatus ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                    {filterStatus && (
                        <Badge variant="secondary" className="ml-2">
                            {filterStatus.replace('_', ' ')}
                        </Badge>
                    )}
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="p-0"></CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="text-muted-foreground">Loading inventory...</div>
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
                                        <TableHead>Batch No.</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Expiry</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMedicines.map((med) => {
                                        // Handle both snake_case (frontend type) and camelCase (backend response)
                                        const genericName = med.generic_name || (med as any).genericName || '-';
                                        const batchNumber = med.batch_number || (med as any).batchNumber || '-';
                                        const stockQty = med.stock_quantity ?? (med as any).stockQuantity ?? 0;
                                        const unitPrice = med.unit_price ?? (med as any).pricePerUnit ?? 0;
                                        const expiryDate = med.expiry_date || (med as any).expiryDate;
                                        const status = med.status || 'in_stock';

                                        return (
                                            <TableRow key={med.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{med.name}</span>
                                                        <span className="text-xs text-muted-foreground">{genericName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{med.category || '-'}</TableCell>
                                                <TableCell className="font-mono text-xs">{batchNumber}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{stockQty}</span>
                                                        <span className="text-xs text-muted-foreground">units</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={getStatusColor(status)}>
                                                        {status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {expiryDate ? new Date(expiryDate).toLocaleDateString() : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(unitPrice)}</TableCell>
                                                <TableCell className="text-right">
                                                    <MedicineDetailsDialog
                                                        medicine={med}
                                                        onDelete={handleDeleteMedicine}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyInventory;

