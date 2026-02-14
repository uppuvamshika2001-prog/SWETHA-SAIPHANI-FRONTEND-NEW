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
import { toast } from "sonner";

interface MedicineDetailsDialogProps {
    children?: React.ReactNode;
    medicine: any;
    onEdit?: (medicine: any) => void;
    onDelete?: (id: string) => void;
}

export function MedicineDetailsDialog({ children, medicine, onEdit, onDelete }: MedicineDetailsDialogProps) {
    const [open, setOpen] = useState(false);

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">Details</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">Category</span>
                            <p className="font-medium">{medicine.category}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground">Manufacturer</span>
                            <p className="font-medium">{medicine.manufacturer}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" /> Batch Number
                            </span>
                            <p className="font-mono font-medium">{medicine.batch_number}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Expiry Date
                            </span>
                            <p className="font-medium">{new Date(medicine.expiry_date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Current Stock</span>
                            <p className="font-bold text-lg">{medicine.stock_quantity}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Min. Level</span>
                            <p className="font-bold text-lg">{medicine.min_stock_level}</p>
                        </div>
                        <div className="space-y-1 p-3 bg-muted/40 rounded-lg text-center">
                            <span className="text-xs text-muted-foreground">Unit Price</span>
                            <p className="font-bold text-lg text-purple-600">{formatCurrency(medicine.unit_price)}</p>
                        </div>
                    </div>

                    {medicine.stock_quantity <= medicine.min_stock_level && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Stock level is below minimum threshold</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
