import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, Filter, AlertTriangle, Pill, CheckCircle2, Trash2, 
    ChevronLeft, ChevronRight, Truck, FileText, IndianRupee, 
    Eye, Loader2, ArrowUpRight, ArrowDownRight, AlertCircle, Calendar 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/format";
import { pharmacyService } from "@/services/pharmacyService";
import { Medicine } from "@/types";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { normalizeResponse } from "@/utils/api-helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPharmacy = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [medicineList, setMedicineList] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Purchase History State
    const [purchases, setPurchases] = useState<any[]>([]);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchasePage, setPurchasePage] = useState(1);
    const [report, setReport] = useState<any>(null);
    const [purchaseSearch, setPurchaseSearch] = useState("");

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const data = await pharmacyService.getMedicines({ allBatches: true, limit: 100 });
            const items = normalizeResponse(data);
            setMedicineList(items || []);
        } catch (error) {
            console.error("Failed to fetch pharmacy stock:", error);
            toast.error("Failed to load pharmacy stock.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            setPurchaseLoading(true);
            const [purchasesRes, reportRes] = await Promise.all([
                pharmacyService.getPurchases({ limit: 100 }),
                pharmacyService.getDistributorReport()
            ]);
            
            if (purchasesRes && purchasesRes.items) {
                setPurchases(purchasesRes.items);
            }
            if (reportRes) {
                setReport(reportRes);
            }
        } catch (error) {
            console.error("Failed to fetch purchase history:", error);
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleDeleteMedicine = async (id: string) => {
        if (!id) {
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
        const name = med?.name?.toLowerCase() || '';
        const generic = med?.generic_name?.toLowerCase() || '';
        
        // Safe Category Extraction for Filter
        const medCategory = (med?.category && typeof med.category === 'object')
            ? (med.category.name?.toLowerCase() || '')
            : (typeof med?.category === 'string' ? med.category.toLowerCase() : '');

        const search = searchTerm.toLowerCase();

        const matchesSearch =
            name.includes(search) ||
            generic.includes(search) ||
            medCategory.includes(search);

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

    // Purchase Filtering & Pagination
    const filteredPurchases = purchases.filter(p => 
        p.invoice_number?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.distributor_name?.toLowerCase().includes(purchaseSearch.toLowerCase())
    );

    const totalPurchasePages = Math.ceil(filteredPurchases.length / itemsPerPage);
    const paginatedPurchases = filteredPurchases.slice(
        (purchasePage - 1) * itemsPerPage,
        purchasePage * itemsPerPage
    );

    const getPurchasePageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPurchasePages <= 7) {
            for (let i = 1; i <= totalPurchasePages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (purchasePage > 3) pages.push('...');
            for (let i = Math.max(2, purchasePage - 1); i <= Math.min(totalPurchasePages - 1, purchasePage + 1); i++) {
                pages.push(i);
            }
            if (purchasePage < totalPurchasePages - 2) pages.push('...');
            pages.push(totalPurchasePages);
        }
        return pages;
    };

    // Reset purchase page when search changes
    useEffect(() => {
        setPurchasePage(1);
    }, [purchaseSearch]);

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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Pharmacy Portal</h1>
                    <p className="text-muted-foreground mt-1">Financial oversight and inventory monitoring</p>
                </div>

                <Tabs 
                    defaultValue={location?.pathname?.includes('/purchases') ? 'purchases' : 'inventory'} 
                    onValueChange={(val) => navigate(val === 'purchases' ? '/admin/pharmacy/purchases' : '/admin/pharmacy')}
                    className="space-y-6"
                >
                    <TabsList className="bg-slate-100 p-1 w-fit rounded-xl">
                        <TabsTrigger value="inventory" className="px-8 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold">
                            <Pill className="h-4 w-4 mr-2" /> Stock Inventory
                        </TabsTrigger>
                        <TabsTrigger value="purchases" className="px-8 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold">
                            <FileText className="h-4 w-4 mr-2" /> Purchase History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inventory" className="space-y-6">
                        <div className="animate-in fade-in duration-500">
                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card onClick={() => setFilterStatus(filterStatus === 'low_stock' ? null : 'low_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'low_stock' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Low Stock Items</h3>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{lowStockCount}</div></CardContent>
                    </Card>
                    <Card onClick={() => setFilterStatus(filterStatus === 'out_of_stock' ? null : 'out_of_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'out_of_stock' ? 'border-red-500 bg-red-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">Out of Stock</h3>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{outOfStockCount}</div></CardContent>
                    </Card>
                    <Card onClick={() => setFilterStatus(filterStatus === 'in_stock' ? null : 'in_stock')} className={`cursor-pointer transition-colors ${filterStatus === 'in_stock' ? 'border-green-500 bg-green-50' : 'hover:bg-slate-50'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium">In Stock</h3>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent><div className="text-2xl font-bold">{inStockCount}</div></CardContent>
                    </Card>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[350px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search medicines..."
                            className="pl-8 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading stock data...</div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">No medicines found.</div>
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
                                    {paginatedMedicines.map((med) => (
                                        <TableRow key={med?.id || Math.random()}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{med?.name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{med?.generic_name || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {/* FIXED: Defensive check against null category */}
                                                {(med?.category && typeof med.category === 'object') 
                                                    ? (med.category.name as string) || '-'
                                                    : (typeof med?.category === 'string' ? med.category : '-')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{med?.stock_quantity || 0} units</span>
                                                    {med?.stock_quantity <= (med?.min_stock_level || 0) && (
                                                        <span className="text-[10px] text-red-500 font-medium">Low Stock</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(med?.status || 'unknown')}>
                                                    {(med?.status || 'unknown').replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {(() => {
                                                    const expiryDate = med?.batch?.expiry_date || med?.expiry_date;
                                                    if (!expiryDate) return '-';
                                                    const expDate = new Date(expiryDate);
                                                    return expDate.toLocaleDateString();
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right">{formatCurrency(med?.unit_price || 0)}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete {med?.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently remove this medicine from inventory.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteMedicine(med?.id)} className="bg-destructive">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {!loading && filteredMedicines.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-900">{Math.min(filteredMedicines.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
                            <span className="font-semibold text-slate-900">{Math.min(filteredMedicines.length, currentPage * itemsPerPage)}</span> of{" "}
                            <span className="font-semibold text-slate-900">{filteredMedicines.length}</span> entries
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            
                            <div className="flex items-center gap-1 mx-2">
                                {getPageNumbers().map((page, index) => (
                                    typeof page === 'number' ? (
                                        <Button
                                            key={index}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                        >
                                            {page}
                                        </Button>
                                    ) : (
                                        <span key={index} className="px-1 text-slate-400">...</span>
                                    )
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
            {report && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
                    <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Purchase</p>
                                    <h3 className="text-2xl font-bold mt-1">₹{report?.stats?.total_amount?.toLocaleString() ?? 0}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <IndianRupee className="h-5 w-5 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Paid</p>
                                    <h3 className="text-2xl font-bold mt-1">₹{report?.stats?.total_paid?.toLocaleString() ?? 0}</h3>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Balance</p>
                                    <h3 className="text-2xl font-bold mt-1 text-red-600">₹{report?.stats?.total_balance?.toLocaleString() ?? 0}</h3>
                                </div>
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Invoices</p>
                                    <h3 className="text-2xl font-bold mt-1">{report?.stats?.pending_count ?? 0}</h3>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-bold">Purchase Transactions</h3>
                            <p className="text-sm text-muted-foreground">View and monitor all medicine purchase records</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-[300px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoice or distributor..."
                                    className="pl-8 bg-white"
                                    value={purchaseSearch}
                                    onChange={(e) => setPurchaseSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={fetchPurchases}>
                                <Calendar className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-bold">Invoice #</TableHead>
                                <TableHead className="font-bold">Distributor</TableHead>
                                <TableHead className="font-bold">Date</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                                <TableHead className="text-right font-bold">Balance</TableHead>
                                <TableHead className="text-center font-bold">Status</TableHead>
                                <TableHead className="text-center font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchaseLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-sm text-muted-foreground font-medium">Loading purchase records...</p>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedPurchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        No purchase records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPurchases.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell className="font-bold text-slate-900">{purchase.invoice_number}</TableCell>
                                        <TableCell className="font-medium text-slate-700">{purchase.distributor_name}</TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">₹{(purchase.total_amount || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-red-600 font-bold">₹{(purchase.balance_amount || 0).toLocaleString()}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                variant="outline" 
                                                className={
                                                    purchase.payment_status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    purchase.payment_status === 'PARTIALLY_PAID' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }
                                            >
                                                {purchase.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" className="font-bold text-primary hover:text-primary hover:bg-primary/5">
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Purchase Pagination */}
            {!purchaseLoading && filteredPurchases.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{Math.min(filteredPurchases.length, (purchasePage - 1) * itemsPerPage + 1)}</span> to{" "}
                        <span className="font-semibold text-slate-900">{Math.min(filteredPurchases.length, purchasePage * itemsPerPage)}</span> of{" "}
                        <span className="font-semibold text-slate-900">{filteredPurchases.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPurchasePage(prev => Math.max(1, prev - 1))}
                            disabled={purchasePage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {getPurchasePageNumbers().map((page, index) => (
                                typeof page === 'number' ? (
                                    <Button
                                        key={index}
                                        variant={purchasePage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPurchasePage(page)}
                                        className={`h-8 w-8 p-0 ${purchasePage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                    >
                                        {page}
                                    </Button>
                                ) : (
                                    <span key={index} className="px-1 text-slate-400">...</span>
                                )
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPurchasePage(prev => Math.min(totalPurchasePages, prev + 1))}
                            disabled={purchasePage === totalPurchasePages}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </TabsContent>
        </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default AdminPharmacy;