import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/services/api";
import { pharmacyService } from "@/services/pharmacyService";

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

    useEffect(() => {
        if (medicine && open) {
            setFormData({
                name: medicine.name || "",
                generic_name: medicine.generic_name || medicine.genericName || "",
                category_id: medicine.category_id || medicine.categoryId || (typeof medicine.category === 'object' ? medicine.category.id : ""),
                manufacturer: medicine.manufacturer || "",
                unit: medicine.unit || "tablet",
                reorder_level: medicine.min_stock_level || medicine.reorderLevel || 10,
                is_active: medicine.status !== 'out_of_stock'
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
                reorder_level: parseInt(formData.reorder_level) || 10,
                category_id: formData.category_id ? parseInt(formData.category_id) : undefined
            };

            await api.patch(`/pharmacy/medicines/${medicine.id}`, payload);
            
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
                            <Label htmlFor="generic_name">Generic Name</Label>
                            <Input id="generic_name" name="generic_name" value={formData.generic_name} onChange={handleChange} />
                        </div>
                    
                        <div className="space-y-2">
                            <Label htmlFor="category_id">Category</Label>
                            <Select 
                                value={formData.category_id?.toString()} 
                                onValueChange={(v) => setFormData((prev: any) => ({ ...prev, category_id: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.length > 0 ? (
                                        categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="1">Antibiotics</SelectItem>
                                            <SelectItem value="2">Painkillers</SelectItem>
                                            <SelectItem value="3">Vitamins</SelectItem>
                                            <SelectItem value="4">Other</SelectItem>
                                        </>
                                    )}
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
                            <Label htmlFor="reorder_level">Min. Stock Level</Label>
                            <Input id="reorder_level" name="reorder_level" type="number" min="0" value={formData.reorder_level} onChange={handleChange} />
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
