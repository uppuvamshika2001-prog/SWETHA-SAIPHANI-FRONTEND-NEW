import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle2, AlertCircle, Package, ScanLine, ClipboardList, UserCheck, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { pharmacyService } from "@/services/pharmacyService";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

const PharmacyDispensing = () => {
    const [orderId, setOrderId] = useState("");
    const [foundOrder, setFoundOrder] = useState<any>(null);
    const [foundPatient, setFoundPatient] = useState<any>(null);
    const [verified, setVerified] = useState(false);
    const [dispensedItems, setDispensedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    // Pending Queue
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);

    useEffect(() => {
        loadPendingOrders();
    }, []);

    const loadPendingOrders = async () => {
        try {
            const data = await pharmacyService.getPendingPrescriptions();
            setPendingQueue(data);
        } catch (e) {
            console.error("Failed to load pending queue", e);
        }
    };

    const handleSelectPending = (record: any) => {
        // Map record to foundOrder format similar to handleLookup
        const orderData = {
            order_id: record.id,
            patient_id: record.patientId,
            patient_name: `${record.patient.firstName} ${record.patient.lastName}`,
            items: record.prescriptions.map((p: any) => ({
                medicine_name: p.medicineName,
                quantity: `${p.frequency} (${p.duration})`,
                total_price: 0
            })),
            total_amount: 0,
            status: record.prescriptionStatus || 'pending',
            raw_patient: record.patient
        };

        setFoundOrder(orderData);
        setFoundPatient({
            full_name: orderData.patient_name,
            patient_id: record.patient?.uhid || record.patientId.slice(0, 8),
            phone: record.patient?.phone || 'N/A'
        });
        setOrderId(record.patient?.uhid || record.id); // Auto-fill search box
        toast.info("Selected from Queue");
    };

    const handleLookup = async () => {
        if (!orderId.trim()) {
            toast.error("Please enter a record ID or Patient Name");
            return;
        }

        setLoading(true);
        try {
            let record = null;
            // Simple heuristic: if it looks like a Name (has letters, no dashes/numbers mixed typical of UUID)
            // Actually, backend ID is UUID.
            if (orderId.includes('-') && orderId.length > 20) {
                // Try ID lookup
                try {
                    record = await pharmacyService.getMedicalRecordById(orderId.trim());
                } catch (e) {
                    // Fallback to search if ID fails
                }
            }

            if (!record) {
                const results = await pharmacyService.searchMedicalRecords(orderId.trim());
                // Find first record with prescriptions
                record = results.find((r: any) => r.prescriptions && r.prescriptions.length > 0);
            }

            if (record) {
                if (!record.prescriptions || record.prescriptions.length === 0) {
                    toast.warning("Record found but has no prescriptions");
                    return;
                }

                if (record.prescriptionStatus === 'DISPENSED') {
                    toast.info("This prescription has already been dispensed");
                    // Still show it but maybe mark it
                }

                // Map Medical Record to Order View
                const orderData = {
                    order_id: record.id,
                    patient_id: record.patientId,
                    patient_name: `${record.patient.firstName} ${record.patient.lastName}`,
                    items: record.prescriptions.map((p: any) => ({
                        medicine_name: p.medicineName,
                        quantity: `${p.frequency} (${p.duration})`, // overload quantity for display
                        total_price: 0 // Backend doesn't provide price yet
                    })),
                    total_amount: 0,
                    status: record.prescriptionStatus, // Add status
                    raw_patient: record.patient // Store full patient details for verification
                };

                setFoundOrder(orderData);
                // Fetch full patient details if needed, or use what's in record
                // The record.patient only has names. We might need phone from patient service?
                // For now use what we have.
                setFoundPatient({
                    full_name: orderData.patient_name,
                    patient_id: record.patient?.uhid || record.patientId.slice(0, 8), // fallback
                    phone: 'N/A' // Record response simplified, might need patient profile fetch
                });

                // If already dispensed, verify automatically or disable verify?
                setVerified(record.prescriptionStatus === 'DISPENSED');
                toast.success(record.prescriptionStatus === 'DISPENSED' ? "Record Found (Dispensed)" : "Prescriptions Found");
            } else {
                toast.error("No records found", {
                    description: "No medical records with prescriptions match your query",
                });
                setFoundOrder(null);
                setFoundPatient(null);
            }
        } catch (error) {
            console.error("Lookup failed:", error);
            toast.error("Lookup Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        setVerified(true);
        toast.success("Patient Verified", {
            description: "You can now proceed with dispensing",
        });
    };

    const handleDispense = async () => {
        if (foundOrder) {
            if (foundOrder.status === 'DISPENSED') {
                toast.error("Already Dispensed");
                return;
            }

            try {
                await pharmacyService.dispenseMedicalRecord(foundOrder.order_id);
                setDispensedItems([...dispensedItems, {
                    ...foundOrder,
                    dispensedAt: new Date().toLocaleString(),
                }]);
                toast.success("Dispensing Complete", {
                    description: `Prescriptions for ${foundOrder.patient_name} dispensed`,
                });
                setFoundOrder(null);
                setFoundPatient(null);
                setOrderId("");
                setVerified(false);
            } catch (error) {
                console.error("Dispense failed:", error);
                toast.error("Failed to update status");
            }
        }
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Dispensing Counter</h1>
                    <p className="text-muted-foreground">Process new prescriptions and manage active dispensing</p>
                </div>

                {/* Pending Queue Section */}
                {pendingQueue.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                Pending Prescriptions
                            </CardTitle>
                            <CardDescription>New prescriptions waiting for dispensing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md bg-white">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Patient ID</TableHead>
                                            <TableHead>Patient Name</TableHead>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingQueue.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(record.createdAt).toLocaleTimeString()}
                                                </TableCell>
                                                <TableCell className="font-medium">{record.patient?.uhid || 'N/A'}</TableCell>
                                                <TableCell>{record.patient?.firstName} {record.patient?.lastName}</TableCell>
                                                <TableCell>{record.doctor?.firstName} {record.doctor?.lastName}</TableCell>
                                                <TableCell>
                                                    <Button size="sm" onClick={() => handleSelectPending(record)}>Process</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ScanLine className="h-5 w-5 text-purple-600" />
                                Lookup
                            </CardTitle>
                            <CardDescription>Enter Medical Record ID or Patient Name</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="order-lookup">Search</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="order-lookup"
                                        placeholder="Record UUID or First Name..."
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                    />
                                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleLookup} disabled={loading}>
                                        <Search className="h-4 w-4 mr-2" />
                                        {loading ? 'Searching...' : 'Lookup'}
                                    </Button>
                                </div>
                            </div>

                            {foundOrder && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                        <Package className="h-4 w-4" />
                                        Ref #{foundOrder.order_id.slice(0, 8)}...
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {foundOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between">
                                                <span>{item.medicine_name}</span>
                                                <span className="text-muted-foreground">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-green-600" />
                                Patient Verification
                            </CardTitle>
                            <CardDescription>Verify patient details before dispensing</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Patient Name</span>
                                    <div className={`font-medium ${foundPatient ? '' : 'h-6 bg-muted/50 rounded w-full animate-pulse'}`}>
                                        {foundPatient?.full_name || ''}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Patient ID</span>
                                    <div className={`font-medium ${foundPatient ? '' : 'h-6 bg-muted/50 rounded w-3/4 animate-pulse'}`}>
                                        {foundPatient?.patient_id || ''}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Phone</span>
                                    <div className={`font-medium ${foundPatient ? '' : 'h-6 bg-muted/50 rounded w-3/4 animate-pulse'}`}>
                                        {foundPatient?.phone || ''}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Status</span>
                                    <div className={`font-medium ${foundPatient ? '' : 'h-6 bg-muted/50 rounded w-1/2 animate-pulse'}`}>
                                        {verified ? (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <CheckCircle className="h-4 w-4" /> Verified
                                            </span>
                                        ) : foundPatient ? 'Pending Verification' : ''}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t space-y-2">
                                {!verified ? (
                                    <Button
                                        className="w-full"
                                        disabled={!foundPatient}
                                        onClick={handleVerify}
                                    >
                                        Verify & Continue
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={handleDispense}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Complete Dispensing
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5 text-gray-600" />
                            Recent Dispensing History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {dispensedItems.length > 0 ? (
                            <div className="space-y-2">
                                {dispensedItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <span className="font-medium">Order #{item.order_id}</span>
                                            <span className="text-muted-foreground text-sm ml-2">{item.patient_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(item.total_amount)}</div>
                                            <div className="text-xs text-muted-foreground">{item.dispensedAt}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No recent items dispensed in this session.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDispensing;

