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
import { Badge } from "@/components/ui/badge";
import { Pill, Calendar, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/utils/format";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MedicineDetailsDialogProps {
    children?: React.ReactNode;
    medicine: any;
    onEdit?: (medicine: any) => void;
    onDelete?: (id: string) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function MedicineDetailsDialog({ children, medicine, onEdit, onDelete, open: controlledOpen, onOpenChange }: MedicineDetailsDialogProps) {
    console.log("MedicineDetailsDialog Rendered with medicine:", medicine);
    const [internalOpen, setInternalOpen] = useState(false);
    
    // Use controlled open if provided, otherwise use internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOpen !== undefined ? onOpenChange! : setInternalOpen;

    if (!medicine) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_stock': return 'bg-green-100 text-green-800';
            case 'low_stock': return 'bg-yellow-100 text-yellow-800';
            case 'out_of_stock': return 'bg-red-100 text-red-800';
            case 'expired': return 'bg-gray-100 text-gray-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(medicine.id);
            toast.success("Medicine Deleted", {
                description: `${medicine.name} has been removed from inventory`,
            });
        }
        setOpen(false);
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(medicine);
        }
        toast.info("Edit Mode", {
            description: "Medicine editing is now available",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">Details</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1100px] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-purple-600" />
                        {medicine.name}
                    </DialogTitle>
                    <DialogDescription>
                        {medicine.generic_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant="outline" className={getStatusColor(medicine.status)}>
                            {medicine.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                        <Plus className="h-3 w-3" />🟣 Product Details</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">Category</span>
                            <p className="font-medium">{medicine.category}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">Manufacturer</span>
                            <p className="font-medium">{medicine.manufacturer}</p>
                        </div>
                         <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">Distributor</span>
                            <p className="font-medium">{medicine.batch?.distributor || medicine.distributor || '-'}</p>
                        </div>
                         <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">HSN Code</span>
                            <p className="font-medium">{medicine.hsn_code}</p>
                        </div>
                        
                    </div>
                 </div>
                 <div className="space-y-3">
                                         <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
                                             <Plus className="h-3 w-3" />
                                             🟢 Stock Details
                                         </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" /> Batch Number
                            </span>
                            <p className="font-mono font-medium">{medicine.batch?.batch_number || medicine.batch_number || '-'}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Manufracture Date
                            </span>
                            <p className="font-medium">{medicine.batch?.manufacturing_date || medicine.manufacturing_date ? new Date(medicine.batch?.manufacturing_date || medicine.manufacturing_date).toLocaleDateString() : '-'}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Expiry Date
                            </span>
                            <p className="font-medium">{medicine.batch?.expiry_date || medicine.expiry_date ? new Date(medicine.batch?.expiry_date || medicine.expiry_date).toLocaleDateString() : '-'}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" /> Current Stock
                            </span>
                            <div className="flex flex-col">
                                <p className="font-mono font-medium text-lg text-green-600">{medicine.stock_quantity} Units</p>
                                <p className="text-[10px] text-muted-foreground">
                                    ≈ {Math.floor(medicine.stock_quantity / (medicine.pack_quantity || 1))} Strips, {medicine.stock_quantity % (medicine.pack_quantity || 1)} Units
                                </p>
                            </div>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Plus className="h-3 w-3" /> Free Quantity
                            </span>
                            <p className="font-mono font-medium">{medicine.free_quantity ?? 0}</p>
                        </div>

                        
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Min. Level</span>
                            <p className="font-bold text-lg">{medicine.min_stock_level}</p>
                        </div>
                    </div>


                    <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                            <Plus className="h-3 w-3" />
                            🟡 Pricing Details
                        </h3>  
                    </div>
<div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Unit Price</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.unit_price)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center border border-purple-100">
                            <span className="text-xs text-muted-foreground">Units per Strip</span>
                            <p className="font-bold text-lg text-purple-600">{medicine.pack_quantity || 1}</p>
                        </div>
                    

                    
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">PTR</span>
                            <p className="font-bold text-lg">{formatCurrency(medicine.ptr)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">PTS</span>
                            <p className="font-bold text-lg">{formatCurrency(medicine.pts)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Purchase Price</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.purchase_price)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">MRP</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.mrp)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Selling Price</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.selling_price)}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Overall Discount</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.overalldiscount)}</p>
                        </div><div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">GST %</span>
                            <p className="font-bold text-lg text-purple-600">{medicine.gst_percent}%</p>
                        </div><div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">GST (₹)</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.gst_amount)}</p>
                        </div>
                    </div>
                    </div>
                    {medicine.stock_quantity <= medicine.min_stock_level && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Stock level is below minimum threshold</span>
                        </div>
                    )}
                </div>

                {/*<DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>*/}
            </DialogContent>
        </Dialog>
    );
}
