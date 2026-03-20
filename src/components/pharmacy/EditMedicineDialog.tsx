import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/services/api";

export function EditMedicineDialog({ 
    open, 
    onOpenChange, 
    medicine, 
    onSuccess 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    medicine: any; 
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (medicine && open) {
            setFormData({
                name: medicine.name || "",
                genericName: medicine.generic_name || medicine.genericName || "",
                category: medicine.category || "",
                manufacturer: medicine.manufacturer || "",
                unit: medicine.unit || "tablet",
                reorderLevel: medicine.min_stock_level || medicine.reorderLevel || 10,
                isActive: medicine.status !== 'out_of_stock'
            });
        }
    }, [medicine, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // Convert types
            const payload = {
                ...formData,
                reorderLevel: parseInt(formData.reorderLevel) || 10
            };

            await api.put(`/pharmacy/medicines/${medicine.id}`, payload);
            
            toast.success("Medicine updated successfully");
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to update medicine", error);
            const message = error.response?.data?.message || "Failed to update medicine details";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!medicine) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Medicine Info</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Brand Name *</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="genericName">Generic Name</Label>
                            <Input id="genericName" name="genericName" value={formData.genericName} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select 
                                value={formData.category} 
                                onValueChange={(v) => setFormData((prev: any) => ({ ...prev, category: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                                    <SelectItem value="Painkillers">Painkillers</SelectItem>
                                    <SelectItem value="Vitamins">Vitamins</SelectItem>
                                    <SelectItem value="Syrup">Syrup</SelectItem>
                                    <SelectItem value="Injection">Injection</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manufacturer">Manufacturer</Label>
                            <Input id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select 
                                value={formData.unit} 
                                onValueChange={(v) => setFormData((prev: any) => ({ ...prev, unit: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tablet">Tablet</SelectItem>
                                    <SelectItem value="capsule">Capsule</SelectItem>
                                    <SelectItem value="bottle">Bottle</SelectItem>
                                    <SelectItem value="injection">Injection</SelectItem>
                                    <SelectItem value="tube">Tube</SelectItem>
                                    <SelectItem value="piece">Piece</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reorderLevel">Min. Stock Level</Label>
                            <Input id="reorderLevel" name="reorderLevel" type="number" min="0" value={formData.reorderLevel} onChange={handleChange} />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
