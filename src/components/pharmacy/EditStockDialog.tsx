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
                batchNumber: batch.batch_number || batch.batchNumber || "",
                distributorName: batch.distributor || batch.distributorName || "",
                expiryDate: batch.expiry_date || batch.expiryDate ? new Date(batch.expiry_date || batch.expiryDate).toISOString().split('T')[0] : "",
                manufacturingDate: batch.manufacturingDate ? new Date(batch.manufacturingDate).toISOString().split('T')[0] : "",
                purchasePrice: batch.purchase_price || batch.purchasePrice || 0,
                salePrice: batch.unit_price || batch.salePrice || 0,
                mrp: batch.mrp || 0,
                gst: batch.gst || 0,
                stockQuantity: batch.stock_quantity || batch.stockQuantity || 0
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
            
            const payload = {
                ...formData,
                purchasePrice: parseFloat(formData.purchasePrice),
                salePrice: parseFloat(formData.salePrice),
                mrp: parseFloat(formData.mrp),
                gst: parseFloat(formData.gst),
                stockQuantity: parseInt(formData.stockQuantity)
            };

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
                            <Label htmlFor="batchNumber">Batch Number *</Label>
                            <Input id="batchNumber" name="batchNumber" value={formData.batchNumber} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="distributorName">Distributor</Label>
                            <Input id="distributorName" name="distributorName" value={formData.distributorName} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date *</Label>
                            <Input id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                            <Input id="stockQuantity" name="stockQuantity" type="number" min="0" value={formData.stockQuantity} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice">Purchase Price</Label>
                            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" value={formData.purchasePrice} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salePrice">Sale Price *</Label>
                            <Input id="salePrice" name="salePrice" type="number" step="0.01" min="0" value={formData.salePrice} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gst">GST (%)</Label>
                            <Input id="gst" name="gst" type="number" step="0.01" min="0" value={formData.gst} onChange={handleChange} />
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
