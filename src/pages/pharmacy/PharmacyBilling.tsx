import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Printer, Save, History, Search, User, Pill, CreditCard } from 'lucide-react';
import { patientService } from "@/services/patientService";
import { pharmacyService } from "@/services/pharmacyService";
import { billingService, Bill } from "@/services/billingService";
import { downloadPharmacyBillPDF } from "@/utils/downloadPharmacyBill";
import { printInvoice } from "@/utils/printInvoice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface BillItem {
    id: string;
    medicineId: string;
    name: string;
    quantity: number;
    salePrice: number;
    gst: number;
    discount: number;
    batchNumber: string;
    expiryDate?: string;
    hsnCode?: string;
    availableStock: number;
    total: number;
}

export default function PharmacyBilling() {
    const { toast } = useToast();

    // Form State
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isWalkIn, setIsWalkIn] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // History State
    const [historyBills, setHistoryBills] = useState<Bill[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Totals Calculation
    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        billItems.forEach(item => {
            const baseAmount = item.quantity * item.salePrice;
            const itemDiscount = baseAmount * (item.discount / 100);
            const taxableAmount = baseAmount - itemDiscount;
            const itemGst = taxableAmount * (item.gst / 100);
            
            subtotal += baseAmount;
            totalDiscount += itemDiscount;
            totalTax += itemGst;
        });

        return {
            subtotal,
            totalDiscount,
            totalTax,
            grandTotal: subtotal - totalDiscount + totalTax
        };
    };

    const totals = calculateTotals();

    useEffect(() => {
        fetchBillHistory();
    }, []);

    const fetchBillHistory = async () => {
        setLoadingHistory(true);
        try {
            // Correctly use pharmacyService to fetch pharmacy-restricted bills
            const result = await (pharmacyService as any).getBills({ limit: 50 });
            if (result && result.items) {
                setHistoryBills(result.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (error) {
            console.error("Failed to fetch pharmacy bill history", error);
            toast({ title: "Error", description: "Could not load billing history", variant: "destructive" });
        } finally {
            setLoadingHistory(false);
        }
    };

    const searchPatients = async (query: string) => {
        const result = await patientService.getPatients({ search: query });
        return result.items.map((p: any) => ({
            ...p,
            id: p.uhid, // Ensure ID for SearchableSelect
        }));
    };

    const searchMedicines = async (query: string) => {
        const result = await pharmacyService.getMedicines({ search: query, isActive: true });
        return result.map((m: any) => ({
            ...m,
            id: m.id,
        }));
    };

    const handleAddMedicine = (medicine: any) => {
        if (medicine.stock_quantity <= 0) {
            toast({
                title: "Out of Stock",
                description: `${medicine.name} is currently out of stock.`,
                variant: "destructive"
            });
            return;
        }

        // Check if already in bill
        const existing = billItems.find(item => item.medicineId === medicine.id);
        if (existing) {
            updateItem(existing.id, 'quantity', existing.quantity + 1);
            return;
        }

        const newItem: BillItem = {
            id: Math.random().toString(36).substr(2, 9),
            medicineId: medicine.id,
            name: medicine.name,
            quantity: 1,
            salePrice: medicine.unit_price || 0,
            gst: medicine.gst || 0, // Fallback to 0 if not provided
            discount: 0,
            batchNumber: medicine.batch_number || '-',
            expiryDate: medicine.expiry_date || undefined,
            hsnCode: medicine.hsn_code || medicine.hsnCode || undefined,
            availableStock: medicine.stock_quantity,
            total: medicine.unit_price || 0
        };

        setBillItems([...billItems, newItem]);
    };

    const updateItem = (id: string, field: keyof BillItem, value: any) => {
        setBillItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            const updated = { ...item, [field]: value };
            
            // Validation for stock
            if (field === 'quantity') {
                const qty = parseInt(value) || 0;
                if (qty > item.availableStock) {
                    toast({
                        title: "Insufficient Stock",
                        description: `Only ${item.availableStock} available for ${item.name}`,
                        variant: "destructive"
                    });
                    updated.quantity = item.availableStock;
                } else if (qty < 1) {
                    updated.quantity = 1;
                } else {
                    updated.quantity = qty;
                }
            }

            // Recalculate item total
            const baseAmount = updated.quantity * updated.salePrice;
            const discountAmount = baseAmount * (updated.discount / 100);
            const taxableAmount = baseAmount - discountAmount;
            const gstAmount = taxableAmount * (updated.gst / 100);
            updated.total = taxableAmount + gstAmount;

            return updated;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setBillItems(billItems.filter(item => item.id !== id));
    };

    const handleSaveBill = async () => {
        if (!isWalkIn && !selectedPatient) {
            toast({ title: "Select Patient", description: "Please search and select a patient, or use Walk-in mode.", variant: "destructive" });
            return;
        }
        if (billItems.length === 0) {
            toast({ title: "Empty Bill", description: "Add at least one medicine to the bill.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const totalBillGstPercent = billItems.length > 0 ? (billItems.reduce((acc, item) => acc + item.gst, 0) / billItems.length) : 0;
            const totalBillDiscount = billItems.reduce((acc, item) => acc + (item.quantity * item.salePrice * (item.discount / 100)), 0);

            const payload = {
                patientId: isWalkIn ? undefined : selectedPatient?.uhid,
                customerName: isWalkIn && customerName ? customerName : undefined,
                phone: isWalkIn && phone ? phone : undefined,
                isWalkIn: isWalkIn,
                items: billItems.map(item => ({
                    medicineId: item.medicineId,
                    description: item.name,
                    quantity: item.quantity,
                    unitPrice: item.salePrice,
                    batchNumber: item.batchNumber,
                    expiryDate: item.expiryDate,
                    hsnCode: item.hsnCode,
                    gst: item.gst || 0,
                    discount: item.discount || 0
                })),
                gstPercent: totalBillGstPercent, 
                discount: totalBillDiscount,
                status: 'PAID',
                notes: 'Pharmacy Bill'
            };

            const savedBill = await pharmacyService.createBill(payload);
            await downloadPharmacyBillPDF(savedBill);
            toast({ title: "Success", description: "Bill generated and stock updated successfully." });
            
            // Reset
            setBillItems([]);
            setSelectedPatient(null);
            setCustomerName('');
            setPhone('');
            fetchBillHistory();
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "Failed to generate bill", 
                variant: "destructive" 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadHistory = async (bill: Bill) => {
        await downloadPharmacyBillPDF(bill);
    };

    const handlePrintHistory = (bill: Bill) => {
        printInvoice(bill, 'Pharmacy Invoice');
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold">Pharmacy Billing</h1>
                        <p className="text-muted-foreground">Search patients and medicines to generate invoices</p>
                    </div>
                </div>

                <Tabs defaultValue="new-bill" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="new-bill">New Billing</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new-bill" className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Billing Area */}
                            <div className="lg:col-span-3 space-y-6">
                                {/* Search Section */}
                                <Card className="glass">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-primary" />
                                                        Patient Details
                                                    </Label>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="walk-in-mode"
                                                            checked={isWalkIn}
                                                            onCheckedChange={(checked) => {
                                                                setIsWalkIn(checked);
                                                                if (checked) setSelectedPatient(null);
                                                            }}
                                                        />
                                                        <Label htmlFor="walk-in-mode" className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground">
                                                            Walk-in Customer
                                                        </Label>
                                                    </div>
                                                </div>

                                                {!isWalkIn ? (
                                                    <div className="space-y-2">
                                                        <SearchableSelect
                                                            onSearch={searchPatients}
                                                            onSelect={setSelectedPatient}
                                                            getDisplayValue={(p) => p ? `${p.full_name} (${p.uhid})` : "Search Patient..."}
                                                            renderItem={(p) => (
                                                                <div className="flex flex-col">
                                                                    <span>{p.full_name}</span>
                                                                    <span className="text-xs text-muted-foreground">{p.uhid} | {p.phone}</span>
                                                                </div>
                                                            )}
                                                            value={selectedPatient}
                                                            placeholder="Search Patient..."
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Input 
                                                                placeholder="Customer Name (Optional)" 
                                                                value={customerName} 
                                                                onChange={e => setCustomerName(e.target.value)} 
                                                                className="bg-background"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Input 
                                                                placeholder="Phone Number (Optional)" 
                                                                value={phone} 
                                                                onChange={e => setPhone(e.target.value)} 
                                                                className="bg-background"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Pill className="h-4 w-4 text-primary" />
                                                    Medicine Search (Name/Generic)
                                                </Label>
                                                <SearchableSelect
                                                    onSearch={searchMedicines}
                                                    onSelect={handleAddMedicine}
                                                    getDisplayValue={() => "Add Medicine..."}
                                                    renderItem={(m) => (
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex flex-col">
                                                                <span>{m.name}</span>
                                                                <span className="text-xs text-muted-foreground">{m.generic_name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-bold">₹{m.unit_price}</div>
                                                                <Badge variant={m.stock_quantity > 10 ? "secondary" : "destructive"} className="text-[10px] h-4">
                                                                    Stock: {m.stock_quantity}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )}
                                                    placeholder="Search Medicine..."
                                                />
                                            </div>
                                        </div>

                                        {selectedPatient && (
                                            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm animate-in fade-in slide-in-from-top-2">
                                                <div>
                                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Patient Name</p>
                                                    <p className="font-semibold">{selectedPatient.full_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">UHID</p>
                                                    <p className="font-semibold">{selectedPatient.uhid}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Contact</p>
                                                    <p className="font-semibold">{selectedPatient.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Age/Gender</p>
                                                    <p className="font-semibold">{selectedPatient.age} / {selectedPatient.gender}</p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Bill Table */}
                                <Card className="glass overflow-hidden">
                                    <CardHeader className="pb-2 border-b">
                                        <CardTitle className="text-lg">Bill Items</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="pl-6">Medicine Name</TableHead>
                                                    <TableHead>Batch</TableHead>
                                                    <TableHead className="w-[120px]">Quantity</TableHead>
                                                    <TableHead className="text-right">Price (₹)</TableHead>
                                                    <TableHead className="w-[100px] text-right">Disc %</TableHead>
                                                    <TableHead className="w-[100px] text-right">GST %</TableHead>
                                                    <TableHead className="text-right pr-6">Total (₹)</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {billItems.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Search className="h-8 w-8 opacity-20" />
                                                                <p>Search and select medicines to add items</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    billItems.map(item => (
                                                        <TableRow key={item.id} className="hover:bg-primary/5 transition-colors">
                                                            <TableCell className="pl-6 font-medium">{item.name}</TableCell>
                                                            <TableCell><span className="text-xs font-mono">{item.batchNumber}</span></TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                                        className="h-8 text-center"
                                                                    />
                                                                    <p className="text-[10px] text-center text-muted-foreground">
                                                                        Max: {item.availableStock}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">₹{item.salePrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    value={item.discount}
                                                                    onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                                                    className="h-8 text-right"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    value={item.gst}
                                                                    onChange={(e) => updateItem(item.id, 'gst', e.target.value)}
                                                                    className="h-8 text-right"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 font-bold">₹{item.total.toFixed(2)}</TableCell>
                                                            <TableCell className="pr-4">
                                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Summary & Payment */}
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="sticky top-6 border-primary/20 glass">
                                    <CardHeader className="bg-primary/5 border-b">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Discount</span>
                                                <span className="text-green-600 font-medium">-₹{totals.totalDiscount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">GST (Tax)</span>
                                                <span className="font-medium">+₹{totals.totalTax.toFixed(2)}</span>
                                            </div>
                                            <div className="pt-4 border-t">
                                                <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                                                    <span className="font-bold">Payable</span>
                                                    <span className="text-2xl font-black text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <Button 
                                                className="w-full h-12 text-lg font-bold shadow-lg" 
                                                onClick={handleSaveBill} 
                                                disabled={billItems.length === 0 || isSaving}
                                            >
                                                {isSaving ? (
                                                    "Processing..."
                                                ) : (
                                                    <>
                                                        <Save className="mr-2 h-5 w-5" />
                                                        Confirm & Print
                                                    </>
                                                )}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-full" 
                                                disabled={billItems.length === 0}
                                                onClick={() => {
                                                    // Quick print logic
                                                }}
                                            >
                                                <Printer className="mr-2 h-4 w-4" /> 
                                                Quick Print
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="mt-4">
                        <Card className="glass">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Bill History</span>
                                    <Button variant="outline" size="sm" onClick={fetchBillHistory} disabled={loadingHistory}>
                                        <History className={cn("h-4 w-4 mr-2", loadingHistory && "animate-spin")} />
                                        Refresh
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Bill #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyBills.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                        {loadingHistory ? "Loading history..." : "No pharmacy bills found."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                historyBills.map((bill) => (
                                                    <TableRow key={bill.id} className="hover:bg-primary/5 transition-colors">
                                                        <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-mono text-xs">{bill.billNumber}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {bill.isWalkIn 
                                                                    ? (bill.customerName || "Walk-in Customer") 
                                                                    : `${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}`.trim() || 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {bill.isWalkIn ? bill.phone : bill.patient?.phone}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">₹{Number(bill.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={bill.status === 'PAID' ? 'secondary' : 'destructive'}>
                                                                {bill.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadHistory(bill)} title="Download PDF">
                                                                    <Save className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handlePrintHistory(bill)} title="Print">
                                                                    <Printer className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
