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
import { Plus, Trash2, Printer, Save, History, Search, User, Pill, CreditCard, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { BillDetailsDialog } from '@/components/billing/BillDetailsDialog';

interface BillItem {
    id: string;
    medicine_id: string;
    name: string;
    quantity: number; // Total units
    strips?: number;
    tablets?: number;
    selling_price: number;
    gst_percent: number;
    discount: number;
    batch_number: string;
    expiry_date?: string;
    hsn_code?: string;
    available_stock: number;
    pack_quantity: number;
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
    const [paymentMethod, setPaymentMethod] = useState<string>('');

    // History State
    const [historyBills, setHistoryBills] = useState<Bill[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [billDate, setBillDate] = useState<Date | undefined>(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingBillId, setViewingBillId] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [patientRecentBills, setPatientRecentBills] = useState<Bill[]>([]);
    const [loadingPatientRecent, setLoadingPatientRecent] = useState(false);
    const itemsPerPage = 10;

    // Totals Calculation
    const parseNumericValue = (value: string | number, fallback = 0) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        return Number.isFinite(numericValue) ? numericValue : fallback;
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        billItems.forEach(item => {
            const quantity = parseNumericValue(item.quantity, 0);
            const sellingPrice = parseNumericValue(item.selling_price, 0);
            const discount = parseNumericValue(item.discount, 0);
            const gstPercent = 0;

            const baseAmount = quantity * sellingPrice;
            const itemDiscount = baseAmount * (discount / 100);
            const taxableAmount = baseAmount - itemDiscount;
            const itemGst = 0;
            
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
    }, [selectedDate, historySearch]);

    useEffect(() => {
        if (selectedPatient) {
            fetchPatientRecentBills(selectedPatient.uhid);
        } else {
            setPatientRecentBills([]);
        }
    }, [selectedPatient]);

    const isPharmacyBill = (bill: any) => {
        const billType = String(
            bill.bill_type ||
            bill.billType ||
            bill.type ||
            bill.source ||
            bill.sourceType ||
            ''
        ).toUpperCase();

        // First check if bill type is pharmacy
        const hasPharmacyType = [
            'PHARMACY',
            'PHARMACY_BILL',
            'PHARMACY_INVOICE',
            'PHARMACY_BILLS'
        ].includes(billType);

        if (!hasPharmacyType) return false;

        // Additionally check if bill contains actual pharmacy items (not lab tests)
        // Pharmacy items should have medicineId and medicine object
        const items = bill.items || [];
        if (items.length === 0) return false;

        // Check if at least one item has a medicineId (indicating it's a pharmacy item)
        const hasPharmacyItems = items.some((item: any) => item.medicineId || item.medicine_id || item.medicine);

        return hasPharmacyItems;
    };

    const fetchBillHistory = async () => {
        setLoadingHistory(true);
        try {
            const params: any = { limit: 100, billType: 'PHARMACY' };
            if (selectedDate) {
                params.startDate = format(selectedDate, 'yyyy-MM-dd');
                params.endDate = format(selectedDate, 'yyyy-MM-dd');
            }
            if (historySearch) {
                params.search = historySearch;
            }
            const result = await billingService.getBills(params);
            const items = Array.isArray(result) ? result : result.items || [];
            const pharmacyItems = items.filter(isPharmacyBill);
            setHistoryBills(pharmacyItems.sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime()));
        } catch (error) {
            console.error("Failed to fetch pharmacy bill history", error);
            toast({ title: "Error", description: "Could not load billing history", variant: "destructive" });
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchPatientRecentBills = async (uhid: string) => {
        setLoadingPatientRecent(true);
        try {
            const result = await billingService.getBills({ 
                patientId: uhid, 
                limit: 5, 
                billType: 'PHARMACY' 
            });
            const items = Array.isArray(result) ? result : result.items || [];
            setPatientRecentBills(items.filter(isPharmacyBill));
        } catch (error) {
            console.error("Failed to fetch patient recent bills", error);
        } finally {
            setLoadingPatientRecent(false);
        }
    };

    // Pagination calculations
    const totalPages = Math.ceil(historyBills.length / itemsPerPage);
    const paginatedBills = historyBills.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
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
        const existing = billItems.find(item => item.medicine_id === medicine.id);
        if (existing) {
            updateItem(existing.id, 'quantity', existing.quantity + 1);
            return;
        }

        const newItem: BillItem = {
            id: Math.random().toString(36).substr(2, 9),
            medicine_id: medicine.id,
            name: medicine.name,
            quantity: 1,
            strips: 0,
            tablets: 1,
            selling_price: medicine.unit_price || 0,
            gst_percent: 0,
            discount: 0,
            batch_number: medicine.batch_number || '-',
            expiry_date: medicine.expiry_date || undefined,
            hsn_code: medicine.hsn_code || undefined,
            available_stock: medicine.stock_quantity,
            pack_quantity: medicine.pack_quantity || 1,
            total: medicine.unit_price || 0
        };

        setBillItems([...billItems, newItem]);
    };

    const updateItem = (id: string, field: keyof BillItem, value: any) => {
        setBillItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            const updated = { ...item, [field]: value };
            
            // Handle dual-input synchronization
            if (field === 'strips' || field === 'tablets' || field === 'quantity') {
                let totalUnits = 0;
                
                if (field === 'strips' || field === 'tablets') {
                    const strips = field === 'strips' ? parseNumericValue(value, 0) : (item.strips || 0);
                    const tablets = field === 'tablets' ? parseNumericValue(value, 0) : (item.tablets || 0);
                    totalUnits = (strips * item.pack_quantity) + tablets;
                    
                    updated.strips = strips;
                    updated.tablets = tablets;
                } else {
                    // Direct quantity update
                    totalUnits = parseNumericValue(value, 0);
                    updated.strips = Math.floor(totalUnits / item.pack_quantity);
                    updated.tablets = totalUnits % item.pack_quantity;
                }

                if (totalUnits > item.available_stock) {
                    toast({
                        title: "Insufficient Stock",
                        description: `Only ${item.available_stock} available for ${item.name}`,
                        variant: "destructive"
                    });
                    totalUnits = item.available_stock;
                    updated.strips = Math.floor(totalUnits / item.pack_quantity);
                    updated.tablets = totalUnits % item.pack_quantity;
                } else if (totalUnits < 0) {
                    totalUnits = 0;
                    updated.strips = 0;
                    updated.tablets = 0;
                }
                
                updated.quantity = totalUnits;
            }

            if (field === 'discount') {
                updated.discount = parseNumericValue(value, 0);
            }

            if (field === 'gst_percent') {
                updated.gst_percent = parseNumericValue(value, 0);
            }

            // Recalculate item total
            const baseAmount = updated.quantity * updated.selling_price;
            const discountAmount = baseAmount * (updated.discount / 100);
            updated.total = baseAmount - discountAmount;

            return updated;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setBillItems(billItems.filter(item => item.id !== id));
    };

    const buildPrintableBill = (): Bill => {
        const printableItems = billItems.map(item => ({
            id: item.id,
            medicine_id: item.medicine_id,
            description: item.name,
            quantity: parseNumericValue(item.quantity, 0),
            unitPrice: parseNumericValue(item.selling_price, 0),
            unit_price: parseNumericValue(item.selling_price, 0),
            total: parseNumericValue(item.total, 0),
            totalAmount: parseNumericValue(item.total, 0),
            total_amount: parseNumericValue(item.total, 0),
            discount: parseNumericValue(item.discount, 0),
            gst: parseNumericValue(item.gst_percent, 0),
            gst_percent: parseNumericValue(item.gst_percent, 0),
            batchNumber: item.batch_number,
            batch_number: item.batch_number,
            expiryDate: item.expiry_date,
            expiry_date: item.expiry_date,
            hsnCode: item.hsn_code,
            hsn_code: item.hsn_code,
        }));

        return {
            id: 'draft-bill',
            billNumber: 'DRAFT',
            bill_number: 'DRAFT',
            patientId: selectedPatient?.uhid || null,
            patient_id: selectedPatient?.uhid || null,
            isWalkIn: isWalkIn,
            is_walk_in: isWalkIn,
            customerName: customerName || selectedPatient?.full_name || null,
            customer_name: customerName || selectedPatient?.full_name || null,
            phone: phone || selectedPatient?.phone || null,
            patient: selectedPatient ? {
                firstName: selectedPatient.full_name?.split(' ')[0] || '',
                lastName: selectedPatient.full_name?.split(' ').slice(1).join(' ') || '',
                phone: selectedPatient.phone || phone || ''
            } : undefined,
            items: printableItems,
            subtotal: totals.subtotal,
            discount: totals.totalDiscount,
            gstAmount: 0,
            gstPercent: 0,
            grandTotal: totals.grandTotal,
            status: 'PAID',
            createdAt: billDate ? billDate.toISOString() : new Date().toISOString(),
            created_at: billDate ? billDate.toISOString() : new Date().toISOString(),
            notes: 'Draft Pharmacy Invoice'
        } as Bill;
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
            const totalBillGstPercent = billItems.length > 0 ? (billItems.reduce((acc, item) => acc + parseNumericValue(item.gst_percent, 0), 0) / billItems.length) : 0;
            const subtotal = billItems.reduce((acc, item) => {
                return acc + (parseNumericValue(item.quantity, 0) * parseNumericValue(item.selling_price, 0));
            }, 0);
            const totalBillDiscount = billItems.reduce((acc, item) => {
                const baseAmount = parseNumericValue(item.quantity, 0) * parseNumericValue(item.selling_price, 0);
                return acc + (baseAmount * (parseNumericValue(item.discount, 0) / 100));
            }, 0);
            const totalBillTax = billItems.reduce((acc, item) => {
                const baseAmount = parseNumericValue(item.quantity, 0) * parseNumericValue(item.selling_price, 0);
                const discountAmount = baseAmount * (parseNumericValue(item.discount, 0) / 100);
                const taxableAmount = baseAmount - discountAmount;
                return acc + (taxableAmount * (parseNumericValue(item.gst_percent, 0) / 100));
            }, 0);
            const grandTotal = subtotal - totalBillDiscount + totalBillTax;

            const payload = {
                patient_id: isWalkIn ? undefined : selectedPatient?.uhid,
                customer_name: isWalkIn && customerName ? customerName : undefined,
                phone: isWalkIn && phone ? phone : undefined,
                is_walk_in: isWalkIn,
                items: billItems.map(item => ({
                    medicine_id: item.medicine_id,
                    description: item.name,
                    quantity: parseNumericValue(item.quantity, 0),
                    unit_price: parseNumericValue(item.selling_price, 0),
                    batch_number: item.batch_number,
                    expiry_date: item.expiry_date,
                    hsn_code: item.hsn_code,
                    gst_percent: parseNumericValue(item.gst_percent, 0),
                    discount: parseNumericValue(item.discount, 0),
                    total_amount: parseNumericValue(item.total, 0)
                })),
                subtotal,
                discount: totalBillDiscount,
                gst_amount: totalBillTax,
                gstAmount: totalBillTax,
                gst_percent: totalBillGstPercent,
                gstPercent: totalBillGstPercent,
                grandTotal,
                status: 'PAID',
                bill_date: billDate ? format(billDate, 'yyyy-MM-dd') : undefined,
                created_at: billDate ? billDate.toISOString() : undefined,
                payment_method: paymentMethod,
                notes: 'Pharmacy Bill'
            };

            const savedBill = await pharmacyService.createBill(payload);
            const normalizedBill = {
                ...savedBill,
                subtotal,
                discount: totalBillDiscount,
                gstAmount: totalBillTax,
                gstPercent: totalBillGstPercent,
                grandTotal,
                items: (savedBill.items || billItems).map((item: any) => ({
                    ...item,
                    unitPrice: item.unitPrice ?? item.unit_price ?? parseNumericValue(item.unit_price, 0),
                    totalAmount: item.totalAmount ?? item.total_amount ?? parseNumericValue(item.total, 0),
                    gst: item.gst ?? item.gst_percent ?? item.gstPercent,
                    discount: item.discount ?? item.discount_amount ?? item.discountAmount,
                    batchNumber: item.batchNumber ?? item.batch_number,
                    expiryDate: item.expiryDate ?? item.expiry_date,
                    hsnCode: item.hsnCode ?? item.hsn_code,
                })),
                paymentMode: paymentMethod || 'CASH'
            };
            await downloadPharmacyBillPDF(normalizedBill);
            toast({ title: "Success", description: "Bill generated and stock updated successfully." });
            
            // Reset
            setBillItems([]);
            setSelectedPatient(null);
            setCustomerName('');
            setPhone('');
            setPaymentMethod('');
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
        const normalized = {
            ...bill,
            paymentMode: (bill as any).payment_method || (bill as any).paymentMode || 'CASH'
        };
        await downloadPharmacyBillPDF(normalized as any);
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
                                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                                                {/* Recent Bills List */}
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                        <History className="h-3 w-3" />
                                                        Recent Pharmacy Bills
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {loadingPatientRecent ? (
                                                            <div className="col-span-full py-2 text-xs text-center text-muted-foreground italic">Loading history...</div>
                                                        ) : patientRecentBills.length === 0 ? (
                                                            <div className="col-span-full py-2 text-xs text-center text-muted-foreground italic">No previous bills found.</div>
                                                        ) : (
                                                            patientRecentBills.map(bill => (
                                                                <div key={bill.id} className="flex items-center justify-between p-2 rounded border bg-card/50 hover:bg-accent/50 transition-colors cursor-pointer group" onClick={() => setViewingBillId(bill.id)}>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-mono text-muted-foreground">{bill.billNumber || bill.bill_number}</span>
                                                                        <span className="text-xs font-medium">{new Date(bill.createdAt || bill.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xs font-bold">₹{Number(bill.grandTotal || bill.grand_total).toFixed(2)}</div>
                                                                        <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Eye className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Bill Table */}
                                <Card className="glass overflow-hidden">
                                    <CardHeader className="pb-2 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg">Bill Items</CardTitle>
                                        <div className="flex items-center gap-2 font-normal">
                                            <span className="text-sm text-muted-foreground">Date:</span>
                                            <DatePicker date={billDate} setDate={setBillDate} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="pl-6">Medicine Name</TableHead>
                                                    <TableHead>Batch</TableHead>
                                                    <TableHead className="w-[120px]">Qty (Strips)</TableHead>
                                                    <TableHead className="w-[120px]">Qty (Tablets)</TableHead>
                                                    <TableHead className="w-[110px]">Total Qty</TableHead>
                                                    <TableHead className="text-right">Price (₹)</TableHead>
                                                    <TableHead className="w-[90px] text-right">Disc %</TableHead>
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
                                                            <TableCell><span className="text-xs font-mono">{item.batch_number}</span></TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.strips || 0}
                                                                        onChange={(e) => updateItem(item.id, 'strips', e.target.value)}
                                                                        className="h-8 text-center"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.tablets || 0}
                                                                        onChange={(e) => updateItem(item.id, 'tablets', e.target.value)}
                                                                        className="h-8 text-center"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-center gap-1 px-2 py-1 rounded bg-muted/30 text-xs font-bold">
                                                                        {item.quantity}
                                                                    </div>
                                                                    <p className="text-[9px] text-center text-muted-foreground">
                                                                        Stock: {item.available_stock}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex flex-col">
                                                                    <span>₹{item.selling_price.toFixed(2)}</span>
                                                                    {item.pack_quantity > 1 && (
                                                                        <span className="text-[10px] text-muted-foreground italic">
                                                                            (₹{(item.selling_price * item.pack_quantity).toFixed(2)}/Strip)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    value={item.discount}
                                                                    onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
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
                                            <div className="pt-4 border-t">
                                                <div className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
                                                    <span className="font-bold">Payable</span>
                                                    <span className="text-2xl font-black text-primary">₹{totals.grandTotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <div className="space-y-2 mb-4">
                                                <Label className="text-sm font-medium">Select Payment Method</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button 
                                                        type="button" 
                                                        variant={paymentMethod === 'CASH' ? 'default' : 'outline'} 
                                                        onClick={() => setPaymentMethod('CASH')}
                                                        className={paymentMethod === 'CASH' ? 'bg-primary text-primary-foreground' : ''}
                                                    >
                                                        Cash
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        variant={paymentMethod === 'UPI' ? 'default' : 'outline'} 
                                                        onClick={() => setPaymentMethod('UPI')}
                                                        className={paymentMethod === 'UPI' ? 'bg-primary text-primary-foreground' : ''}
                                                    >
                                                        UPI
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        variant={paymentMethod === 'CREDIT' ? 'default' : 'outline'} 
                                                        onClick={() => setPaymentMethod('CREDIT')}
                                                        className={paymentMethod === 'CREDIT' ? 'bg-primary text-primary-foreground' : ''}
                                                    >
                                                        Credit
                                                    </Button>
                                                </div>
                                            </div>

                                            {paymentMethod && (
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
                                            )}
                                            <Button 
                                                variant="outline" 
                                                className="w-full" 
                                                disabled={billItems.length === 0}
                                                onClick={() => {
                                                    const draftBill = buildPrintableBill();
                                                    printInvoice(draftBill, 'Pharmacy Invoice');
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
                                    <div className="flex items-center gap-3 text-sm font-normal">
                                        <div className="relative w-[200px]">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search Patient/Bill..."
                                                className="pl-9 h-9"
                                                value={historySearch}
                                                onChange={(e) => setHistorySearch(e.target.value)}
                                            />
                                        </div>
                                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
                                        {selectedDate && (
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)}>
                                                Clear Date
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={fetchBillHistory} disabled={loadingHistory}>
                                            <History className={cn("h-4 w-4 mr-2", loadingHistory && "animate-spin")} />
                                            Refresh
                                        </Button>
                                    </div>
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
                                                <TableHead>Medicines</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-right pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyBills.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                        {loadingHistory ? "Loading history..." : "No pharmacy bills found."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedBills.map((bill) => (
                                                    <TableRow key={bill.id} className="hover:bg-primary/5 transition-colors">
                                                        <TableCell>{new Date(bill.created_at || bill.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-mono text-xs">{bill.bill_number || bill.billNumber}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">
                                                                {(() => {
                                                                    const patientName = bill.patient?.first_name
                                                                        || bill.patient?.last_name
                                                                        || [bill.patient?.firstName, bill.patient?.lastName].filter(Boolean).join(' ')
                                                                        || bill.customer_name
                                                                        || bill.customerName;
                                                                    if (patientName) return patientName;
                                                                    if (bill.is_walk_in || bill.isWalkIn) return bill.customer_name || bill.customerName || 'Walk-in Customer';
                                                                    return 'Unknown Patient';
                                                                })()}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {bill.phone || bill.patient?.phone || ''}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={bill.items?.map((i: any) => i.description || i.name || i.medicine?.name || 'Unknown Medicine').join(', ')}>
                                                                {bill.items?.map((i: any) => i.description || i.name || i.medicine?.name || 'Unknown Medicine').join(', ') || 'No items'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="text-xs text-muted-foreground">
                                                                {bill.items?.map((i: any) => i.quantity).join(', ') || '-'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">₹{Number(bill.grand_total || bill.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={bill.status === 'PAID' ? 'secondary' : 'destructive'}>
                                                                {bill.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex justify-end gap-1">
                                                                <Button variant="ghost" size="icon" onClick={() => setViewingBillId(bill.id)} title="View Details">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
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

                                {/* Pagination Controls */}
                                {!loadingHistory && historyBills.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 mt-2">
                                        <div className="text-sm text-muted-foreground">
                                            Showing <span className="font-semibold text-foreground">{Math.min(historyBills.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{" "}
                                            <span className="font-semibold text-foreground">{Math.min(historyBills.length, currentPage * itemsPerPage)}</span> of{" "}
                                            <span className="font-semibold text-foreground">{historyBills.length}</span> entries
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            
                                            <div className="flex items-center gap-1 mx-2">
                                                {getPageNumbers().map((page, index) => (
                                                    typeof page === 'number' ? (
                                                        <Button
                                                            key={index}
                                                            variant={currentPage === page ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-primary hover:bg-primary/90' : ''}`}
                                                        >
                                                            {page}
                                                        </Button>
                                                    ) : (
                                                        <span key={index} className="px-1 text-muted-foreground">...</span>
                                                    )
                                                ))}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {viewingBillId && (
                    <BillDetailsDialog 
                        open={!!viewingBillId} 
                        onOpenChange={(open) => !open && setViewingBillId(null)}
                        billId={viewingBillId}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
