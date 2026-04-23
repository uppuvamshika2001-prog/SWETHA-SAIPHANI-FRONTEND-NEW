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
import { FileText, Plus, Trash2, Loader2, Check, User } from "lucide-react";
import { patientService } from "@/services/patientService";
import { billingService } from "@/services/billingService";
import { Patient, LabTest } from "@/types";
import { Separator } from "@/components/ui/separator";
import { WalkInLabPatientDialog } from "@/components/patients/WalkInLabPatientDialog";
import { labService } from '@/services/labService';

const DEFAULT_LAB_PRICE = 500;
const CUSTOM_SERVICE_ID = "custom";
const LAB_CATALOG_ID = "LAB_CATALOG";

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
    const [patientSearch, setPatientSearch] = useState("");
    const [showPatientResults, setShowPatientResults] = useState(false);

    // Item State
    const [items, setItems] = useState<{ description: string, quantity: number, unitPrice: number, discount: number, total: number, type?: 'consultation' | 'lab', lab_order_id?: string }[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [itemDiscount, setItemDiscount] = useState("0");
    const [discount, setDiscount] = useState("0");
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customDescription, setCustomDescription] = useState("");
    
    // Lab Catalog State
    const [labCatalog, setLabCatalog] = useState<LabTest[]>([]);
    const [selectedLabTestId, setSelectedLabTestId] = useState("");
    const [isLabCatalogMode, setIsLabCatalogMode] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (showOpen) {
                fetchPatients(patientSearch);
                fetchLabCatalog();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [patientSearch, showOpen]);

    const fetchLabCatalog = async () => {
        try {
            const tests = await labService.getLabTests();
            setLabCatalog(tests || []);
        } catch (error) {
            console.error("Failed to fetch lab catalog", error);
        }
    };

    const fetchPatients = async (searchTerm: string = "") => {
        setLoadingPatients(true);
        try {
            const data = await patientService.getPatients({ search: searchTerm, limit: 50 });
            console.log("Search results:", data);
            setPatientList(Array.isArray(data) ? data : (data.items || []));
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patients");
        } finally {
            setLoadingPatients(false);
        }
    };

    // Combined Flow Logic
    const selectedPatient = patientList.find(p => p.uhid === patientId);
    const [patientSummary, setPatientSummary] = useState<any>(null);

    useEffect(() => {
        if (patientId) {
            fetchPatientSummary();
        } else {
            setPatientSummary(null);
            setServices([
                {
                    id: 'consultation',
                    label: "Consultation Fee",
                    value: "consultation",
                    price: 300,
                    type: "consultation",
                    description: "Consultation Fee"
                },
                {
                    id: LAB_CATALOG_ID,
                    label: "Lab Test",
                    value: LAB_CATALOG_ID,
                    price: 0,
                    type: "lab",
                    description: "Lab Test"
                },
                {
                    id: CUSTOM_SERVICE_ID,
                    label: "Other / Custom Service",
                    value: CUSTOM_SERVICE_ID,
                    price: 0,
                    type: "CUSTOM",
                    description: ""
                }
            ]);
        }
    }, [patientId]);

    const fetchPatientSummary = async () => {
        try {
            const response = await billingService.getPatientSummary(patientId);
            console.log("FULL RESPONSE:", response);

            // Flexible extraction as requested
            const labOrders = response.items || response.lab_orders || [];
            console.log("Lab Orders Extracted:", labOrders);

            const options = [
                {
                    id: 'consultation',
                    label: "Consultation Fee",
                    value: "consultation",
                    price: response.consultation?.fee || 300,
                    type: "consultation",
                    description: "Consultation Fee"
                },
                ...labOrders.map((order: any) => ({
                    id: `lab_${order.id}`,
                    label: order.testName || order.test_name || "Lab Test",
                    value: order.id,
                    price: order.price || 0,
                    type: "lab",
                    description: `Lab: ${order.testName || order.test_name || "Lab Test"}`,
                    lab_order_id: order.id
                })),
                {
                    id: LAB_CATALOG_ID,
                    label: "Lab Test",
                    value: LAB_CATALOG_ID,
                    price: 0,
                    type: "lab",
                    description: "Lab Test"
                },
                {
                    id: CUSTOM_SERVICE_ID,
                    label: "Other / Custom Service",
                    value: CUSTOM_SERVICE_ID,
                    price: 0,
                    type: "CUSTOM",
                    description: ""
                }
            ];

            setServices(options);
            console.log("Services:", options);
            setPatientSummary(response);
        } catch (error) {
            console.error("Failed to fetch patient summary", error);
            setPatientSummary(null);
            setServices([
                {
                    id: 'consultation',
                    label: "Consultation Fee",
                    value: "consultation",
                    price: 300,
                    type: "consultation",
                    description: "Consultation Fee"
                },
                {
                    id: LAB_CATALOG_ID,
                    label: "Lab Test",
                    value: LAB_CATALOG_ID,
                    price: 0,
                    type: "lab",
                    description: "Lab Test"
                },
                {
                    id: CUSTOM_SERVICE_ID,
                    label: "Other / Custom Service",
                    value: CUSTOM_SERVICE_ID,
                    price: 0,
                    type: "CUSTOM",
                    description: ""
                }
            ]);
        }
    };

    const summaryOptions = services;



    const handleAddItem = () => {
        if (!selectedServiceId || !unitPrice || !quantity) return;
        
        if (selectedServiceId === CUSTOM_SERVICE_ID && !customDescription.trim()) {
            toast.error("Please enter service description");
            return;
        }

        if (selectedServiceId === LAB_CATALOG_ID && !selectedLabTestId) {
            toast.error("Please select a lab test");
            return;
        }

        const qty = parseInt(quantity);
        const price = parseFloat(unitPrice);
        const itemDiscPercent = parseFloat(itemDiscount) || 0;

        if (qty <= 0 || price < 0 || itemDiscPercent < 0 || itemDiscPercent > 100) {
            toast.error("Invalid quantity, price or discount");
            return;
        }

        const opt = services.find(o => o.id === selectedServiceId);
        if (!opt) {
            toast.error("Invalid service selection");
            return;
        }

        // Prevent duplicate lab adding
       /* if (opt.type === 'lab' && items.some(i => i.lab_order_id === opt.lab_order_id)) {
            toast.error("This lab test is already in the bill.");
            return;
        } */

        const baseTotal = qty * price;
        const discAmount = (baseTotal * itemDiscPercent) / 100;
        const total = baseTotal - discAmount;
        const isSpecialMode = selectedServiceId === CUSTOM_SERVICE_ID || selectedServiceId === LAB_CATALOG_ID;
        const description = isSpecialMode ? customDescription : opt.description;

        setItems([...items, { 
            description, 
            quantity: qty, 
            unitPrice: price, 
            discount: itemDiscPercent,
            total,
            type: opt.type as any,
            lab_order_id: opt.lab_order_id
        }]);

        // Reset fields
        setSelectedServiceId("");
        setUnitPrice("");
        setQuantity("1");
        setItemDiscount("0");
        setIsCustomMode(false);
        setCustomDescription("");
        setIsLabCatalogMode(false);
        setSelectedLabTestId("");
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
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    type: item.type,
                    lab_order_id: item.lab_order_id
                })),
                discount: calculateDiscountAmount(),
                notes: calculateGST() > 0
                    ? `GST (18%): ₹${calculateGST().toFixed(2)} | Total with GST: ₹${calculateTotal().toFixed(2)}`
                    : `Total: ₹${calculateTotal().toFixed(2)}`,
                gstPercent: 0, // Explicitly set GST to 0 for Lab/OPD bills
                isWalkInLab: selectedPatient?.patient_type === 'WALKIN_LAB'
            } as any);

            toast.success("Bill generated successfully!");

            // Reset and close
            setPatientSearch("");
            setItems([]);
            setSelectedServiceId("");
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
                        <div className="flex items-center justify-between">
                            <Label htmlFor="patient" className="text-sm font-medium text-slate-700 dark:text-slate-300">Patient *</Label>
                            {!selectedPatient && (
                                <WalkInLabPatientDialog onPatientCreated={(patient) => {
                                    setPatientId(patient.uhid);
                                    setPatientSearch(`${patient.full_name} (${patient.uhid})`);
                                    setShowPatientResults(false);
                                }} />
                            )}
                        </div>

                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{selectedPatient.full_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedPatient.uhid} · {selectedPatient.phone}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setPatientId("");
                                    setPatientSearch("");
                                    setItems([]);
                                    setSelectedServiceId("");
                                }}>Change</Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Input
                                    id="patient"
                                    placeholder="Search patient by name or UHID..."
                                    value={patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setShowPatientResults(true);
                                        if (!e.target.value) {
                                            setPatientId("");
                                        }
                                    }}
                                    onFocus={() => setShowPatientResults(true)}
                                    className="h-11 border-slate-200 focus:ring-teal-500"
                                    disabled={loadingPatients}
                                    autoComplete="off"
                                />
                                {showPatientResults && patientSearch.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {(() => {
                                            const filtered = patientList;
                                            if (filtered.length === 0) {
                                                return (
                                                    <div className="px-4 py-3 text-sm text-center space-y-2">
                                                        <p className="text-slate-500">No patients found</p>
                                                        <WalkInLabPatientDialog onPatientCreated={(patient) => {
                                                            setPatientId(patient.uhid);
                                                            setPatientSearch(`${patient.full_name} (${patient.uhid})`);
                                                            setShowPatientResults(false);
                                                        }}>
                                                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                                                                + Register Walk-in Lab Patient
                                                            </button>
                                                        </WalkInLabPatientDialog>
                                                    </div>
                                                );
                                            }
                                            return filtered.map((p) => (
                                                <div
                                                    key={p.uhid}
                                                    className={`px-4 py-2.5 cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 last:border-b-0 ${patientId === p.uhid ? 'bg-teal-50 dark:bg-slate-800' : ''}`}
                                                    onClick={() => {
                                                        setPatientId(p.uhid);
                                                        setPatientSearch("");
                                                        setShowPatientResults(false);
                                                    }}
                                                >
                                                    {patientId === p.uhid && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{p.full_name}</span>
                                                        <span className="text-xs text-slate-500">{p.uhid}</span>
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator className="bg-slate-100 dark:bg-slate-800" />

                    {/* Add Item Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add Service / Test</h4>

                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="w-full md:w-1/3 space-y-1.5">
                                <Label htmlFor="desc" className="text-xs text-slate-500">Service Description</Label>
                                {isCustomMode ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter service name..."
                                            value={customDescription}
                                            onChange={(e) => setCustomDescription(e.target.value)}
                                            className="bg-white dark:bg-slate-950 h-9"
                                        />
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-9 px-2 text-xs"
                                            onClick={() => {
                                                setIsCustomMode(false);
                                                setSelectedServiceId("");
                                                setCustomDescription("");
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                ) : (
                                    <Select value={selectedServiceId} onValueChange={(val) => {
                                        setSelectedServiceId(val);
                                        if (val === CUSTOM_SERVICE_ID) {
                                            setIsCustomMode(true);
                                            setIsLabCatalogMode(false);
                                            setUnitPrice("");
                                            setQuantity("1");
                                            return;
                                        }
                                        if (val === LAB_CATALOG_ID) {
                                            setIsLabCatalogMode(true);
                                            setIsCustomMode(false);
                                            setUnitPrice("");
                                            setQuantity("1");
                                            setSelectedLabTestId("");
                                            return;
                                        }
                                        const opt = summaryOptions.find(o => o.id === val);
                                        if (opt) {
                                            setIsLabCatalogMode(false);
                                            setIsCustomMode(false);
                                            setUnitPrice(opt.price.toString());
                                            setQuantity("1");
                                        }
                                    }}>
                                        <SelectTrigger id="desc" className="bg-white dark:bg-slate-950 h-9 w-full">
                                            <SelectValue placeholder="Select service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {summaryOptions.map(opt => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {isLabCatalogMode && (
                                <div className="w-full md:w-1/3 space-y-1.5">
                                    <Label htmlFor="lab-test" className="text-xs text-slate-500">Select Lab Test</Label>
                                    <Select value={selectedLabTestId} onValueChange={(val) => {
                                        setSelectedLabTestId(val);
                                        const test = labCatalog.find(t => t.id === val);
                                        if (test) {
                                            setUnitPrice(test.price.toString());
                                            setCustomDescription(`Lab Test: ${test.name}`);
                                        }
                                    }}>
                                        <SelectTrigger id="lab-test" className="bg-white dark:bg-slate-950 h-9 w-full">
                                            <SelectValue placeholder="Chose test..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {labCatalog.map(test => (
                                                <SelectItem key={test.id} value={test.id}>
                                                    {test.name} {test.department ? `(${test.department})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
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
                            <div className="w-full md:w-24 space-y-1.5">
                                <Label htmlFor="item-discount" className="text-xs text-slate-500">Disc (%)</Label>
                                <Input
                                    id="item-discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={itemDiscount}
                                    onChange={(e) => setItemDiscount(e.target.value)}
                                    placeholder="0"
                                    className="bg-white dark:bg-slate-950 h-9 text-right"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <Button onClick={handleAddItem} size="sm" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 h-9 px-4">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden border-slate-200 dark:border-slate-800">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                <TableRow>
                                    <TableHead className="w-[35%] pl-4">Description</TableHead>
                                    <TableHead className="text-right w-[15%]">Qty</TableHead>
                                    <TableHead className="text-right w-[15%]">Price</TableHead>
                                    <TableHead className="text-right w-[15%]">Disc(%)</TableHead>
                                    <TableHead className="text-right w-[15%]">Total</TableHead>
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
                                            <TableCell className="text-right text-red-500">{item.discount}%</TableCell>
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
                                            id="discount"
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
