import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, IndianRupee } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { toast } from "sonner";

interface AddPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface PurchaseItem {
    id: string; // temporary UI id
    medicineId: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    purchasePrice: string;
    salePrice: string;
    mrp: string;
    gst: string;
    stockQuantity: string;
}

export function AddPurchaseDialog({ open, onOpenChange, onSuccess }: AddPurchaseDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [medicines, setMedicines] = useState<any[]>([]);

    const [distributorName, setDistributorName] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

    const [items, setItems] = useState<PurchaseItem[]>([]);

    useEffect(() => {
        if (open) {
            fetchMedicines();
            // Reset form
            setDistributorName("");
            setInvoiceNumber("");
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            setItems([]);
            addNewItem(); // Start with one empty row
        }
    }, [open]);

    const fetchMedicines = async () => {
        try {
            const res: any = await pharmacyService.getMedicines({ limit: 1000 });
            if (res?.items) {
                setMedicines(res.items);
            } else if (Array.isArray(res)) {
                setMedicines(res);
            }
        } catch (error) {
            console.error("Failed to fetch medicines", error);
            toast.error("Failed to load medicines for selection");
        }
    };

    const addNewItem = () => {
        setItems(prevItems => [
            ...prevItems,
            {
                id: Math.random().toString(36).substring(7),
                medicineId: "",
                batchNumber: "",
                manufacturingDate: "",
                expiryDate: "",
                purchasePrice: "",
                salePrice: "",
                mrp: "",
                gst: "0",
                stockQuantity: "1"
            }
        ]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof PurchaseItem, value: string) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.stockQuantity) || 0;
            const price = parseFloat(item.purchasePrice) || 0;
            return sum + (qty * price);
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!distributorName || !invoiceNumber) {
            toast.error("Distributor name and invoice number are required");
            return;
        }

        if (items.length === 0) {
            toast.error("Please add at least one item to the purchase");
            return;
        }

        // Validate items
        const formattedItems = [];
        for (const item of items) {
            if (!item.medicineId || !item.batchNumber || !item.expiryDate || !item.purchasePrice || !item.salePrice || !item.stockQuantity) {
                toast.error("Please fill all required fields for every item (Medicine, Batch, Expiry, Prices, Qty)");
                return;
            }

            formattedItems.push({
                medicineId: item.medicineId,
                batchNumber: item.batchNumber,
                manufacturingDate: item.manufacturingDate || undefined,
                expiryDate: item.expiryDate,
                purchasePrice: parseFloat(item.purchasePrice),
                salePrice: parseFloat(item.salePrice),
                mrp: item.mrp ? parseFloat(item.mrp) : undefined,
                gst: parseFloat(item.gst || "0"),
                stockQuantity: parseInt(item.stockQuantity, 10)
            });
        }

        try {
            setIsLoading(true);
            await pharmacyService.createPurchase({
                distributorName,
                invoiceNumber,
                purchaseDate,
                items: formattedItems
            });

            toast.success("Purchase and inventory recorded successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to create purchase:", error);
            const message = error.response?.data?.message || "Failed to create purchase";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Record New Distributor Purchase</DialogTitle>
                    <DialogDescription>
                        Create a new purchase invoice and automatically update your inventory stock.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div className="space-y-2">
                            <Label>Distributor Name <span className="text-red-500">*</span></Label>
                            <Input 
                                value={distributorName} 
                                onChange={(e) => setDistributorName(e.target.value)} 
                                placeholder="e.g. Apollo Pharmacy"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice Number <span className="text-red-500">*</span></Label>
                            <Input 
                                value={invoiceNumber} 
                                onChange={(e) => setInvoiceNumber(e.target.value)} 
                                placeholder="INV-2026-..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Purchase Date <span className="text-red-500">*</span></Label>
                            <Input 
                                type="date"
                                value={purchaseDate} 
                                onChange={(e) => setPurchaseDate(e.target.value)} 
                                required
                            />
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Purchase Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Row
                            </Button>
                        </div>
                        
                        <div className="border rounded-lg overflow-x-auto">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[200px]">Medicine *</TableHead>
                                        <TableHead className="w-[120px]">Batch No *</TableHead>
                                        <TableHead className="w-[130px]">Expiry *</TableHead>
                                        <TableHead className="w-[100px]">Qty *</TableHead>
                                        <TableHead className="w-[110px]">Pur. Price *</TableHead>
                                        <TableHead className="w-[110px]">Sale Price *</TableHead>
                                        <TableHead className="w-[110px]">MRP</TableHead>
                                        <TableHead className="w-[110px]">Total</TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
                                        const total = (parseFloat(item.stockQuantity) || 0) * (parseFloat(item.purchasePrice) || 0);
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="p-2">
                                                    <Select value={item.medicineId} onValueChange={(val) => updateItem(item.id, "medicineId", val)}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {medicines.map(m => (
                                                                <SelectItem key={m.id} value={m.id}>
                                                                    {m.name} {m.genericName ? `(${m.genericName})` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input value={item.batchNumber} onChange={(e) => updateItem(item.id, "batchNumber", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="date" value={item.expiryDate} onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" min="1" value={item.stockQuantity} onChange={(e) => updateItem(item.id, "stockQuantity", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" step="0.01" min="0" value={item.purchasePrice} onChange={(e) => updateItem(item.id, "purchasePrice", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" step="0.01" min="0" value={item.salePrice} onChange={(e) => updateItem(item.id, "salePrice", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input type="number" step="0.01" min="0" value={item.mrp} onChange={(e) => updateItem(item.id, "mrp", e.target.value)} />
                                                </TableCell>
                                                <TableCell className="p-2 font-medium">
                                                    ₹{total.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Total Purchase Amount</p>
                            <p className="text-xs text-purple-500 mt-1">This amount will be added to pending payments</p>
                        </div>
                        <div className="text-2xl font-bold text-purple-700 flex items-center">
                            <IndianRupee className="h-6 w-6 mr-1" />
                            {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Purchase & Stock
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
