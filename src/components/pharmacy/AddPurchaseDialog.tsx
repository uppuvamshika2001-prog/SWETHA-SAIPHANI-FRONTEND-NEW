import React, { useState, useEffect, useRef } from "react";
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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Plus, Trash2, Loader2, IndianRupee, FileText, X, Upload } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { toast } from "sonner";

interface AddPurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    purchase?: any; // For editing
}

interface PurchaseItem {
    id: string; // temporary UI id
    medicineId: string;
    medicineName?: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    purchasePrice: string;
    salePrice: string;
    mrp: string;
    gst: string;
    stockQuantity: string;
}

export function AddPurchaseDialog({ open, onOpenChange, onSuccess, purchase }: AddPurchaseDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [medicines, setMedicines] = useState<any[]>([]);

    const [distributorName, setDistributorName] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [items, setItems] = useState<PurchaseItem[]>([]);
    const isEdit = !!purchase;

    useEffect(() => {
        if (open) {
            fetchMedicines();
            if (purchase) {
                setDistributorName(purchase.distributorName || "");
                setInvoiceNumber(purchase.invoiceNumber || "");
                setPurchaseDate(purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setSelectedFile(null);
                setFilePreview(purchase.fileUrl || null);
                
                // Map existing items if provided (though we might disable editing them)
                if (purchase.batches) {
                    setItems(purchase.batches.map((b: any) => ({
                        id: b.id,
                        medicineId: b.medicineId || "",
                        medicineName: b.medicineName || "Unknown",
                        batchNumber: b.batchNumber || "",
                        stockQuantity: b.stockQuantity?.toString() || "0",
                        purchasePrice: b.purchasePrice?.toString() || "0",
                        salePrice: b.salePrice?.toString() || "0",
                        mrp: b.mrp?.toString() || "",
                        expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : "",
                        manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate).toISOString().split('T')[0] : "",
                        gst: b.gst?.toString() || "0"
                    })));
                } else {
                    setItems([]);
                }
            } else {
                // Reset form for new purchase
                setDistributorName("");
                setInvoiceNumber("");
                setPurchaseDate(new Date().toISOString().split('T')[0]);
                setSelectedFile(null);
                setFilePreview(null);
                setItems([]);
                addNewItem(); // Start with one empty row
            }
        }
    }, [open, purchase]);

    const fetchMedicines = async () => {
        try {
            const res: any = await pharmacyService.getMedicines({ limit: 50 });
            if (res?.items) {
                setMedicines(res.items);
            } else if (Array.isArray(res)) {
                setMedicines(res);
            }
        } catch (error) {
            console.error("Failed to fetch medicines", error);
            toast.error("Failed to load medicines. Please try searching.");
        }
    };

    const searchMedicines = async (query: string) => {
        if (!query) return medicines;
        try {
            const res: any = await pharmacyService.getMedicines({ search: query, limit: 50 });
            return res?.items || res || [];
        } catch (error) {
            console.error("Search failed", error);
            return [];
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit");
                return;
            }
            setSelectedFile(file);
            setFilePreview(file.name);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const addNewItem = () => {
        setItems(prevItems => [
            ...prevItems,
            {
                id: Math.random().toString(36).substring(7),
                medicineId: "",
                medicineName: "",
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

        const formattedItems = [];
        for (const item of items) {
            if (!item.medicineId || !item.batchNumber || !item.expiryDate || !item.purchasePrice || !item.salePrice || !item.stockQuantity) {
                toast.error("Please fill all required fields for every item");
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
            if (isEdit) {
                await pharmacyService.updatePurchase(purchase.id, {
                    distributorName,
                    invoiceNumber,
                    purchaseDate
                }, selectedFile || undefined);
                toast.success("Purchase updated successfully");
            } else {
                await pharmacyService.createPurchase({
                    distributorName,
                    invoiceNumber,
                    purchaseDate,
                    items: formattedItems
                }, selectedFile || undefined);
                toast.success("Purchase and inventory recorded successfully");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Failed to save purchase:", error);
            const message = error.response?.data?.message || "Failed to save purchase";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Update Distributor Purchase" : "Record New Distributor Purchase"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update purchase details and invoice document." : "Create a new purchase invoice and automatically update your inventory stock."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border">
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
                        <div className="space-y-2">
                            <Label>Invoice Document (Optional)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,image/*"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full text-left justify-start font-normal hover:bg-slate-100 border-dashed"
                                    >
                                        <Upload className="h-4 w-4 mr-2 text-slate-500" />
                                        {selectedFile ? selectedFile.name : (purchase?.fileUrl ? "Change Invoice" : "Upload Invoice")}
                                    </Button>
                                </div>
                                {(selectedFile || purchase?.fileUrl) && (
                                    <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="text-red-500 shrink-0">
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {filePreview && typeof filePreview === 'string' && !selectedFile && !filePreview.startsWith('invoice') && (
                                <p className="text-[10px] text-slate-500 flex items-center mt-1">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Current file: {filePreview.split('/').pop()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label className="text-base font-semibold">Purchase Items {isEdit && <span className="text-xs font-normal text-slate-500 ml-2">(Items cannot be edited after recording)</span>}</Label>
                            {!isEdit && (
                                <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Row
                                </Button>
                            )}
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
                                        {!isEdit && <TableHead className="w-[60px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
                                        const total = (parseFloat(item.stockQuantity) || 0) * (parseFloat(item.purchasePrice) || 0);
                                        return (
                                            <TableRow key={item.id} className={isEdit ? "bg-slate-50/30" : ""}>
                                                <TableCell className="p-2 min-w-[200px]">
                                                    <SearchableSelect
                                                        disabled={isEdit}
                                                        placeholder="Search medicine..."
                                                        value={item.medicineId ? { id: item.medicineId, name: item.medicineName || "Unknown", genericName: "" } : null}
                                                        onSearch={searchMedicines}
                                                        onSelect={(medicine: any) => {
                                                            const newItems = items.map((i) => i.id === item.id ? { ...i, medicineId: medicine.id, medicineName: medicine.name } : i);
                                                            setItems(newItems);
                                                        }}
                                                        getDisplayValue={(medicine: any) => medicine ? `${medicine.name}` : "Search medicine..."}
                                                        renderItem={(medicine: any) => (
                                                            <span>{medicine.name}</span>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} value={item.batchNumber} onChange={(e) => updateItem(item.id, "batchNumber", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="date" value={item.expiryDate} onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="number" min="1" value={item.stockQuantity} onChange={(e) => updateItem(item.id, "stockQuantity", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="number" step="0.01" min="0" value={item.purchasePrice} onChange={(e) => updateItem(item.id, "purchasePrice", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="number" step="0.01" min="0" value={item.salePrice} onChange={(e) => updateItem(item.id, "salePrice", e.target.value)} required />
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="number" step="0.01" min="0" value={item.mrp} onChange={(e) => updateItem(item.id, "mrp", e.target.value)} />
                                                </TableCell>
                                                <TableCell className="p-2 font-medium">
                                                    ₹{total.toFixed(2)}
                                                </TableCell>
                                                {!isEdit && (
                                                    <TableCell className="p-2">
                                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
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
                            <p className="text-xs text-purple-500 mt-1">{isEdit ? "Original purchase amount" : "This amount will be added to pending payments"}</p>
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
                            {isEdit ? "Update Purchase" : "Record Purchase & Stock"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
