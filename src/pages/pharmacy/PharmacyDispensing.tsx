import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle2, AlertCircle, Package, ScanLine, ClipboardList, UserCheck, CheckCircle, ChevronDown, ChevronUp, Filter, User, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { pharmacyService } from "@/services/pharmacyService";
import { patientService } from "@/services/patientService";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/format";

const PharmacyDispensing = () => {
    const [orderId, setOrderId] = useState("");
    const [foundOrder, setFoundOrder] = useState<any>(null);
    const [foundPatient, setFoundPatient] = useState<any>(null);
    const [verified, setVerified] = useState(false);
    const [dispensedItems, setDispensedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [lookupResults, setLookupResults] = useState<any[]>([]);
    const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
        endDate: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    });
    const [activeFilter, setActiveFilter] = useState<'today' | '7days' | 'month' | 'custom'>('today');

    const toggleHistory = (id: string) => {
        setExpandedHistory(prev => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        loadPendingOrders();
    }, []);

    useEffect(() => {
        loadDispensedHistory();
    }, [dateRange]);

    const handleFilterChange = (filter: 'today' | '7days' | 'month') => {
        setActiveFilter(filter);
        const today = new Date();
        const endStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        let startStr = endStr;

        if (filter === '7days') {
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            startStr = new Date(lastWeek.getTime() - (lastWeek.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        } else if (filter === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            startStr = new Date(firstDay.getTime() - (firstDay.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        }

        setDateRange({ startDate: startStr, endDate: endStr });
    };

    const loadDispensedHistory = async () => {
        try {
            const data = await pharmacyService.getDispensedHistory({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            });
            console.log("Dispensed History API Response:", data);
            
            setDispensedItems(data.map(item => {
                console.log("History Item:", item);
                
                // Ensure total_amount is a valid number with robust fallbacks
                const rawAmount = item.total_amount || item.total || 0;
                let totalAmount = Number(rawAmount);
                if (isNaN(totalAmount)) totalAmount = 0;
                
                // Safe date handling: try dispensedAt, then updatedAt, then createdAt
                let safeDateString = "—";
                const dateSource = item.dispensedAt || item.updatedAt || item.createdAt;
                
                if (dateSource) {
                    const date = new Date(dateSource);
                    if (!isNaN(date.getTime())) {
                        // User specifically requested toLocaleDateString for a cleaner view
                        safeDateString = date.toLocaleDateString();
                    }
                }

                return {
                    ...item,
                    order_id: (item.id || "").slice(0, 8), // Safe slice for ID
                    patient_name: `${item.patient?.firstName || 'Patient'} ${item.patient?.lastName || ''}`,
                    total_amount: totalAmount,
                    dispensedAt: safeDateString
                };
            }));
        } catch (e) {
            console.error("Failed to load dispensed history", e);
            toast.error("Failed to load history");
        }
    };

    const loadPendingOrders = async () => {
        try {
            const data = await pharmacyService.getPendingPrescriptions();
            setPendingQueue(data);
        } catch (e) {
            console.error("Failed to load pending queue", e);
        }
    };

    const selectRecord = (record: any) => {
        // Map Medical Record to Order View
        const orderData = {
            order_id: record.id,
            patient_id: record.patientId,
            patient_name: `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`.trim() || 'Walk-in Patient',
            items: record.prescriptions.map((p: any) => ({
                medicine_name: p.medicineName,
                quantity: `${p.frequency} (${p.duration})`,
                unit_price: p.unitPrice || 0,
                total_amount: 0
            })),
            total_amount: 0,
            status: record.prescriptionStatus || 'pending',
            raw_patient: record.patient
        };

        setFoundOrder(orderData);
        setFoundPatient({
            full_name: orderData.patient_name,
            patient_id: record.patient?.uhid || record.patientId?.slice(0, 8),
            phone: record.patient?.phone || 'N/A'
        });
        setOrderId(record.patient?.uhid || record.id);
        setLookupResults([]);
        setVerified(record.prescriptionStatus === 'DISPENSED');
        
        if (record.prescriptionStatus === 'DISPENSED') {
            toast.info("This record has already been dispensed");
        } else {
            toast.success("Prescription Found");
        }
    };

    const handleSelectPending = (record: any) => {
        selectRecord(record);
        toast.info("Selected from Queue");
    };

    const handleLookup = async () => {
        const query = orderId.trim();
        if (!query) {
            toast.error("Please enter a record ID or Patient Name");
            return;
        }

        setLoading(true);
        setLookupResults([]);
        try {
            // 1. Try to search for medical records directly (as we do now)
            const results = await pharmacyService.searchMedicalRecords(query);
            
            // Filter to those with prescriptions
            const validResults = results.filter((r: any) => r.prescriptions && r.prescriptions.length > 0);

            if (validResults.length > 0) {
                if (validResults.length === 1) {
                    selectRecord(validResults[0]);
                } else {
                    setLookupResults(validResults);
                    setFoundOrder(null);
                    setFoundPatient(null);
                    toast.info(`Found ${validResults.length} records with prescriptions.`);
                }
                return;
            }

            // 2. Fallback: If no records with prescriptions, search for the PATIENT directly
            // This helps distinguish between "No such person" and "Person exists but no prescription"
            const patientResults = await patientService.getPatients({ search: query, limit: 5 });
            
            if (patientResults.items && patientResults.items.length > 0) {
                const patient = patientResults.items[0];
                toast.warning(`Patient "${patient.full_name}" found, but no active prescriptions were found for them.`, {
                    description: "Please check if the doctor has finished their record or if you are looking for an older bill.",
                    duration: 5000,
                });
                
                // Show the patient details anyway to confirm we found the right person
                setFoundPatient(patient);
                setFoundOrder(null);
            } else {
                toast.error("No record found", {
                    description: `No patient or medical record matching "${query}" was found.`,
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
                toast.success("Dispensing Complete", {
                    description: `Prescriptions for ${foundOrder.patient_name} dispensed`,
                });
                // Refresh list from backend
                loadDispensedHistory();
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
                        <CardContent className="space-y-4">                                <div className="space-y-2">
                                <Label htmlFor="order-lookup">Search</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="order-lookup"
                                        placeholder="Enter UHID, Name or Phone..."
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

                            {lookupResults.length > 0 && (
                                <div className="border rounded-md max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                            <TableRow>
                                                <TableHead className="text-xs">Patient</TableHead>
                                                <TableHead className="text-xs">UHID</TableHead>
                                                <TableHead className="text-xs">Phone</TableHead>
                                                <TableHead className="text-xs">Date</TableHead>
                                                <TableHead className="text-xs text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lookupResults.map((record) => (
                                                <TableRow key={record.id} className="hover:bg-purple-50">
                                                    <TableCell className="py-2 text-sm font-medium">
                                                        {record.patient?.firstName} {record.patient?.lastName}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-xs font-mono text-muted-foreground">
                                                        {record.patient?.uhid || record.id.slice(0, 8)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-xs">
                                                        {record.patient?.phone || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-xs">
                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right">
                                                        <Button variant="ghost" size="sm" className="h-7 text-purple-600 hover:text-purple-700 hover:bg-purple-100" onClick={() => selectRecord(record)}>
                                                            Select
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

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
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-gray-600" />
                                Dispensing History
                            </CardTitle>
                            <CardDescription>Records for selected period</CardDescription>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button 
                                    variant={activeFilter === 'today' ? 'default' : 'ghost'} 
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleFilterChange('today')}
                                >Today</Button>
                                <Button 
                                    variant={activeFilter === '7days' ? 'default' : 'ghost'} 
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleFilterChange('7days')}
                                >Last 7 Days</Button>
                                <Button 
                                    variant={activeFilter === 'month' ? 'default' : 'ghost'} 
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleFilterChange('month')}
                                >This Month</Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="date" 
                                    className="h-8 text-xs w-[130px]" 
                                    value={dateRange.startDate}
                                    onChange={(e) => {
                                        setActiveFilter('custom');
                                        setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                                    }}
                                />
                                <span className="text-muted-foreground text-xs">to</span>
                                <Input 
                                    type="date" 
                                    className="h-8 text-xs w-[130px]" 
                                    value={dateRange.endDate}
                                    onChange={(e) => {
                                        setActiveFilter('custom');
                                        setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                                    }}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <div className="px-6 py-4 border-y bg-muted/20 flex gap-8">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Total Orders</p>
                            <p className="text-2xl font-bold">{dispensedItems.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(dispensedItems.reduce((acc, item) => acc + (item.total_amount || 0), 0))}
                            </p>
                        </div>
                    </div>

                    <CardContent className="pt-6">
                        {dispensedItems.length > 0 ? (
                            <div className="space-y-2">
                                {dispensedItems.map((item, idx) => {
                                    const isExpanded = !!expandedHistory[item.id];
                                    return (
                                    <div key={idx} className="flex flex-col border rounded-lg bg-card text-card-foreground shadow-sm">
                                        <div 
                                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleHistory(item.id)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Order #{item.order_id}</span>
                                                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                                        {item.items?.length || 0} Items
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-sm">{item.patient_name}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="font-medium text-purple-700">
                                                    {formatCurrency(item.total_amount || 0)}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {item.dispensedAt || "—"}
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Details */}
                                        {isExpanded && item.items && item.items.length > 0 && (
                                            <div className="px-4 pb-4 pt-2 border-t bg-muted/10">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="hover:bg-transparent">
                                                            <TableHead className="py-2 h-8 text-xs font-semibold">Medicine Name</TableHead>
                                                            <TableHead className="py-2 h-8 text-xs font-semibold">Batch No.</TableHead>
                                                            <TableHead className="py-2 h-8 text-xs font-semibold text-right">Qty</TableHead>
                                                            <TableHead className="py-2 h-8 text-xs font-semibold text-right">Unit Price</TableHead>
                                                            <TableHead className="py-2 h-8 text-xs font-semibold text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {item.items.map((sub: any, i: number) => (
                                                            <TableRow key={i} className="hover:bg-transparent border-b-0">
                                                                <TableCell className="py-2 font-medium text-sm">{sub.medicine_name || sub.medicineName}</TableCell>
                                                                <TableCell className="py-2 font-mono text-xs text-muted-foreground">{sub.batch_number || sub.batchNumber}</TableCell>
                                                                <TableCell className="py-2 text-right text-sm">{sub.quantity}</TableCell>
                                                                <TableCell className="py-2 text-right text-sm">{formatCurrency(sub.unit_price || sub.unitPrice)}</TableCell>
                                                                <TableCell className="py-2 text-right text-sm font-medium">{formatCurrency(sub.total_amount || sub.total)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                                <Filter className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
                                <p className="font-medium text-foreground">No dispensing records found</p>
                                <p className="text-sm mt-1">Try adjusting your date filters.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDispensing;

