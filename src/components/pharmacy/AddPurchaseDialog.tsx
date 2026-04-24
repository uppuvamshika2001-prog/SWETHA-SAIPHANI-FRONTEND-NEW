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
import { set } from "date-fns";

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
    freeQuantity: string;
    packQuantity: number;
}

export function AddPurchaseDialog({ open, onOpenChange, onSuccess, purchase }: AddPurchaseDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [knownDistributors, setKnownDistributors] = useState<string[]>([]);
    const [distributorSuggestions, setDistributorSuggestions] = useState<string[]>([]);

    const [distributorName, setDistributorName] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [overalldiscount, setOverallDiscount] = useState("0.00");
    const [subtotal, setSubtotal] = useState("0.00");
    const [gsttotal, setGstTotal] = useState("0.00");
    const [totalAmount, setTotalAmount] = useState("0.00");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [items, setItems] = useState<PurchaseItem[]>([]);
    const isEdit = !!purchase;
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (open && !hasInitialized) {
            fetchMedicines();
            if (purchase) {
                setDistributorName(purchase.distributorName || "");
                setInvoiceNumber(purchase.invoiceNumber || "");
                setPurchaseDate(purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                setSelectedFile(null);
                setFilePreview(purchase.fileUrl || null);
                
                if (purchase.batches) {
                    setItems(purchase.batches.map((b: any) => ({
                        id: b.id,
                        medicineId: b.medicineId || "",
                        medicineName: b.medicineName || "Unknown",
                        batchNumber: b.batchNumber || "",
                        stockQuantity: b.stockQuantity?.toString() || "0",
                        freeQuantity: b.freeQuantity?.toString() || "0",
                        purchasePrice: b.purchasePrice?.toString() || "0",
                        salePrice: b.salePrice?.toString() || "0",
                        mrp: b.mrp?.toString() || "",
                        expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : "",
                        manufacturingDate: b.manufacturingDate ? new Date(b.manufacturingDate).toISOString().split('T')[0] : "",
                        gst: b.gst?.toString(),

                    })));
                } else {
                    setItems([]);
                }
            } else {
                setDistributorName("");
                setInvoiceNumber("");
                setPurchaseDate(new Date().toISOString().split('T')[0]);
                setSelectedFile(null);
                setFilePreview(null);
                setItems([{
                    id: Math.random().toString(36).substring(7),
                    medicineId: "",
                    medicineName: "",
                    batchNumber: "",
                    manufacturingDate: "",
                    expiryDate: "",
                    purchasePrice: "",
                    salePrice: "",
                    mrp: "",
                    gst: "",
                    stockQuantity: "",
                    freeQuantity: "0",
                    packQuantity: 1
                }]);
            }
            setHasInitialized(true);
        } else if (!open) {
            setHasInitialized(false);
            setItems([]);
        }
    }, [open, purchase]);


    useEffect(() => {
    // 1. Calculate Subtotal
    const newSubtotal = items.reduce((sum, item) => {
        const qty = parseFloat(item.stockQuantity) || 0;
        const price = parseFloat(item.mrp) || 0;
        return sum + (qty * price);
    }, 0);

    // 2. Apply Discount
    const discountValue = parseFloat(overalldiscount) || 0;
    const discountedSubtotal = Math.max(0, newSubtotal - discountValue);

    // 3. Calculate GST (assuming uniform rate from first item)
    const gstPercent = parseFloat(items[0]?.gst) || 0;
    const newGstTotal = discountedSubtotal * (gstPercent / 100);

    // 4. Final Total
    const newTotal = discountedSubtotal + newGstTotal;

    // 5. Update all states once
    setSubtotal(newSubtotal.toFixed(2));
    setGstTotal(newGstTotal.toFixed(2));
    setTotalAmount(newTotal.toFixed(2)); // If you have a state for the final total

}, [items, overalldiscount]); // Only runs when these values change

    const fetchMedicines = async () => {
        try {
            const res: any = await pharmacyService.getMedicines({ limit: 100 });
            const itemsList = res?.items || (Array.isArray(res) ? res : []);
            setMedicines(itemsList);

            // Extract unique distributor names from batch object
            const distributors = itemsList
                .map((item: any) => item.batch?.distributor)
                .filter((name: string | undefined): name is string => !!name);
            
            setKnownDistributors(Array.from(new Set(distributors)));
        } catch (error) {
            console.error("Failed to fetch medicines", error);
            toast.error("Failed to load medicines.");
        }
    };

    // Handle distributor name typing and suggestions
    const handleDistributorChange = (value: string) => {
        setDistributorName(value);
        if (value.length >= 3) {
            const filtered = knownDistributors.filter(d => 
                d.toLowerCase().includes(value.toLowerCase())
            );
            setDistributorSuggestions(filtered);
        } else {
            setDistributorSuggestions([]);
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
                gst: "",
                stockQuantity: "",
                freeQuantity: "0",
                packQuantity: 1
            }
        ]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof PurchaseItem, value: string) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    {/*const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const qty = parseFloat(item.stockQuantity) || 0;
            const price = parseFloat(item.purchasePrice) || 0;
            const gstPercent = parseFloat(item.gst) || 0;
            const itemTotal = (qty * price)-parseFloat(overalldiscount) || 0;
            const itemGst = itemTotal * (gstPercent / 100);
            return sum + (qty * price) + itemGst;
        }, 0);
    };*/}

    const calculateTotal = () => {
    // 1. Calculate the raw subtotal of all items (Qty * Price)
    const subtotal = items.reduce((sum, item) => {
        const qty = parseFloat(item.stockQuantity) || 0;
        const price = parseFloat(item.purchasePrice) || 0;
        return sum + (qty * price);
    }, 0);

    // 2. Subtract the overall discount from the subtotal
    const discountValue = parseFloat(overalldiscount) || 0;
    const discountedSubtotal = Math.max(0, subtotal - discountValue);

    // 3. Calculate GST based on the discounted subtotal
    // Note: This assumes a single GST rate applies to the whole order.
    // If items have different GST rates, you'll need a different approach.
    const gstPercent = parseFloat(items[0]?.gst) || 0; 
    const totalGst = discountedSubtotal * (gstPercent / 100);
   
    // 4. Final Total
    return discountedSubtotal + totalGst;
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

           const qty = parseInt(item.stockQuantity, 10) || 0;
const gstPercent = parseFloat(item.gst) || 0;
const mrpPrice = parseFloat(item.mrp) || 0;
const base = qty * mrpPrice;
const gstAmount = (base * gstPercent) / 100;

formattedItems.push({
    medicine_id: item.medicineId,
    batch_number: item.batchNumber,
    manufacturing_date: item.manufacturingDate || undefined,
    expiry_date: item.expiryDate,
    purchase_price: price,
    selling_price: parseFloat(item.salePrice) || 0,
    mrp: item.mrp ? parseFloat(item.mrp) : undefined,
    gst_percent: gstPercent,
    stock_quantity: qty,
    free_quantity: parseInt(item.freeQuantity, 10) || 0,
    pack_quantity: item.packQuantity || 1,
    gst_amount: gstAmount
});
        }

        try {
            setIsLoading(true);
            if (isEdit) {
                await pharmacyService.updatePurchase(purchase.id, {
                    distributor_name: distributorName,
                    invoice_number: invoiceNumber,
                    purchase_date: purchaseDate,
                    overalldiscount: parseFloat(overalldiscount) || 0,
                }, selectedFile || undefined);
                toast.success("Purchase updated successfully");
            } else {
                await pharmacyService.createPurchase({
                    distributor_name: distributorName,
                    invoice_number: invoiceNumber,
                    purchase_date: purchaseDate,
                    overalldiscount: parseFloat(overalldiscount) || 0,
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
                        <div className="space-y-2 relative">
                            <Label>Distributor Name <span className="text-red-500">*</span></Label>
                            <Input 
                                value={distributorName} 
                                onChange={(e) => handleDistributorChange(e.target.value)} 
                                placeholder="e.g. Apollo Pharmacy"
                                required
                                autoComplete="off"
                            />
                            {distributorSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                    {distributorSuggestions.map((suggestion, index) => (
                                        <div 
                                            key={index}
                                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                                            onClick={() => {
                                                setDistributorName(suggestion);
                                                setDistributorSuggestions([]);
                                            }}
                                        >
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                        <TableHead className="w-[80px]">Free Qty</TableHead>
                                        <TableHead className="w-[110px]">Pur. Price *</TableHead>
                                        <TableHead className="w-[110px]">Sale Price *</TableHead>
                                        <TableHead className="w-[110px]">MRP</TableHead>
                                        <TableHead className="w-[110px]">GST</TableHead>
                                        <TableHead className="w-[110px]">Total</TableHead>
                                        {!isEdit && <TableHead className="w-[60px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => {
                                        const total = (parseFloat(item.stockQuantity) || 0) * (parseFloat(item.mrp) || 0);
                                        return (
                                            <TableRow key={item.id} className={isEdit ? "bg-slate-50/30" : ""}>
                                                <TableCell className="p-2 min-w-[200px]">
                                                    <SearchableSelect
                                                        disabled={isEdit}
                                                        placeholder="Search medicine..."
                                                        value={item.medicineId ? { id: item.medicineId, name: item.medicineName || "Unknown", genericName: "" } : null}
                                                        onSearch={searchMedicines}
                                                        onSelect={(medicine: any) => {
                                                            if (!medicine || !medicine.id) return;
                                                            toast.success(`Selected: ${medicine.name}`);
                                                            setItems(prevItems => prevItems.map((i) => i.id === item.id ? { 
                                                                ...i, 
                                                                medicineId: medicine.id, 
                                                                medicineName: medicine.name || "Unknown",
                                                                packQuantity: medicine.pack_quantity || 1
                                                            } : i));
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
                                                    <Input disabled={isEdit} type="number" min="0" value={item.freeQuantity} onChange={(e) => updateItem(item.id, "freeQuantity", e.target.value)} />
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
                                                <TableCell className="p-2">
                                                    <Input disabled={isEdit} type="number" step="0.01" min="0" value={item.gst} onChange={(e) => updateItem(item.id, "gst", e.target.value)} />
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
                    {/*<div className="space-y-1.5">
                        <div className="space-y-1.5">
                                <Label htmlFor="mrp" className="text-xs text-gray-500">Overall Discount</Label>
                                <Input
                                    id="overalldiscount"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right"
                                    placeholder="0.00"
                                    value={overalldiscount} 
                                    onChange={(e) => setOverallDiscount(e.target.value)} 
                                    
                                />
                            </div>
                      </div> */}

                    {/* Section 4: Calculations (Horizontal Summary Bar) */}
                    <div className="mt-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">Total Purchase Amount(Inc GST)</p>
                            <p className="text-xs text-purple-500 mt-1">{isEdit ? "Original purchase amount" : "This amount will be added to pending payments"}</p>
                        </div>
                        </div>
                        
                        <div className="flex gap-8 overflow-x-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Sub Total Amount</span>
                                <span className="text-sm font-semibold text-gray-700">{subtotal}</span>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">OverAll Discount</span>
                                <div className="p-2">
                                <Input disabled={isEdit} type="number" step="0.01" min="0" value={overalldiscount} onChange={(e) => setOverallDiscount(e.target.value)} />
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">GST Amount</span>
                                <span className="text-sm font-semibold text-gray-700">{gsttotal}</span>
                            </div>
                            
                            <div className="flex flex-col items-end pr-2 border-r border-purple-200 last:border-0 last:pr-0">
                                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-tight">Total Amount</span>
                                <span className="text-xl font-black text-purple-800 tracking-tight leading-none bg-yellow-100 px-2 py-0.5 rounded">
                                 {/*} {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*/}
                                 {totalAmount}
                                </span>
                            </div>
                        </div>
                    </div>


                    {/*<div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Total Purchase Amount(Inc GST)</p>
                            <p className="text-xs text-purple-500 mt-1">{isEdit ? "Original purchase amount" : "This amount will be added to pending payments"}</p>
                        </div>
                        <div className="text-2xl font-bold text-purple-700 flex items-center">
                            <IndianRupee className="h-6 w-6 mr-1" />
                            {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>*/}

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