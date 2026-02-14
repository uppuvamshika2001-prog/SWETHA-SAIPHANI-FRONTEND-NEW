import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Removed duplicate import
// Removed mock data import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, ArrowRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { pharmacyService } from "@/services/pharmacyService";

const PharmacyPendingOrders = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await pharmacyService.getPendingPrescriptions();
                // Map backend data to UI format
                const mapped = data.map(record => ({
                    id: record.id,
                    order_id: record.patient?.uhid || record.id.slice(0, 8).toUpperCase(), // Use UHID or ID
                    patient_name: `${record.patient?.firstName} ${record.patient?.lastName}`,
                    patient_id: record.patient?.uhid,
                    created_at: record.createdAt,
                    items: record.prescriptions?.map((p: any) => ({
                        medicine_name: p.medicineName,
                        quantity: `${p.frequency} (${p.duration})`,
                        unit_price: 0, // Not available in prescription
                        total_price: 0
                    })) || [],
                    total_amount: 0,
                    status: record.prescriptionStatus || 'pending'
                }));
                setOrders(mapped);
            } catch (error) {
                console.error("Failed to fetch pending orders", error);
                toast.error("Failed to load orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order =>
        order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.order_id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartDispensing = (order: any) => {
        toast.success("Dispensing Started", {
            description: `Navigating to dispensing counter for Order #${order.order_id}`,
        });
        // Pass order ID / UHID to dispensing page via state or query
        // Since we didn't update Dispensing to read state, user might need to click from queue there.
        // But we can try passing state and hope to update Dispensing next if needed.
        // Actually, Dispensing has the "Queue" at the top now. Just navigating there is helpful.
        navigate('/pharmacy/dispensing');
    };

    const handleMarkComplete = (order: any) => {
        // This button logic is arguably redundant if dispensing handles it.
        // But if user wants to just mark complete:
        // Call dispense API?
        toast.info("Please use Dispensing Page to verify and complete.");
        navigate('/pharmacy/dispensing');
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pending Orders</h1>
                        <p className="text-muted-foreground mt-1">Manage prescription fulfillment requests</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search Patient or Order ID..."
                                className="pl-8 w-[250px] bg-white dark:bg-slate-950"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <Card key={order.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Package className="h-5 w-5 text-purple-600" />
                                                Order #{order.order_id}
                                            </CardTitle>
                                            <CardDescription>
                                                Patient: {order.patient_name} • Created: {new Date(order.created_at).toLocaleString()}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="bg-purple-600 hover:bg-purple-700"
                                                onClick={() => handleStartDispensing(order)}
                                            >
                                                Start Dispensing <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead>Dosage/Duration</TableHead>
                                                {/* Removed Price columns as they are not relevant until billing */}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.items.map((item: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{item.medicine_name}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                            <p className="font-medium">All caught up!</p>
                            <p className="text-sm">No pending orders found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyPendingOrders;

