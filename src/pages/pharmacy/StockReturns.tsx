import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw, Save, Trash2, AlertTriangle, Loader2, Calendar, Filter, Truck } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays, isBefore } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

const RETURN_REASONS = [
    "Expired",
    "Damaged",
    "Wrong Supply",
    "Excess Stock",
    "Near Expiry",
    "Product Recall"
];

const RETURN_TYPES = [
    { value: "CREDIT_NOTE", label: "Credit Note" },
    { value: "REPLACEMENT", label: "Replacement" },
    { value: "REFUND", label: "Direct Refund" }
];

export default function StockReturns() {
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [returnType, setReturnType] = useState('CREDIT_NOTE');
    const [processing, setProcessing] = useState(false);
    const [expiringSoon, setExpiringSoon] = useState<any[]>([]);

    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        distributor: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchExpiringSoon();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await pharmacyService.getStockReturns(historyFilters);
            setHistory(data.items || []);
        } catch (error) {
            console.error("Failed to fetch stock return history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchExpiringSoon = async () => {
        try {
            const data = await pharmacyService.getMedicines({ limit: 100 });
            const soon = [];
            const sixtyDays = addDays(new Date(), 60);
            
            for (const med of data) {
                if (med.batches) {
                    for (const batch of med.batches) {
                        if (batch.isActive && batch.stockQuantity > 0 && isBefore(new Date(batch.expiryDate), sixtyDays)) {
                            soon.push({ ...batch, medicineName: med.name, medicineId: med.id });
                        }
                    }
                }
            }
            setExpiringSoon(soon);
        } catch (error) {
            console.error("Failed to fetch inventory data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setMedicines([]);
            return;
        }

        setSearching(true);
        const delayDebounceOptions = setTimeout(async () => {
            try {
                const url = `${import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000'}/api/pharmacy/medicines?search=${encodeURIComponent(searchQuery)}&format=returns&limit=50`;
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
                });
                setMedicines(response.data.items || []);
            } catch (err) {
                console.error("Search API failed:", err);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceOptions);
    }, [searchQuery]);

    const handleSelectBatch = (med: any, flatBatch?: any) => {
        const item = flatBatch ? {
            id: med.id,
            name: med.name,
            batchNumber: flatBatch.batchNumber,
            distributor: flatBatch.distributorName,
            stock: flatBatch.stockQuantity,
            expiry: flatBatch.expiryDate,
            purchasePrice: flatBatch.purchasePrice || 0
        } : {
            id: med.id,
            name: med.name,
            batchNumber: med.batch,
            distributor: med.distributor,
            stock: med.stock,
            expiry: med.expiry,
            purchasePrice: med.purchasePrice || 0
        };

        const existing = returnItems.find(ri => ri.batchNumber === item.batchNumber && ri.medicineId === item.id);
        if (existing) {
            toast({
                title: "Already added",
                description: "This batch is already in the return list.",
            });
            return;
        }

        setReturnItems([...returnItems, {
            medicineId: item.id,
            batchId: `${item.id}-${item.batchNumber}`,
            medicineName: item.name,
            batchNumber: item.batchNumber,
            distributor: item.distributor || "Unavailable",
            availableStock: item.stock,
            expiryDate: item.expiry,
            returnQty: 1,
            returnReason: isBefore(new Date(item.expiry), addDays(new Date(), 30)) ? "Expired" : "Near Expiry",
            unitPrice: item.purchasePrice || 0
        }]);
    };

    const updateItem = (id: string, field: string, value: any) => {
        setReturnItems(items => items.map(item => 
            item.batchId === id ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (id: string) => {
        setReturnItems(items => items.filter(item => item.batchId !== id));
    };

    const calculateTotal = () => {
        return returnItems.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);
    };

    const handleProcessReturn = async () => {
        if (returnItems.length === 0) return;

        const distributor = returnItems[0].distributor;
        const allSameDistributor = returnItems.every(item => item.distributor === distributor);

        if (!allSameDistributor) {
            toast({
                title: "Validation Error",
                description: "All items in one return must belong to the same distributor.",
                variant: "destructive"
            });
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                distributor,
                returnType,
                items: returnItems.map(item => ({
                    medicineId: item.medicineId,
                    batchNumber: item.batchNumber,
                    returnQty: item.returnQty,
                    returnReason: item.returnReason,
                    unitPrice: item.unitPrice
                }))
            };

            await pharmacyService.processStockReturn(payload);

            toast({
                title: "Stock Return Processed",
                description: `Successfully returned items to ${distributor}. Total value: ₹${calculateTotal().toFixed(2)}`,
            });

            setReturnItems([]);
            setMedicines([]);
            fetchHistory(); // Refresh history
        } catch (error: any) {
            toast({
                title: "Return Failed",
                description: error.response?.data?.message || "Failed to process stock return.",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Returns</h1>
                    <p className="text-muted-foreground">Return medicine stock to distributors</p>
                </div>
            </div>

            <Tabs defaultValue="return" className="space-y-6">
                <TabsList className="bg-muted p-1 rounded-lg">
                    <TabsTrigger value="return" className="px-6 py-2 rounded-md transition-all duration-200">
                        Process Return
                    </TabsTrigger>
                    <TabsTrigger value="history" className="px-6 py-2 rounded-md transition-all duration-200" onClick={fetchHistory}>
                        Return History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="return" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="lg:col-span-2 space-y-6">
                            {expiringSoon.length > 0 && (
                                <Card className="border-orange-200 bg-orange-50/30 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-orange-700 flex items-center text-lg font-bold">
                                            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                                            Nearing Expiry / Expired Items
                                        </CardTitle>
                                        <CardDescription>Recommended for return to distributor</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {expiringSoon.slice(0, 5).map(batch => (
                                                <div key={batch.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-orange-100 text-sm shadow-sm hover:border-orange-300 transition-colors">
                                                    <div>
                                                        <span className="font-bold text-orange-950">{batch.medicineName}</span>
                                                        <span className="mx-2 text-muted-foreground">|</span>
                                                        <span className="text-xs font-mono">B: {batch.batchNumber}</span>
                                                        <span className="mx-2 text-muted-foreground">|</span>
                                                        <span className={cn(
                                                            "text-xs font-black",
                                                            isBefore(new Date(batch.expiryDate), new Date()) ? "text-red-600" : "text-orange-600"
                                                        )}>
                                                            EXP: {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                                                        </span>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 text-orange-700 hover:text-orange-800 hover:bg-orange-100 font-bold"
                                                        onClick={() => handleSelectBatch({ id: batch.medicineId, name: batch.medicineName }, batch)}
                                                    >
                                                        Add to Return
                                                    </Button>
                                                </div>
                                            ))}
                                            {expiringSoon.length > 5 && <p className="text-xs text-muted-foreground text-center font-medium">+{expiringSoon.length - 5} more items expiring soon</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="shadow-md">
                                <CardHeader className="border-b pb-4">
                                    <CardTitle className="text-xl">Inventory Search</CardTitle>
                                    <CardDescription>Search medicine and select batch for return</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search medicine name or generic..." 
                                            className="pl-10 h-11 border-primary/20"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {searchQuery && (
                                        <div className="border rounded-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow>
                                                        <TableHead>Medicine</TableHead>
                                                        <TableHead>Batch</TableHead>
                                                        <TableHead>Stock</TableHead>
                                                        <TableHead>Distributor</TableHead>
                                                        <TableHead>Expiry</TableHead>
                                                        <TableHead className="text-right">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {searching && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-12">
                                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                                                <p className="mt-2 text-sm text-muted-foreground font-medium">Searching inventory...</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {!searching && medicines.map((item: any, idx) => (
                                                        <TableRow key={`${item.id}-${item.batch}-${idx}`} className="hover:bg-muted/30">
                                                            <TableCell>
                                                                <div className="font-bold">{item.name}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs font-mono">{item.batch}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="font-bold border-primary/20">{item.stock}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{item.distributor || "N/A"}</TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {item.expiry ? format(new Date(item.expiry), 'MM/yyyy') : '-'}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="h-8 px-4"
                                                                    onClick={() => handleSelectBatch(item)}
                                                                >
                                                                    Select
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {!searching && medicines.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                                                                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                                No stock found for "{searchQuery}"
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="sticky top-6 border-primary/20 shadow-xl overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b pb-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-black text-primary">Return List</CardTitle>
                                        <Badge variant="default" className="bg-primary px-3 py-1 font-bold">{returnItems.length} Items</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {returnItems.length === 0 ? (
                                        <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-muted/10 mx-2">
                                            <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-10" />
                                            <p className="text-base font-bold text-muted-foreground">No items selected</p>
                                            <p className="text-xs text-muted-foreground">Search and select items to return</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                                {returnItems.map(item => (
                                                    <div key={item.batchId} className="p-3 border rounded-xl space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow border-primary/10">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-black text-sm text-primary truncate">{item.medicineName}</div>
                                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-bold">
                                                                    <Truck className="h-3 w-3" /> {item.distributor}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Batch: {item.batchNumber}</div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.batchId)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Qty (Max: {item.availableStock})</Label>
                                                                <Input 
                                                                    type="number" 
                                                                    className="h-8 text-xs font-bold border-primary/10" 
                                                                    value={item.returnQty} 
                                                                    onChange={(e) => {
                                                                        let val = parseInt(e.target.value);
                                                                        if (val < 1) val = 1;
                                                                        if (val > item.availableStock) val = item.availableStock;
                                                                        updateItem(item.batchId, "returnQty", val);
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Reason</Label>
                                                                <Select value={item.returnReason} onValueChange={(val) => updateItem(item.batchId, "returnReason", val)}>
                                                                    <SelectTrigger className="h-8 text-[11px] font-medium border-primary/10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {RETURN_REASONS.map(r => (
                                                                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-4 border-t space-y-4">
                                                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg border border-dashed">
                                                    <Label className="text-xs font-bold uppercase text-muted-foreground">Return Type</Label>
                                                    <Select value={returnType} onValueChange={setReturnType}>
                                                        <SelectTrigger className="w-[140px] h-8 text-xs font-black">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {RETURN_TYPES.map(t => (
                                                                <SelectItem key={t.value} value={t.value} className="text-xs font-medium">{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-1 bg-primary p-4 rounded-2xl text-white shadow-lg shadow-primary/20">
                                                    <div className="flex justify-between text-xs opacity-80 font-bold uppercase">
                                                        <span>Processing {returnItems.length} Items:</span>
                                                        <span>1 Distributor</span>
                                                    </div>
                                                    <div className="flex justify-between text-2xl font-black pt-1">
                                                        <span>Total Value</span>
                                                        <span>₹{calculateTotal().toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <Button 
                                                    className="w-full shadow-lg h-14 text-lg font-black bg-slate-900 hover:bg-slate-800 transition-all active:scale-95" 
                                                    size="lg"
                                                    disabled={processing}
                                                    onClick={handleProcessReturn}
                                                >
                                                    {processing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                                    Process Final Return
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Stock Return History</CardTitle>
                            <CardDescription>View and filter past distributor returns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Distributor</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search distributor..." 
                                            className="pl-10 h-10"
                                            value={historyFilters.distributor}
                                            onChange={(e) => setHistoryFilters({...historyFilters, distributor: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input 
                                        type="date" 
                                        className="h-10"
                                        value={historyFilters.startDate}
                                        onChange={(e) => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input 
                                        type="date" 
                                        className="h-10"
                                        value={historyFilters.endDate}
                                        onChange={(e) => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button className="flex-1 h-10 font-bold" onClick={fetchHistory}>
                                        <Filter className="mr-2 h-4 w-4" /> Filter History
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => {
                                        setHistoryFilters({ distributor: '', startDate: '', endDate: '' });
                                        setTimeout(fetchHistory, 0);
                                    }}>
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg overflow-hidden">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/70">
                                    <TableRow>
                                        <TableHead className="font-bold">Return Date</TableHead>
                                        <TableHead className="font-bold">Distributor</TableHead>
                                        <TableHead className="font-bold">Return Type</TableHead>
                                        <TableHead className="font-bold">Total Items</TableHead>
                                        <TableHead className="font-bold">Total Value</TableHead>
                                        <TableHead className="text-right font-bold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16">
                                                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                                                <p className="mt-3 text-base font-bold text-muted-foreground">Fetching return records...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20">
                                                <div className="bg-muted/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <RotateCcw className="h-8 w-8 text-muted-foreground opacity-30" />
                                                </div>
                                                <p className="text-xl font-black text-muted-foreground">No records found</p>
                                                <p className="text-sm text-muted-foreground">Try adjusting your date range or distributor name</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        history.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-primary/5 transition-colors border-b last:border-0">
                                                <TableCell className="font-medium">
                                                    <div className="font-bold">{format(new Date(record.returnDate), 'dd MMM yyyy')}</div>
                                                    <div className="text-[10px] text-muted-foreground">{format(new Date(record.returnDate), 'hh:mm a')}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-black text-slate-800">{record.distributor}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-bold text-[10px] bg-slate-50">
                                                        {record.returnType?.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-black px-3 py-1">
                                                        {record.items?.length || 0} Batches
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-primary font-black text-lg">₹{record.totalAmount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="font-bold" onClick={() => {
                                                        toast({ title: "Details View", description: "Expanded bill details and item distribution history is being generated." });
                                                    }}>
                                                        View Items
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
