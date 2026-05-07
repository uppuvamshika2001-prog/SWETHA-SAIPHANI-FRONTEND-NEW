import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";

export function EditStockDialog({ 
    open, 
    onOpenChange, 
    batch, 
    onSuccess 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    batch: any; 
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (batch && open) {
            setFormData({
                batch_number: batch.batch_number || batch.batchNumber || "",
                distributor_name: batch.distributor || batch.distributorName || "",
                expiry_date: batch.expiry_date || batch.expiryDate ? new Date(batch.expiry_date || batch.expiryDate).toISOString().split('T')[0] : "",
                manufacturing_date: batch.manufacturing_date || batch.manufacturingDate ? new Date(batch.manufacturing_date || batch.manufacturingDate).toISOString().split('T')[0] : "",
                purchase_price: batch.purchase_price || batch.purchasePrice || 0,
                selling_price: batch.unit_price || batch.selling_price || batch.salePrice || 0,
                mrp: batch.mrp || 0,
                gst_percent: batch.gst_percent || batch.gst || 0,
                stock_quantity: (batch.stock_quantity || batch.stockQuantity || 0) / (batch.pack_quantity || batch.packQuantity || 1),
                free_quantity: (batch.free_quantity || batch.freeQuantity || 0) / (batch.pack_quantity || batch.packQuantity || 1)
            });
        }
    }, [batch, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            const payload: any = {
                ...formData,
                expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : undefined,
                manufacturing_date: formData.manufacturing_date ? new Date(formData.manufacturing_date).toISOString() : undefined,
                purchase_price: parseFloat(formData.purchase_price) || 0,
                selling_price: parseFloat(formData.selling_price) || 0,
                mrp: parseFloat(formData.mrp) || 0,
                gst_percent: parseFloat(formData.gst_percent) || 0,
                stock_quantity: (parseInt(formData.stock_quantity) || 0) * (batch.pack_quantity || batch.packQuantity || 1),
                free_quantity: (parseInt(formData.free_quantity) || 0) * (batch.pack_quantity || batch.packQuantity || 1)
            };

            // Clean up empty strings for optional fields to avoid validation issues
            if (!payload.batch_number) delete payload.batch_number;
            if (!payload.distributor_name) delete payload.distributor_name;

            // Use the batch ID (which is batch.id in the new allBatches mode)
            await pharmacyService.updateBatch(batch.id, payload);
            
            toast.success("Stock details updated successfully");
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to update stock", error);
            const message = error.response?.data?.message || "Failed to update stock details";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!batch) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Stock Details: {batch.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch_number">Batch Number *</Label>
                            <Input id="batch_number" name="batch_number" value={formData.batch_number} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distributor_name">Distributor</Label>
                            <Input id="distributor_name" name="distributor_name" value={formData.distributor_name} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date *</Label>
                            <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                            <Input id="stock_quantity" name="stock_quantity" type="number" min="0" value={formData.stock_quantity} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="free_quantity">Free Quantity</Label>
                            <Input id="free_quantity" name="free_quantity" type="number" min="0" value={formData.free_quantity} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_price">Purchase Price</Label>
                            <Input id="purchase_price" name="purchase_price" type="number" step="0.01" min="0" value={formData.purchase_price} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="selling_price">Sale Price *</Label>
                            <Input id="selling_price" name="selling_price" type="number" step="0.01" min="0" value={formData.selling_price} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst_percent">GST (%)</Label>
                            <Input id="gst_percent" name="gst_percent" type="number" step="0.01" min="0" value={formData.gst_percent} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {loading ? "Saving..." : "Update Stock"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
