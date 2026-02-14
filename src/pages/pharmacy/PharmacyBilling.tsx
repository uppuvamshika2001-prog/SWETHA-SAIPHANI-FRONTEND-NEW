import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Printer, Save, Check, ChevronsUpDown, FileText, Download, History } from 'lucide-react';
import { medicines } from '@/data/mockData';
import { usePatients } from '@/contexts/PatientContext';
import { cn } from "@/lib/utils";
import { billingService, Bill } from "@/services/billingService";
import { printInvoice } from "@/utils/printInvoice";
import { downloadPharmacyBillPDF } from "@/utils/downloadPharmacyBill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BillItem {
    id: string;
    medicineId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    gst: number;
    discount: number;
    total: number;
}

export default function PharmacyBilling() {
    const { toast } = useToast();
    const { patients } = usePatients();

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedMedicineId, setSelectedMedicineId] = useState('');
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [manualMedicineName, setManualMedicineName] = useState('');
    const [manualMedicinePrice, setManualMedicinePrice] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [gst, setGst] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [openMedicineCombobox, setOpenMedicineCombobox] = useState(false);

    // History State
    const [historyBills, setHistoryBills] = useState<Bill[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Derived State
    const selectedPatient = patients.find(p => p.uhid === selectedPatientId);
    const selectedMedicine = medicines.find(m => m.id === selectedMedicineId);
    const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);
    const subTotal = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = billItems.reduce((sum, item) => {
        const base = item.quantity * item.unitPrice;
        const disc = base * ((item.discount || 0) / 100);
        return sum + ((base - disc) * ((item.gst || 0) / 100));
    }, 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * ((item.discount || 0) / 100)), 0);

    // Fetch History on Mount
    useEffect(() => {
        fetchBillHistory();
    }, []);

    const fetchBillHistory = async () => {
        setLoadingHistory(true);
        try {
            // Fetching all bills for now (could filter by type if API supports it, but currently fetching all)
            const result = await billingService.getBills({ limit: 50 }); // Fetch last 50
            if (result && result.items) {
                // Filter client side if needed, or assume all are relevant.
                // For pharmacy specific, we might check notes or items, but currently all bills are treated same.
                // Sorting by date desc
                const sorted = result.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setHistoryBills(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch bill history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAddItem = () => {
        let newItem: BillItem;
        const currentGst = Number(gst) || 0;
        const currentDiscount = Number(discount) || 0;

        if (isManualEntry) {
            if (!manualMedicineName || !manualMedicinePrice) {
                toast({
                    title: "Missing Information",
                    description: "Please enter medicine name and price.",
                    variant: "destructive"
                });
                return;
            }
            const price = parseFloat(manualMedicinePrice);
            if (isNaN(price) || price <= 0) {
                toast({
                    title: "Invalid Price",
                    description: "Please enter a valid price.",
                    variant: "destructive"
                });
                return;
            }

            // Calculation
            const baseAmount = quantity * price;
            const discountAmount = baseAmount * (currentDiscount / 100);
            const taxableAmount = baseAmount - discountAmount;
            const gstAmount = taxableAmount * (currentGst / 100);
            const total = taxableAmount + gstAmount;

            newItem = {
                id: Math.random().toString(36).substr(2, 9),
                medicineId: 'MANUAL',
                name: manualMedicineName,
                quantity: quantity,
                unitPrice: price,
                gst: currentGst,
                discount: currentDiscount,
                total: total
            };
            // Reset manual inputs
            setManualMedicineName('');
            setManualMedicinePrice('');
        } else {
            if (!selectedPatientId) {
                toast({
                    title: "Select Patient",
                    description: "Please select a patient before adding items.",
                    variant: "destructive"
                });
                return;
            }
            if (!selectedMedicine) return;

            if (quantity > selectedMedicine.stock_quantity) {
                toast({
                    title: "Insufficient Stock",
                    description: `Only ${selectedMedicine.stock_quantity} units available.`,
                    variant: "destructive"
                });
                return;
            }

            const baseAmount = quantity * selectedMedicine.unit_price;
            const discountAmount = baseAmount * (currentDiscount / 100);
            const taxableAmount = baseAmount - discountAmount;
            const gstAmount = taxableAmount * (currentGst / 100);
            const total = taxableAmount + gstAmount;

            newItem = {
                id: Math.random().toString(36).substr(2, 9),
                medicineId: selectedMedicine.id,
                name: selectedMedicine.name,
                quantity: quantity,
                unitPrice: selectedMedicine.unit_price,
                gst: currentGst,
                discount: currentDiscount,
                total: total
            };
            setSelectedMedicineId('');
        }

        setBillItems([...billItems, newItem]);
        setQuantity(1);
        setGst(0); // Reset GST
        setDiscount(0); // Reset Discount
    };

    const handleRemoveItem = (id: string) => {
        setBillItems(billItems.filter(item => item.id !== id));
    };

    const handleSaveBill = async () => {
        if (!selectedPatientId || billItems.length === 0) {
            toast({
                title: "Error",
                description: "Select patient and add items first",
                variant: "destructive"
            });
            return;
        }

        const calculateTotal = () => {
            const taxable = billItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
            const gst = billItems.reduce((acc, item) => {
                const base = item.unitPrice * item.quantity;
                return acc + ((base * (item.gst || 0)) / 100);
            }, 0);
            return {
                taxable,
                gst,
                total: taxable + gst
            };
        };

        try {
            // 1. Save to Backend
            // Note: We don't send medicineId since we're using mock medicine data
            // In production, you would fetch real medicines from the inventory API
            const backendItems = billItems.map(item => ({
                description: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice, // Send unit price, backend calculates total
                total: item.total // Send total as well if backend expects it or we want to force it
            }));

            const payload = {
                patientId: selectedPatientId,
                items: backendItems,
                gstPercent: 0,
                discount: 0, // Discount handled in item totals
                status: 'PAID',
                paidAmount: calculateTotal().total,
                notes: 'Pharmacy Bill'
            };

            const savedBill = await billingService.createBill(payload);

            // 2. Generate PDF using new utility
            await downloadPharmacyBillPDF(savedBill);

            // 3. Update History
            await fetchBillHistory();

            // Reset form
            setBillItems([]);
            setSelectedPatientId('');
        } catch (error) {
            console.error("Bill Generation failed", error);
            toast({
                title: "Error",
                description: "Failed to generate bill",
                variant: "destructive"
            });
        }
    };

    const handlePrintBill = () => {
        if (!selectedPatient || billItems.length === 0) {
            toast({
                title: "Error",
                description: "Please select a patient and add items first.",
                variant: "destructive"
            });
            return;
        }

        // Map local state to Bill interface for print utility
        const billForPrint: any = {
            id: Math.random().toString(36).substr(2, 9),
            billNumber: `PH-${Date.now().toString().slice(-8)}`,
            patientId: selectedPatient.uhid,
            patient: {
                firstName: selectedPatient.full_name || 'N/A',
                lastName: '',
                phone: selectedPatient.phone
            },
            items: billItems.map(item => ({
                id: item.id,
                description: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total
            })),
            subtotal: subTotal,
            discount: totalDiscount,
            gstAmount: totalTax,
            grandTotal: totalAmount,
            status: 'PAID',
            createdAt: new Date().toISOString(),
            notes: 'Pharmacy Purchase'
        };

        printInvoice(billForPrint);
    };

    const handleDownloadHistory = async (bill: Bill) => {
        await downloadPharmacyBillPDF(bill);
    };

    const handlePrintHistory = (bill: Bill) => {
        printInvoice(bill);
    };

    return (
        <DashboardLayout role="pharmacist">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Pharmacy Billing</h1>
                    <p className="text-muted-foreground">Manage billing and view history</p>
                </div>

                <Tabs defaultValue="new-bill" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="new-bill">New Bill</TabsTrigger>
                        <TabsTrigger value="history">Bill History</TabsTrigger>
                    </TabsList>

                    {/* NEW BILL TAB */}
                    <TabsContent value="new-bill" className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Form */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Patient Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Patient Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Select Patient (Name or UHID)</Label>
                                            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select patient..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {patients.map(patient => (
                                                        <SelectItem key={patient.uhid} value={patient.uhid}>
                                                            {patient.full_name} ({patient.uhid})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {selectedPatient && (
                                            <div className="bg-muted/50 p-4 rounded-lg text-sm grid grid-cols-2 gap-2">
                                                <p><span className="font-semibold">Name:</span> {selectedPatient.full_name}</p>
                                                <p><span className="font-semibold">UHID:</span> {selectedPatient.uhid}</p>
                                                <p><span className="font-semibold">Phone:</span> {selectedPatient.phone}</p>
                                                <p><span className="font-semibold">Age/Gender:</span> {selectedPatient.age} / {selectedPatient.gender}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Medicine Selection */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle>Add Medicines</CardTitle>
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor="manual-mode" className="text-sm cursor-pointer">Manual Entry</Label>
                                            <Input
                                                id="manual-mode"
                                                type="checkbox"
                                                className="h-4 w-4"
                                                checked={isManualEntry}
                                                onChange={(e) => setIsManualEntry(e.target.checked)}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                            {isManualEntry ? (
                                                <>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label>Medicine Name</Label>
                                                        <Input
                                                            value={manualMedicineName}
                                                            onChange={(e) => setManualMedicineName(e.target.value)}
                                                            placeholder="Enter medicine name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Unit Price (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={manualMedicinePrice}
                                                            onChange={(e) => setManualMedicinePrice(e.target.value)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-2 md:col-span-2 flex flex-col">
                                                    <Label className="mb-2">Select Medicine</Label>
                                                    <Popover open={openMedicineCombobox} onOpenChange={setOpenMedicineCombobox}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={openMedicineCombobox}
                                                                className="w-full justify-between"
                                                            >
                                                                {selectedMedicineId
                                                                    ? medicines.find((med) => med.id === selectedMedicineId)?.name
                                                                    : "Search medicine..."}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[400px] p-0">
                                                            <Command>
                                                                <CommandInput placeholder="Search medicine..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No medicine found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {medicines.map((med) => (
                                                                            <CommandItem
                                                                                key={med.id}
                                                                                value={med.name}
                                                                                onSelect={() => {
                                                                                    if (med.id === selectedMedicineId) {
                                                                                        setSelectedMedicineId("");
                                                                                        setDiscount(0);
                                                                                    } else {
                                                                                        setSelectedMedicineId(med.id);
                                                                                        setDiscount(med.discount || 0);
                                                                                    }
                                                                                    setOpenMedicineCombobox(false);
                                                                                }}
                                                                                disabled={med.stock_quantity === 0}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        selectedMedicineId === med.id ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                <div className="flex flex-col">
                                                                                    <span>{med.name}</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        ₹{med.unit_price} | Stock: {med.stock_quantity}
                                                                                    </span>
                                                                                </div>
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Discount %</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>GST %</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={gst}
                                                    onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <Button className="w-full" onClick={handleAddItem} disabled={!isManualEntry && !selectedMedicineId}>
                                            <Plus className="mr-2 h-4 w-4" /> Add to Bill
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Bill Items Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bill Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Medicine</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right">Disc %</TableHead>
                                                    <TableHead className="text-right">GST %</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {billItems.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                            No items added
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    billItems.map(item => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                            <TableCell className="text-right">₹{item.unitPrice.toFixed(2)}</TableCell>
                                                            <TableCell className="text-right">{item.discount}%</TableCell>
                                                            <TableCell className="text-right">{item.gst}%</TableCell>
                                                            <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                                                            <TableCell>
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

                            {/* Right Column: Summary */}
                            <div className="space-y-6">
                                <Card className="sticky top-6">
                                    <CardHeader>
                                        <CardTitle>Bill Summary</CardTitle>
                                        <CardDescription>Review total and payment</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>₹{subTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Discount</span>
                                                <span>-₹{totalDiscount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">GST</span>
                                                <span>+₹{totalTax.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t pt-4 mt-4">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total</span>
                                                    <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4">
                                            <Button className="w-full" size="lg" onClick={handleSaveBill} disabled={billItems.length === 0}>
                                                <Save className="mr-2 h-4 w-4" /> Generate Bill
                                            </Button>
                                            <Button variant="outline" className="w-full" onClick={handlePrintBill} disabled={billItems.length === 0}>
                                                <Printer className="mr-2 h-4 w-4" /> Print Bill
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>Bill History</span>
                                    <Button variant="outline" size="sm" onClick={fetchBillHistory} disabled={loadingHistory}>
                                        {loadingHistory ? 'Refreshing...' : 'Refresh'}
                                    </Button>
                                </CardTitle>
                                <CardDescription>View and manage previously generated bills</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Bill #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Items</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {historyBills.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        {loadingHistory ? "Loading history..." : "No bill history found."}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                historyBills.map((bill) => (
                                                    <TableRow key={bill.id}>
                                                        <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-mono text-xs">{bill.billNumber}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{bill.patient?.firstName} {bill.patient?.lastName}</div>
                                                            <div className="text-xs text-muted-foreground">{bill.patient?.phone}</div>
                                                        </TableCell>
                                                        <TableCell>{bill.items?.length || 0} items</TableCell>
                                                        <TableCell className="text-right font-medium">₹{Number(bill.grandTotal).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <span className={cn(
                                                                "px-2 py-1 rounded-full text-xs font-medium",
                                                                bill.status === 'PAID' ? "bg-green-100 text-green-800" :
                                                                    bill.status === 'PENDING' ? "bg-yellow-100 text-yellow-800" :
                                                                        "bg-gray-100 text-gray-800"
                                                            )}>
                                                                {bill.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadHistory(bill)} title="Download PDF">
                                                                    <Download className="h-4 w-4" />
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
