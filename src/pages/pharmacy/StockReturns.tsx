import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw, Save, Trash2, AlertTriangle, Loader2, Calendar } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays, isBefore } from "date-fns";

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
    const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [returnType, setReturnType] = useState('CREDIT_NOTE');
    const [processing, setProcessing] = useState(false);
    const [expiringSoon, setExpiringSoon] = useState<any[]>([]);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const data = await pharmacyService.getMedicines();
            setMedicines(data);
            
            // Filter expiring soon (next 60 days)
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
            toast({
                title: "Error",
                description: "Failed to fetch inventory data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBatch = (med: any, batch: any) => {
        const existing = returnItems.find(item => item.batchId === batch.id);
        if (existing) {
            toast({
                title: "Already added",
                description: "This batch is already in the return list.",
            });
            return;
        }

        setReturnItems([...returnItems, {
            medicineId: med.id,
            batchId: batch.id,
            medicineName: med.name,
            batchNumber: batch.batchNumber,
            distributor: batch.distributorName || "Unavailable",
            availableStock: batch.stockQuantity,
            expiryDate: batch.expiryDate,
            returnQty: 1,
            returnReason: isBefore(new Date(batch.expiryDate), addDays(new Date(), 30)) ? "Expired" : "Near Expiry",
            unitPrice: batch.purchasePrice || 0
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

        // Group by distributor
        const distributor = returnItems[0].distributor;
        const allSameDistributor = returnItems.every(item => item.distributor === distributor);

        if (!allSameDistributor) {
            toast({
                title: "Validation Error",
                description: "All items in one return must belong to the same distributor. Please process separate returns.",
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
            fetchMedicines(); // Refresh stock
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

    const filteredMedicines = medicines.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Returns</h1>
                    <p className="text-muted-foreground">Return medicine stock to distributors</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Expiry Tracking Integration */}
                    {expiringSoon.length > 0 && (
                        <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-orange-700 flex items-center text-lg">
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    Nearing Expiry / Expired Items
                                </CardTitle>
                                <CardDescription>Items expiring within 60 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {expiringSoon.slice(0, 5).map(batch => (
                                        <div key={batch.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-100 text-sm">
                                            <div>
                                                <span className="font-medium">{batch.medicineName}</span>
                                                <span className="mx-2 text-muted-foreground">|</span>
                                                <span className="text-xs">Batch: {batch.batchNumber}</span>
                                                <span className="mx-2 text-muted-foreground">|</span>
                                                <span className={cn(
                                                    "text-xs font-semibold",
                                                    isBefore(new Date(batch.expiryDate), new Date()) ? "text-red-600" : "text-orange-600"
                                                )}>
                                                    Exp: {format(new Date(batch.expiryDate), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 text-orange-700 hover:text-orange-800 hover:bg-orange-100"
                                                onClick={() => handleSelectBatch({ id: batch.medicineId, name: batch.medicineName }, batch)}
                                            >
                                                Add to Return
                                            </Button>
                                        </div>
                                    ))}
                                    {expiringSoon.length > 5 && <p className="text-xs text-muted-foreground text-center">+{expiringSoon.length - 5} more items expiring soon</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Search</CardTitle>
                            <CardDescription>Search medicine and select batch for return</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search medicine name or generic..." 
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {searchQuery && (
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted">
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
                                            {filteredMedicines.map(med => (
                                                med.batches?.filter((b: any) => b.isActive && b.stockQuantity > 0).map((batch: any) => (
                                                    <TableRow key={batch.id}>
                                                        <TableCell>
                                                            <div className="font-medium">{med.name}</div>
                                                            <div className="text-[10px] text-muted-foreground">{med.genericName}</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-mono">{batch.batchNumber}</TableCell>
                                                        <TableCell>{batch.stockQuantity}</TableCell>
                                                        <TableCell className="text-xs">{batch.distributorName || "N/A"}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {format(new Date(batch.expiryDate), 'MM/yyyy')}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => handleSelectBatch(med, batch)}
                                                            >
                                                                Select
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ))}
                                            {filteredMedicines.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
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
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                Return List
                                <Badge variant="secondary">{returnItems.length} Items</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {returnItems.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                    <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
                                    <p className="text-sm text-muted-foreground">Search and select items to return</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {returnItems.map(item => (
                                            <div key={item.batchId} className="p-3 border rounded-lg space-y-3 bg-card shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-sm">{item.medicineName}</div>
                                                        <div className="text-[10px] text-muted-foreground">Distributor: {item.distributor}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">Batch: {item.batchNumber}</div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.batchId)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Return Qty (Max: {item.availableStock})</Label>
                                                        <Input 
                                                            type="number" 
                                                            className="h-8 text-xs" 
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
                                                        <Label className="text-[10px]">Reason</Label>
                                                        <Select value={item.returnReason} onValueChange={(val) => updateItem(item.batchId, "returnReason", val)}>
                                                            <SelectTrigger className="h-8 text-xs">
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
                                        <div className="flex justify-between items-center">
                                            <Label className="text-sm">Return Type</Label>
                                            <Select value={returnType} onValueChange={setReturnType}>
                                                <SelectTrigger className="w-[140px] h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RETURN_TYPES.map(t => (
                                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1 bg-muted/50 p-3 rounded-lg">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Items:</span>
                                                <span className="font-medium">{returnItems.length}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>Total Value:</span>
                                                <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button 
                                            className="w-full bg-primary hover:bg-primary/90" 
                                            size="lg"
                                            disabled={processing}
                                            onClick={handleProcessReturn}
                                        >
                                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Process Return
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
