import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { AddMedicineDialog } from "@/components/pharmacy/AddMedicineDialog";
import { EditMedicineDialog } from "@/components/pharmacy/EditMedicineDialog";
import { EditStockDialog } from "@/components/pharmacy/EditStockDialog";
import { MedicineDetailsDialog } from "@/components/pharmacy/MedicineDetailsDialog";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";
import { AddPurchaseDialog } from "@/components/pharmacy/AddPurchaseDialog";
import { Medicine } from "@/types";
import { normalizeResponse } from "@/utils/api-helpers";

const PharmacyInventory = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [medicineList, setMedicineList] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const data = await pharmacyService.getMedicines({ allBatches: true, limit: 100 });
            console.log("API Response (Medicines):", data);
            const items = normalizeResponse(data);
            setMedicineList(items);
        } catch (error) {
            console.error("Failed to fetch medicines", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    const filteredMedicines = medicineList.filter(med => {
    // 1. Safe extraction of names
    const name = med?.name?.toLowerCase() || '';
    const generic = (med?.generic_name || med?.genericName || '').toLowerCase();

    // 2. FIXED: Safe Category Handling for the search
    // This handles if category is null, a string, or an object
    const medCategory = (med?.category && typeof med.category === 'object')
        ? (med.category.name?.toLowerCase() || '')
        : (typeof med?.category === 'string' ? med.category.toLowerCase() : '');

    const search = searchTerm.toLowerCase();

    // 3. Search logic
    const matchesSearch =
        name.includes(search) ||
        generic.includes(search) ||
        medCategory.includes(search);

    // 4. Status logic
    const matchesFilter = filterStatus ? med?.status === filterStatus : true;

    return matchesSearch && matchesFilter;
});

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    const paginatedMedicines = filteredMedicines.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

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

    const handleDeleteMedicine = async (id: string) => {
        try {
            await pharmacyService.deleteMedicine(id);
            // Remove all rows that belong to this medicine
            setMedicineList(prev => prev.filter(med => 
                med.id !== id && (med as any).medicineId !== id
            ));
            toast.success("Medicine deleted successfully");
        } catch (error) {
            console.error("Failed to delete medicine", error);
            toast.error("Failed to delete medicine");
        }
    };

    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [editingBatch, setEditingBatch] = useState<any | null>(null);
    const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);
    const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);

    const handleEditMedicine = (medicine: Medicine) => {
        // Find the medicine ID if it's a batch-wise row
        const medId = (medicine as any).medicineId || medicine.id;
        setEditingMedicine({ ...medicine, id: medId });
    };

    const handleViewMedicine = (medicine: Medicine) => {
        setViewingMedicine(medicine);
    };

    const handleEditBatch = (batch: any) => {
        setEditingBatch(batch);
    };

    const handleEditSuccess = () => {
        setEditingMedicine(null);
        fetchMedicines();
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
                    <div className="flex gap-2">
                        <AddMedicineDialog onAdd={handleAddMedicine} />
                        <Button onClick={() => setIsAddPurchaseOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                             <Plus className="mr-2 h-4 w-4" />
                             Add Stock (Invoice)
                        </Button>
                    </div>
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
                                        <TableHead>Distributor</TableHead>
                                        <TableHead>Available Stock</TableHead>
                                        <TableHead>Available Pack</TableHead>
                                        <TableHead>Stock Status</TableHead>
                                        <TableHead>Expiry Status</TableHead>
                                        <TableHead className="text-right">M.R.P</TableHead>
                                        <TableHead className="text-right">Total Value</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedMedicines.map((med) => {
                                        const genericName = med.generic_name || med.genericName || '-';
                                        const batchNumber = med.batch?.batch_number || med.batch_number || '-';
                                        const distributor = med.batch?.distributor || med.distributor || med.distributor_name || '-';
                                        const stockQty = med.stock_quantity ?? 0;
                                        const availableStock = (med.pack_quantity && med.pack_quantity > 0) 
                                            ? stockQty / med.pack_quantity 
                                            : stockQty;
                                        const sellingPrice = med.unit_price ?? med.selling_price ?? 0;
                                        const mrp = med.mrp;
                                        console.log("Rendering medicine:", med.mrp);
                                        const expiryDate = med.batch?.expiry_date || med.expiry_date;
                                        const status = med.status || 'in_stock';

                                        const getStockBadge = (status: string) => {
                                            switch (status) {
                                                case 'out_of_stock': return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">OUT OF STOCK</Badge>;
                                                case 'low_stock': return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">LOW STOCK</Badge>;
                                                default: return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">IN STOCK</Badge>;
                                            }
                                        };

                                        const getExpiryBadge = (expiry: any) => {
                                            if (!expiry) return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">-</Badge>;
                                            
                                            const now = new Date();
                                            const expiryDate = new Date(expiry);
                                            
                                            if (expiryDate < now) {
                                                return <Badge variant="outline" className="bg-slate-800 text-slate-100 border-slate-900">⚫ Expired</Badge>;
                                            }
                                            
                                            const daysToExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                            if (daysToExpiry <= 30) {
                                                return <Badge variant="outline" className="bg-red-1 text-red-800 border-red-500">Expiring Soon</Badge>;
                                            }
                                            if (daysToExpiry <= 90) {       
                                                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-500">Expiring</Badge>;
                                            }
                                            
                                            return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-500">Valid</Badge>;
                                        };

                                        let rowClassName = "transition-colors";
                                        if (expiryDate) {
                                            const now = new Date();
                                            const expDate = new Date(expiryDate);
                                            const daysToExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                            if (daysToExpiry <= 30 && expDate >= now) {
                                                rowClassName = "bg-red-50 hover:bg-red-100/80 transition-colors";
                                            } else if (daysToExpiry <= 90 && expDate >= now) {
                                                rowClassName = "bg-yellow-50 hover:bg-yellow-100/80 transition-colors";
                                            } else if (expDate < now) {
                                                rowClassName = "bg-slate-100 hover:bg-slate-200/80 transition-colors opacity-75"; 
                                            }
                                        }

                                        return (
                                            <TableRow key={med.id} className={rowClassName}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{med.name}</span>
                                                        <span className="text-xs text-muted-foreground">{genericName}</span>
                                                    </div>
                                                </TableCell>
                                              <TableCell>
                                                {/* FIXED: Defensive check against null category */}
                                                {(med?.category && typeof med.category === 'object') 
                                                    ? (med.category.name as string) || '-'
                                                    : (typeof med?.category === 'string' ? med.category : '-')}
                                            </TableCell>
                                                <TableCell className="font-mono text-xs">{batchNumber}</TableCell>
                                                <TableCell className="text-xs">{distributor}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-purple-700">{stockQty}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{med.unit || 'units'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-medium text-purple-700">
                                                            {Math.floor(stockQty / (med.pack_quantity || 1))} Strip{Math.floor(stockQty / (med.pack_quantity || 1)) !== 1 ? 's' : ''}
                                                        </span>
                                                        {stockQty % (med.pack_quantity || 1) > 0 && (
                                                            <span className="text-[10px] text-muted-foreground italic">
                                                                + {stockQty % (med.pack_quantity || 1)} Unit{stockQty % (med.pack_quantity || 1) !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStockBadge(status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {getExpiryBadge(expiryDate)}
                                                        <span className="text-[10px] text-muted-foreground font-medium pl-1">
                                                            {expiryDate ? new Date(expiryDate).toLocaleDateString() : '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                 <TableCell className="text-right font-medium">{formatCurrency(mrp)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency((mrp || 0) * stockQty)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleViewMedicine(med)}
                                                            className="h-8 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleEditMedicine(med)}
                                                            className="h-8 px-2 text-xs border-slate-200 hover:bg-slate-50"
                                                        >
                                                            Edit Info
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            onClick={() => handleEditBatch(med)}
                                                            className="h-8 px-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                        >
                                                            Edit Stock
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleDeleteMedicine((med as any).medicineId || med.id)}
                                                            className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                        
                        {/* Pagination */}
                        {!loading && filteredMedicines.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredMedicines.length)} of {filteredMedicines.length} medicines
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {getPageNumbers().map((page, idx) => (
                                        typeof page === 'number' ? (
                                            <Button
                                                key={idx}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(page)}
                                                className={`h-8 w-8 p-0 ${
                                                    currentPage === page
                                                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                                        : 'hover:bg-slate-100'
                                                }`}
                                            >
                                                {page}
                                            </Button>
                                        ) : (
                                            <span key={idx} className="px-1 text-muted-foreground">…</span>
                                        )
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <EditMedicineDialog 
                    open={!!editingMedicine} 
                    onOpenChange={(open) => !open && setEditingMedicine(null)}
                    medicine={editingMedicine}
                    onSuccess={handleEditSuccess}
                />

                <EditStockDialog 
                    open={!!editingBatch} 
                    onOpenChange={(open) => !open && setEditingBatch(null)} 
                    batch={editingBatch}
                    onSuccess={handleEditSuccess}
                />

                <MedicineDetailsDialog 
                    open={!!viewingMedicine} 
                    onOpenChange={(open) => !open && setViewingMedicine(null)}
                    medicine={viewingMedicine}
                />

                <AddPurchaseDialog
                    open={isAddPurchaseOpen}
                    onOpenChange={setIsAddPurchaseOpen}
                    onSuccess={fetchMedicines}
                />
            </div>
        </DashboardLayout>
    );
};

export default PharmacyInventory;

