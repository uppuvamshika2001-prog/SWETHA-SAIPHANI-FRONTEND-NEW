import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, IndianRupee, TestTube2, Stethoscope, Microscope } from "lucide-react";
import { patientService } from "@/services/patientService";
import { billingService } from "@/services/billingService";
import { labService } from "@/services/labService";
import { Patient } from "@/types";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select";

const DEFAULT_LAB_PRICE = 500;

interface BillGenerationDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultTrigger?: boolean;
    onSuccess?: () => void;
}

export function BillGenerationDialog({
    children,
    open,
    onOpenChange,
    defaultTrigger = true,
    onSuccess
}: BillGenerationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOpen = isControlled ? open : internalOpen;
    const setShowOpen = isControlled ? onOpenChange : setInternalOpen;

    const [patientId, setPatientId] = useState("");
    const [patientList, setPatientList] = useState<Patient[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Item State
    const [items, setItems] = useState<{ description: string, quantity: number, unitPrice: number, total: number }[]>([]);
    const [description, setDescription] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [discount, setDiscount] = useState("0");

    // Manual Item State
    const [entryMode, setEntryMode] = useState<'service' | 'lab_multi'>('service');
    // Multi-Select Lab Tests
    const [selectedMultiLabTests, setSelectedMultiLabTests] = useState<string[]>([]);

    const [availableTests, setAvailableTests] = useState<any[]>([]);

    useEffect(() => {
        if (showOpen) {
            fetchPatients();
            fetchAvailableTests();
        }
    }, [showOpen]);

    const fetchAvailableTests = async () => {
        try {
            const tests = await labService.getLabTests();
            setAvailableTests(tests);
        } catch (error) {
            console.error("Failed to fetch lab tests", error);
        }
    };

    const fetchPatients = async () => {
        setLoadingPatients(true);
        try {
            const data = await patientService.getPatients();
            setPatientList(Array.isArray(data) ? data : (data.items || []));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patients");
        } finally {
            setLoadingPatients(false);
        }
    };

    // Lab Orders Logic
    const [pendingLabOrders, setPendingLabOrders] = useState<any[]>([]);
    const [selectedLabOrderIds, setSelectedLabOrderIds] = useState<string[]>([]);

    useEffect(() => {
        if (patientId) {
            fetchPendingLabOrders();
        } else {
            setPendingLabOrders([]);
        }
    }, [patientId]);

    const fetchPendingLabOrders = async () => {
        try {
            // Fetch 'ORDERED' or 'PAYMENT_PENDING' orders
            const orders = await labService.getLabOrders({ patientId, status: 'ORDERED' });
            setPendingLabOrders(orders);
        } catch (error) {
            console.error("Failed to fetch lab orders", error);
        }
    };

    const handleAddLabOrder = (order: any) => {
        if (selectedLabOrderIds.includes(order.id)) return;

        // Add to items
        const testNames = order.test_name;
        const description = `Lab: ${testNames} (Order #${order.order_id})`;

        // Determine price
        let amount = DEFAULT_LAB_PRICE;
        // Find matching test in catalog
        const matchingTest = availableTests.find(t =>
            t.name.toLowerCase() === testNames.toLowerCase() ||
            testNames.toLowerCase().includes(t.name.toLowerCase())
        );

        if (matchingTest) {
            amount = matchingTest.price;
        }


        setItems([...items, { description, quantity: 1, unitPrice: Number(amount), total: Number(amount) }]);
        setSelectedLabOrderIds([...selectedLabOrderIds, order.id]);

        toast.info("Lab order added. Please verify price.");
    };

    const handleAddMultiLabTests = () => {
        if (selectedMultiLabTests.length === 0) return;

        const newItems = [...items];
        let addedCount = 0;

        selectedMultiLabTests.forEach(testId => {
            const test = availableTests.find(t => t.id === testId);
            if (test) {
                const price = test.price;
                const description = `Lab: ${test.name}`;

                newItems.push({
                    description,
                    quantity: 1,
                    unitPrice: Number(price),
                    total: Number(price)
                });
                addedCount++;
            }
        });

        setItems(newItems);
        setSelectedMultiLabTests([]);
        toast.success(`Added ${addedCount} lab tests to bill.`);
    };

    const handleAddItem = () => {
        if (!description || !unitPrice || !quantity) return;
        const qty = parseInt(quantity);
        const price = parseFloat(unitPrice);

        if (qty <= 0 || price < 0) {
            toast.error("Invalid quantity or price");
            return;
        }

        const total = qty * price;
        setItems([...items, { description, quantity: qty, unitPrice: price, total }]);

        // Reset fields
        setDescription("");
        setUnitPrice("");
        setQuantity("1");
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.total, 0);
    };

    const calculateDiscountAmount = () => {
        const subtotal = calculateSubtotal();
        const percentage = parseFloat(discount) || 0;
        return (subtotal * percentage) / 100;
    };

    const calculateBaseAmount = () => {
        return calculateSubtotal() - calculateDiscountAmount();
    };

    // Check if bill contains lab services (no GST for lab bills)
    const isLabBill = () => {
        return items.some(item => item.description.toLowerCase().includes('lab'));
    };

    const calculateGST = () => {
        // GST removed for OPD/Lab bills as per requirement (Only Pharmacy has GST)
        return 0;
    };

    const calculateTotal = () => {
        return calculateBaseAmount() + calculateGST();
    };

    const handleGenerateBill = async () => {
        if (!patientId || items.length === 0) {
            toast.error("Please select a patient and add at least one item");
            return;
        }

        setSubmitting(true);
        try {
            await billingService.createBill({
                patientId,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                discount: calculateDiscountAmount(),
                notes: calculateGST() > 0
                    ? `GST (18%): ₹${calculateGST().toFixed(2)} | Total with GST: ₹${calculateTotal().toFixed(2)}`
                    : `Total: ₹${calculateTotal().toFixed(2)}`,
                gstPercent: 0, // Explicitly set GST to 0 for Lab/OPD bills
                labOrderIds: selectedLabOrderIds
            } as any);

            toast.success("Bill generated successfully!");

            // Reset and close
            setPatientId("");
            setItems([]);
            setSelectedLabOrderIds([]);
            if (setShowOpen) setShowOpen(false);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to generate bill");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={showOpen} onOpenChange={setShowOpen}>
            {defaultTrigger && (
                <DialogTrigger asChild>
                    {children || <Button className="bg-teal-600 hover:bg-teal-700 text-white"><FileText className="mr-2 h-4 w-4" /> Generate Bill</Button>}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teal-600" />
                        Generate OPD Bill
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Create a new invoice for outpatient services.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Patient Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="patient" className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Patient</Label>
                        <Select value={patientId} onValueChange={setPatientId} disabled={loadingPatients}>
                            <SelectTrigger id="patient" className="h-11 border-slate-200 focus:ring-teal-500">
                                <SelectValue placeholder={loadingPatients ? "Loading patients..." : "Search or select patient"} />
                            </SelectTrigger>
                            <SelectContent>
                                {patientList.map((p) => (
                                    <SelectItem key={p.uhid} value={p.uhid}>{p.full_name} ({p.uhid})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Pending Lab Orders */}
                    {pendingLabOrders.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Pending Lab Orders ({pendingLabOrders.length})
                            </h4>
                            <div className="space-y-2">
                                {pendingLabOrders.map(order => (
                                    <div key={order.id} className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded border border-blue-200 dark:border-blue-800">
                                        <div>
                                            <div className="font-medium text-sm">{order.order_id}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <span>{order.test_name}</span>
                                                <span className="font-semibold text-blue-600">
                                                    ₹{(() => {
                                                        const match = availableTests.find(t =>
                                                            t.name.toLowerCase() === order.test_name.toLowerCase() ||
                                                            order.test_name.toLowerCase().includes(t.name.toLowerCase())
                                                        );
                                                        return match ? match.price : DEFAULT_LAB_PRICE;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-blue-200 hover:bg-blue-50 text-blue-700"
                                            onClick={() => handleAddLabOrder(order)}
                                            disabled={selectedLabOrderIds.includes(order.id)}
                                        >
                                            {selectedLabOrderIds.includes(order.id) ? "Added" : "Add to Bill"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Item Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add Service / Test</h4>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            {/* Service Description - Always Visible */}
                            <div className="w-full md:w-1/3 space-y-1.5">
                                <Label htmlFor="desc" className="text-xs text-slate-500">Service Description</Label>
                                <Select value={description} onValueChange={(val) => {
                                    setDescription(val);
                                    if (val === "Lab Fee") {
                                        setEntryMode('lab_multi');
                                    } else {
                                        setEntryMode('service');
                                        if (val === "Consultation Fee") setUnitPrice("500");
                                        else setUnitPrice("");
                                    }
                                }}>
                                    <SelectTrigger id="desc" className="bg-white dark:bg-slate-950 h-9 w-full">
                                        <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Consultation Fee">Consultation Fee</SelectItem>
                                        <SelectItem value="Lab Fee">Lab Fee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {entryMode === 'service' ? (
                                <>
                                    <div className="w-full md:w-24 space-y-1.5">
                                        <Label htmlFor="qty" className="text-xs text-slate-500">Qty</Label>
                                        <Input
                                            id="qty"
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className="bg-white dark:bg-slate-950 h-9 text-right"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-1.5">
                                        <Label htmlFor="price" className="text-xs text-slate-500">Unit Price (₹)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="bg-white dark:bg-slate-950 h-9 text-right"
                                        />
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <Button onClick={handleAddItem} size="sm" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 h-9 px-4">
                                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1 space-y-1.5 w-full">
                                        <Label className="text-xs text-slate-500">Select Lab Tests (Multiple)</Label>
                                        <MultiSelect
                                            options={availableTests.map((test) => ({
                                                label: `${test.name} (₹${test.price})`,
                                                value: test.id
                                            }))}
                                            selected={selectedMultiLabTests}
                                            onChange={setSelectedMultiLabTests}
                                            placeholder="Select lab tests..."
                                            className="bg-white dark:bg-slate-950 w-full"
                                        />
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <Button
                                            onClick={handleAddMultiLabTests}
                                            disabled={selectedMultiLabTests.length === 0}
                                            size="sm"
                                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Items
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-slate-800">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                <TableRow>
                                    <TableHead className="w-[40%] pl-4">Description</TableHead>
                                    <TableHead className="text-right w-[15%]">Qty</TableHead>
                                    <TableHead className="text-right w-[20%]">Price</TableHead>
                                    <TableHead className="text-right w-[20%]">Total</TableHead>
                                    <TableHead className="w-[5%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500 text-sm italic">
                                            No items added yet. Add a service above.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <TableCell className="pl-4 font-medium text-slate-700 dark:text-slate-300">
                                                {item.description}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600">{item.quantity}</TableCell>
                                            <TableCell className="text-right text-slate-600">₹{Number(item.unitPrice).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium text-slate-900 dark:text-white">₹{Number(item.total).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleRemoveItem(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totals Section */}
                    {items.length > 0 && (
                        <div className="flex flex-col items-end gap-3 pt-2">
                            <div className="w-full max-w-[280px] space-y-3">
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-600 dark:text-slate-400">Discount%</span>
                                        <Input
                                            type="number"
                                            className="w-16 h-7 text-right text-xs px-2"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                    <span className="text-red-500 font-medium">- ₹{calculateDiscountAmount().toFixed(2)}</span>
                                </div>
                                <Separator className="my-1" />
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                    <span>Base Amount</span>
                                    <span className="font-medium">₹{calculateBaseAmount().toFixed(2)}</span>
                                </div>
                                {calculateGST() > 0 && (
                                    <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                        <span>GST (18%)</span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">+ ₹{calculateGST().toFixed(2)}</span>
                                    </div>
                                )}
                                <Separator className="my-1" />
                                <div className="flex justify-between items-center text-base font-bold text-slate-900 dark:text-white">
                                    <span>Grand Total</span>
                                    <span className="text-teal-700 dark:text-teal-400">
                                        ₹{calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
                    <Button variant="outline" onClick={() => setShowOpen(false)} className="mr-2">Cancel</Button>
                    <Button
                        onClick={handleGenerateBill}
                        disabled={submitting || items.length === 0 || !patientId}
                        className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]"
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
