import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";

interface AddMedicineDialogProps {
    children?: React.ReactNode;
    onAdd?: (medicine: any) => void;
}

export function AddMedicineDialog({ children, onAdd }: AddMedicineDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        generic_name: "",
        category: "",
        manufacturer: "",
        hsn_code: "",
        distributor_name: "",
        batch_number: "",
        manufacturing_date: "",
        expiry_date: "",
        stock_quantity: "",
        pack_quantity: "",
        free_quantity: "0",
        ptr: "",
        pts: "",
        purchase_price: "",
        mrp: "",
        sale_price: "", // This will be the "Rate" field
        discount: "0",
        gst: "0",
        min_stock_level: "10",
        invoice_number: "",
        purchase_date: new Date().toISOString().split('T')[0],
    });
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await pharmacyService.getCategories();
                setCategories(data || []);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Derived calculations
    const quantity = parseFloat(formData.stock_quantity) || 0;
    const packQuantity = parseFloat(formData.pack_quantity) || 0;
    const rate_val = parseFloat(formData.sale_price) || 0;
    const gstPercent = parseFloat(formData.gst) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const mrpPrice = parseFloat(formData.mrp) || 0;
    const taxableAmount = (mrpPrice * quantity);
    const gstAmount2 = (taxableAmount-discount) * (gstPercent / 100);
    const gstAmount = Math.round((taxableAmount-discount) * (gstPercent / 100) * 100) / 100;
    const totalAmount = Math.round(taxableAmount + gstAmount - discount);

    const profit = formData.sale_price && formData.purchase_price 
        ? parseFloat(formData.sale_price) - parseFloat(formData.purchase_price)
        : 0;

    const handleSubmit = async () => {
        if (!formData.name || !formData.category || !formData.distributor_name || !formData.expiry_date || !formData.purchase_price || !formData.sale_price || !formData.stock_quantity || !formData.pack_quantity || !formData.hsn_code || !formData.ptr || !formData.pts) {
            toast.error("Please fill in all required fields marked with *");
            return;
        }

        const purchasePrice = parseFloat(formData.purchase_price);
        const salePrice = parseFloat(formData.sale_price);

        if (purchasePrice < 0) {
            toast.error("Purchase price cannot be negative");
            return;
        }

        if (salePrice < purchasePrice) {
            toast.warning("Warning: Sale price is lower than purchase price");
        }

        if (new Date(formData.expiry_date) <= new Date()) {
            toast.error("Expiry date must be in the future");
            return;
        }

        try {
            setIsLoading(true);

            const medicinePayload = {
                name: formData.name,
                generic_name: formData.generic_name,
                category_id: formData.category ? parseInt(formData.category) : undefined,
                manufacturer: formData.manufacturer || undefined,
                hsnCode: formData.hsn_code,
                batch_number: formData.batch_number,
                distributor_name: formData.distributor_name,
                manufacturing_date: formData.manufacturing_date ? new Date(formData.manufacturing_date).toISOString() : undefined,
                expiry_date: new Date(formData.expiry_date).toISOString(),
                purchase_price: purchasePrice,
                selling_price: salePrice,
                gst_percent: formData.gst !== "" ? parseFloat(formData.gst) : 0,
                mrp: formData.mrp !== "" ? parseFloat(formData.mrp) : undefined,
                stock_quantity: parseInt(formData.stock_quantity),
                pack_quantity: formData.pack_quantity !== "" ? parseInt(formData.pack_quantity) : 0,
                free_quantity: formData.free_quantity !== "" ? parseInt(formData.free_quantity) : 0,
                ptr: formData.ptr !== "" ? parseFloat(formData.ptr) : 0,
                taxable_amount: taxableAmount,
                gst_amount: gstAmount,
                total_amount: totalAmount,
                reorder_level: formData.min_stock_level !== "" ? parseInt(formData.min_stock_level) : 10,
                invoice_number: formData.invoice_number,
                purchase_date: formData.purchase_date,
                pts: formData.pts !== "" ? parseFloat(formData.pts) : 0,
                overalldiscount:formData.discount !== "" ? parseFloat(formData.discount) : 0,
            };

            await pharmacyService.createMedicine(medicinePayload);

            toast.success("Medicine Batch Added", {
                description: `${formData.name} (Batch: ${formData.batch_number}) has been added`,
            });

            if (onAdd) {
                onAdd(null);
            }

            setFormData({
                name: "",
                generic_name: "",
                category: "",
                manufacturer: "",
                hsn_code: "",
                distributor_name: "",
                batch_number: "",
                manufacturing_date: "",
                expiry_date: "",
                stock_quantity: "",
                pack_quantity: "",
                free_quantity: "0",
                ptr: "",
                pts: "",
                purchase_price: "",
                mrp: "",
                sale_price: "",
                discount: "0",
                gst: "0",
                min_stock_level: "10",
                invoice_number: "",
                purchase_date: new Date().toISOString().split('T')[0],
            });
            setOpen(false);
        } catch (error: any) {
            console.error("Failed to add medicine:", error);
            toast.error("Failed to add medicine", {
                description: error.message || "Please try again",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medicine
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1100px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Medicine Stock</DialogTitle>
                    <DialogDescription>
                        Enter medicine batch details for inventory tracking
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Section 1: Product Details (Row 1-2, 3 columns) */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            🟣 Product Details
                        </h3>
                        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs text-gray-500">Medicine Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Paracetamol 500mg"
                                    className="h-9"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            {/* <div className="space-y-1.5">
                                <Label htmlFor="generic_name" className="text-xs text-gray-500">Generic Name</Label>
                                <Input
                                    id="generic_name"
                                    placeholder="e.g. Acetaminophen"
                                    className="h-9"
                                    value={formData.generic_name}
                                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                                />
                            </div> */}
                            <div className="space-y-1.5">
                                <Label htmlFor="category" className="text-xs text-gray-500">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.length > 0 ? (
                                            categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="Analgesics">Analgesics</SelectItem>
                                                <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                                <SelectItem value="Vitamins">Vitamins</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="manufacturer" className="text-xs text-gray-500">Manufacturer</Label>
                                <Input
                                    id="manufacturer"
                                    placeholder="e.g. Sun Pharma"
                                    className="h-9"
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="distributor_name" className="text-xs text-gray-500">Distributor Name *</Label>
                                <Input
                                    id="distributor_name"
                                    placeholder="e.g. Apollo Distributor"
                                    className="h-9"
                                    value={formData.distributor_name}
                                    onChange={(e) => setFormData({ ...formData, distributor_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="hsn_code" className="text-xs text-gray-500">HSN Code *</Label>
                                <Input
                                    id="hsn_code"
                                    placeholder="e.g. 30049099"
                                    className="h-9"
                                    value={formData.hsn_code}
                                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_number" className="text-xs text-gray-500">Invoice Number</Label>
                                <Input
                                    id="invoice_number"
                                    placeholder="e.g. INV-2024-001"
                                    className="h-9"
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="purchase_date" className="text-xs text-gray-500 font-bold">Purchase Date *</Label>
                                <Input
                                    id="purchase_date"
                                    type="date"
                                    className="h-9 border-purple-200"
                                    value={formData.purchase_date}
                                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Stock Details (Row 3-4, 3 columns) */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            🟢 Stock Details
                        </h3>
                        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="batch_number" className="text-xs text-gray-500">Batch Number *</Label>
                                <Input
                                    id="batch_number"
                                    placeholder="e.g. BN-2024-001"
                                    className="h-9"
                                    value={formData.batch_number}
                                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="manufacturing_date" className="text-xs text-gray-500">Mfg. Date</Label>
                                <Input
                                    id="manufacturing_date"
                                    type="date"
                                    className="h-9"
                                    value={formData.manufacturing_date}
                                    onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="expiry_date" className="text-xs text-gray-500">Expiry Date *</Label>
                                <Input
                                    id="expiry_date"
                                    type="date"
                                    className="h-9 border-red-200 focus-visible:ring-red-500"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="stock_quantity" className="text-xs text-gray-500 font-bold">Stock Quantity *</Label>
                                <Input
                                    id="stock_quantity"
                                    type="number"
                                    className="h-9 text-right font-bold border-green-200"
                                    placeholder="0"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pack_quantity" className="text-xs text-gray-500 border-dashed">Pack</Label>
                                <Input
                                    id="pack_quantity"
                                    type="number"
                                    className="h-9 text-right"
                                    placeholder="0"
                                    value={formData.pack_quantity}
                                    onChange={(e) => setFormData({ ...formData, pack_quantity: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="free_quantity" className="text-xs text-gray-500 border-dashed">Free Quantity</Label>
                                <Input
                                    id="free_quantity"
                                    type="number"
                                    className="h-9 text-right"
                                    placeholder="0"
                                    value={formData.free_quantity}
                                    onChange={(e) => setFormData({ ...formData, free_quantity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="min_stock_level" className="text-xs text-gray-500">Min Stock Level</Label>
                                <Input
                                    id="min_stock_level"
                                    type="number"
                                    className="h-9 text-right"
                                    placeholder="10"
                                    value={formData.min_stock_level}
                                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pricing Details (Row 5-6, 3 columns) */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            🟡 Pricing Details
                        </h3>
                        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="ptr" className="text-xs text-gray-500">PTR (₹) *</Label>
                                <Input
                                    id="ptr"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right"
                                    placeholder="0.00"
                                    value={formData.ptr}
                                    onChange={(e) => setFormData({ ...formData, ptr: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="pts" className="text-xs text-gray-500">PTS (₹) *</Label>
                                <Input
                                    id="pts"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right"
                                    placeholder="0.00"
                                    value={formData.pts}
                                    onChange={(e) => setFormData({ ...formData, pts: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="purchase_price" className="text-xs text-gray-500">Purchase Price (₹) *</Label>
                                <Input
                                    id="purchase_price"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right border-amber-200"
                                    placeholder="0.00"
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="mrp" className="text-xs text-gray-500">MRP (₹)</Label>
                                <Input
                                    id="mrp"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right"
                                    placeholder="0.00"
                                    value={formData.mrp}
                                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="sale_price" className="text-xs text-gray-500 font-bold">Rate (Selling Price) *</Label>
                                    {profit !== 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${profit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            ₹{profit.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="sale_price"
                                    type="number"
                                    step="0.01"
                                    className="h-9 text-right font-bold border-purple-300 bg-purple-50/30"
                                    placeholder="0.00"
                                    value={formData.sale_price}
                                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="discount" className="text-xs text-gray-500">Overall Discount(₹)</Label>
                                <Input
                                    id="discount"
                                    type="number"
                                    step="0.1"
                                    className="h-9 text-right"
                                    placeholder="0"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gst" className="text-xs text-gray-500">GST (%)</Label>
                                <Input
                                    id="gst"
                                    type="number"
                                    step="0.1"
                                    className="h-9 text-right"
                                    placeholder="0"
                                    value={formData.gst}
                                    onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="gst" className="text-xs text-gray-500">GST (₹)</Label>
                                <Input
                                    id="gst"
                                    type="text" // Changed to text to support the formatted string
                                    readOnly    // This makes the field non-editable
                                    className="h-9 text-right bg-gray-50 cursor-not-allowed" // Optional: adds a subtle "locked" look
                                    placeholder="0"
                                    value={gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Calculations (Horizontal Summary Bar) */}
                    <div className="mt-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Calculations</span>
                            <div className="h-4 w-[1px] bg-purple-200 mx-2" />
                        </div>
                        
                        <div className="flex gap-8 overflow-x-auto">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">Taxable Amount</span>
                                <span className="text-sm font-semibold text-gray-700">₹ {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">OverAll Discount</span>
                                <span className="text-sm font-semibold text-gray-700">₹ {discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-tight">GST Amount ({gstPercent}%)</span>
                                <span className="text-sm font-semibold text-blue-600">₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="flex flex-col items-end pr-2 border-r border-purple-200 last:border-0 last:pr-0">
                                <span className="text-[10px] text-purple-600 font-bold uppercase tracking-tight">Total Amount</span>
                                <span className="text-xl font-black text-purple-800 tracking-tight leading-none bg-yellow-100 px-2 py-0.5 rounded">
                                    ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-6 border-t pt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading} className="text-gray-500">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 px-8 font-bold">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Add Medicine Stock"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
