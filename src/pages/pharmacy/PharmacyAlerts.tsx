import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertOctagon, TrendingDown, ArrowRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { pharmacyService } from "@/services/pharmacyService";
import { Medicine } from "@/types";

const PharmacyAlerts = () => {
    const [reorderedItems, setReorderedItems] = useState<string[]>([]);
    const [medicineList, setMedicineList] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedicines = async () => {
            try {
                setLoading(true);
                const data = await pharmacyService.getMedicines();
                setMedicineList(data || []);
            } catch (error) {
                console.error("Failed to fetch medicines for alerts:", error);
                toast.error("Failed to load stock alerts.");
            } finally {
                setLoading(false);
            }
        };

        fetchMedicines();
    }, []);

    // Filter for low stock or out of stock items
    // Use min_stock_level/reorderLevel if set, otherwise default to 5 as threshold
    // Handle both snake_case (frontend types) and camelCase (backend response)
    const LOW_STOCK_DEFAULT_THRESHOLD = 5;
    const alertMedicines = medicineList.filter(med => {
        const stockQty = med.stock_quantity ?? (med as any).stockQuantity ?? 0;
        const minLevel = med.min_stock_level ?? (med as any).reorderLevel ?? 0;
        const threshold = minLevel > 0 ? minLevel : LOW_STOCK_DEFAULT_THRESHOLD;
        const status = med.status || '';

        return status === 'low_stock' || status === 'out_of_stock' || stockQty <= threshold;
    });

    const handleReorder = (med: any) => {
        setReorderedItems([...reorderedItems, med.id]);
        toast.success("Reorder Placed", {
            description: `Reorder request for ${med.name} has been submitted`,
        });
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-8 w-8" />
                        Stock Alerts
                    </h1>
                    <p className="text-muted-foreground mt-1">Critical inventory items requiring immediate attention</p>
                </div>

                <div className="grid gap-6">
                    <Card className="border-t-4 border-t-red-500 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertOctagon className="h-5 w-5 text-red-500" />
                                Critical Stock Levels
                            </CardTitle>
                            <CardDescription>Medicines below minimum stock level or out of stock</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center p-8 text-muted-foreground">
                                    Loading stock alerts...
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine Name</TableHead>
                                            <TableHead>Current Stock</TableHead>
                                            <TableHead>Min. Level</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {alertMedicines.map((med) => {
                                            // Handle both snake_case (frontend) and camelCase (backend)
                                            const genericName = med.generic_name || (med as any).genericName || '-';
                                            const stockQty = med.stock_quantity ?? (med as any).stockQuantity ?? 0;
                                            const minLevel = med.min_stock_level ?? (med as any).reorderLevel ?? 0;
                                            const status = med.status || 'low_stock';

                                            return (
                                                <TableRow key={med.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{med.name}</span>
                                                            <span className="text-xs text-muted-foreground">{genericName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 font-bold text-red-600">
                                                            <TrendingDown className="h-4 w-4" />
                                                            {stockQty}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{minLevel}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={status === 'out_of_stock' ? "destructive" : "secondary"} className={status === 'low_stock' ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : ""}>
                                                            {status.replace('_', ' ').toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {reorderedItems.includes(med.id) ? (
                                                            <Button size="sm" variant="ghost" disabled className="text-green-600">
                                                                <CheckCircle className="mr-1 h-3 w-3" /> Ordered
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                                                onClick={() => handleReorder(med)}
                                                            >
                                                                Reorder <ArrowRight className="ml-1 h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {alertMedicines.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="bg-green-100 p-2 rounded-full">
                                                            <TrendingDown className="h-6 w-6 text-green-600 rotate-180" />
                                                        </div>
                                                        <span>All stock levels are healthy!</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyAlerts;

