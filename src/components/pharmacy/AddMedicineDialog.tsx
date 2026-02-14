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
        batch_number: "",
        expiry_date: "",
        stock_quantity: "",
        min_stock_level: "",
        unit_price: "",
        gst: "",
    });

    const handleSubmit = async () => {
        if (!formData.name || !formData.generic_name || !formData.category) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setIsLoading(true);

            // Map frontend fields to backend API schema
            const medicinePayload = {
                name: formData.name,
                genericName: formData.generic_name,
                manufacturer: formData.manufacturer || undefined,
                category: formData.category,
                pricePerUnit: parseFloat(formData.unit_price) || 0,
                stockQuantity: parseInt(formData.stock_quantity) || 0,
                reorderLevel: parseInt(formData.min_stock_level) || 10,
                expiryDate: formData.expiry_date || undefined,
                batchNumber: formData.batch_number || undefined,
                gst: parseFloat(formData.gst) || 0,
            };

            // Call backend API to persist the medicine
            await pharmacyService.createMedicine(medicinePayload);

            toast.success("Medicine Added", {
                description: `${formData.name} has been added to inventory`,
            });

            // Notify parent to refresh the list
            if (onAdd) {
                onAdd(null); // Signal to refresh from backend
            }

            setFormData({
                name: "",
                generic_name: "",
                category: "",
                manufacturer: "",
                batch_number: "",
                expiry_date: "",
                stock_quantity: "",
                min_stock_level: "",
                unit_price: "",
                gst: "",
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
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Add New Medicine</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new medicine to add to inventory
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch_number">Batch Number</Label>
                            <Input
                                id="batch_number"
                                placeholder="e.g. BN-2024-001"
                                value={formData.batch_number}
                                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">Expiry Date</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stock Quantity</Label>
                            <Input
                                id="stock_quantity"
                                type="number"
                                placeholder="0"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_stock_level">Min. Stock Level</Label>
                            <Input
                                id="min_stock_level"
                                type="number"
                                placeholder="10"
                                value={formData.min_stock_level}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit_price">Unit Price (₹)</Label>
                            <Input
                                id="unit_price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.unit_price}
                                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                            />
                        </div>
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
                                Adding...
                            </>
                        ) : (
                            "Add Medicine"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
