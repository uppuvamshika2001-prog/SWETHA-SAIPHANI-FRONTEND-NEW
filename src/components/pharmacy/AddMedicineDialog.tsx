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
import { useState } from "react";
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
        distributor_name: "",
        batch_number: "",
        manufacturing_date: "",
        expiry_date: "",
        purchase_price: "",
        sale_price: "",
        gst: "0",
        mrp: "",
        stock_quantity: "",
        min_stock_level: "10",
        invoice_number: "",
        amount_paid: "0",
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: "Cash",
    });

    const totalAmount = (parseFloat(formData.stock_quantity) || 0) * (parseFloat(formData.purchase_price) || 0);
    const amountPaid = parseFloat(formData.amount_paid) || 0;
    const balanceAmount = totalAmount - amountPaid;
    
    let paymentStatus = 'Pending';
    if (amountPaid >= totalAmount && totalAmount > 0) paymentStatus = 'Paid';
    else if (amountPaid > 0) paymentStatus = 'Partially Paid';

    const profit = formData.sale_price && formData.purchase_price 
        ? parseFloat(formData.sale_price) - parseFloat(formData.purchase_price)
        : 0;

    const handleSubmit = async () => {
        if (!formData.name || !formData.generic_name || !formData.category || !formData.distributor_name || !formData.expiry_date || !formData.purchase_price || !formData.sale_price || !formData.stock_quantity) {
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
                genericName: formData.generic_name,
                category: formData.category,
                manufacturer: formData.manufacturer || undefined,
                distributorName: formData.distributor_name,
                batchNumber: formData.batch_number,
                manufacturingDate: formData.manufacturing_date || undefined,
                expiryDate: formData.expiry_date,
                purchasePrice: purchasePrice,
                salePrice: salePrice,
                gst: parseFloat(formData.gst) || 0,
                mrp: parseFloat(formData.mrp) || undefined,
                stockQuantity: parseInt(formData.stock_quantity),
                reorderLevel: parseInt(formData.min_stock_level) || 10,
                invoiceNumber: formData.invoice_number,
                amountPaid: parseFloat(formData.amount_paid) || 0,
                paymentDate: formData.payment_date,
                paymentMethod: formData.payment_method,
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
                distributor_name: "",
                batch_number: "",
                manufacturing_date: "",
                expiry_date: "",
                purchase_price: "",
                sale_price: "",
                gst: "0",
                mrp: "",
                stock_quantity: "",
                min_stock_level: "10",
                invoice_number: "",
                amount_paid: "0",
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: "Cash",
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
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Medicine Stock</DialogTitle>
                    <DialogDescription>
                        Enter medicine batch details for inventory tracking
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Row 1: Medicine Name | Generic Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Medicine Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Paracetamol 500mg"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="generic_name">Generic Name *</Label>
                            <Input
                                id="generic_name"
                                placeholder="e.g. Acetaminophen"
                                value={formData.generic_name}
                                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 2: Category | Manufacturer */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Analgesics">Analgesics</SelectItem>
                                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                    <SelectItem value="Antacids">Antacids</SelectItem>
                                    <SelectItem value="Antipyretics">Antipyretics</SelectItem>
                                    <SelectItem value="Cardiac">Cardiac</SelectItem>
                                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                                    <SelectItem value="Vitamins">Vitamins</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input
                                id="manufacturer"
                                placeholder="e.g. Sun Pharma"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 3: Distributor Name | Batch Number */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="distributor_name">Distributor Name *</Label>
                            <Input
                                id="distributor_name"
                                placeholder="e.g. Apollo Distributor"
                                value={formData.distributor_name}
                                onChange={(e) => setFormData({ ...formData, distributor_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch_number">Batch Number *</Label>
                            <Input
                                id="batch_number"
                                placeholder="e.g. BN-2024-001"
                                value={formData.batch_number}
                                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 4: Manufacturing Date | Expiry Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
                            <Input
                                id="manufacturing_date"
                                type="date"
                                value={formData.manufacturing_date}
                                onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date *</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 5: Purchase Price | Sale Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price (₹) *</Label>
                            <Input
                                id="purchase_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.purchase_price}
                                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="sale_price">Sale Price (₹) *</Label>
                                {profit !== 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${profit > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Profit: ₹{profit.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <Input
                                id="sale_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 6: GST | MRP */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gst">GST (%)</Label>
                            <Input
                                id="gst"
                                type="number"
                                step="0.1"
                                placeholder="0"
                                value={formData.gst}
                                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mrp">MRP (Optional)</Label>
                            <Input
                                id="mrp"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.mrp}
                                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 7: Stock Quantity | Min Stock Level */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                            <Input
                                id="stock_quantity"
                                type="number"
                                placeholder="0"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_stock_level">Min. Stock Level *</Label>
                            <Input
                                id="min_stock_level"
                                type="number"
                                placeholder="10"
                                value={formData.min_stock_level}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="text-sm font-semibold mb-3 text-purple-700">Payment Information</h3>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_number">Invoice Number</Label>
                                    <Input
                                        id="invoice_number"
                                        placeholder="e.g. INV-9901"
                                        value={formData.invoice_number}
                                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount_paid">Amount Paid (₹)</Label>
                                    <Input
                                        id="amount_paid"
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.amount_paid}
                                        onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">Payment Date</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Select
                                        value={formData.payment_method}
                                        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 grid grid-cols-3 gap-4 text-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Total Amount</span>
                                    <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Balance</span>
                                    <span className={`font-bold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₹{balanceAmount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase">Status</span>
                                    <span className={`font-bold ${
                                        paymentStatus === 'Paid' ? 'text-green-600' : 
                                        paymentStatus === 'Partially Paid' ? 'text-yellow-600' : 
                                        'text-red-500'
                                    }`}>
                                        {paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding Stock...
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
