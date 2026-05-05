import { DashboardLayout } from "@/components/layout/DashboardLayout";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw, Save, Trash2, Printer, CheckCircle2, AlertCircle, Loader2, Calendar, Filter, ChevronLeft, ChevronRight, X, Package } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { api } from "@/services/api";
import { normalizeResponse } from "@/utils/api-helpers";
import { API_BASE_URL } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RETURN_REASONS = [
    "Wrong Medicine",
    "Prescription Changed",
    "Damaged Strip",
    "Patient Not Required",
    "Other"
];

const REFUND_METHODS = [
    { value: "CASH", label: "Cash Refund" },
    { value: "UPI", label: "UPI Refund" },
    { value: "WALLET", label: "Patient Wallet" },
    { value: "REPLACEMENT", label: "Replacement" }
];

export default function MedicineReturns() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [refundMethod, setRefundMethod] = useState('CASH');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);

    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        search: '',
        startDate: '',
        endDate: ''
    });
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedReturn, setSelectedReturn] = useState<any>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await pharmacyService.getReturns(historyFilters);
            setHistory(normalizeResponse(data));
        } catch (error) {
            console.error("Failed to fetch return history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Auto-fetch history when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory();
        }, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [historyFilters.search, historyFilters.startDate, historyFilters.endDate]);

    // Reset page when filters change
    useEffect(() => {
        setHistoryPage(1);
    }, [historyFilters.search, historyFilters.startDate, historyFilters.endDate]);

    // Pagination calculations
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const paginatedHistory = history.slice(
        (historyPage - 1) * itemsPerPage,
        historyPage * itemsPerPage
    );

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (historyPage > 3) pages.push('...');
            for (let i = Math.max(2, historyPage - 1); i <= Math.min(totalPages - 1, historyPage + 1); i++) {
                pages.push(i);
            }
            if (historyPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const selectBill = (bill: any) => {
        if (bill.items) {
            // Filter out non-medicine items if any (legacy check)
            bill.items = bill.items.filter((item: any) => 
                (item.medicine_id !== null && item.medicine_id !== undefined) || 
                (item.medicineId !== null && item.medicineId !== undefined)
            );
        }
        setSelectedBill(bill);
        setSearchResults([]);
        setReturnItems([]);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        setSearchResults([]);
        try {
            const data = await pharmacyService.getBills({ 
                search: searchQuery, 
                format: 'returns' 
            });

            const items = normalizeResponse(data);
            
            if (items.length === 0) {
                toast({
                    title: "No bill found",
                    description: "Could not find any bill matching your query.",
                    variant: "destructive"
                });
                setSelectedBill(null);
            } else if (items.length === 1) {
                selectBill(items[0]);
            } else {
                setSearchResults(items);
                setSelectedBill(null);
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast({
                title: "Search failed",
                description: "There was an error searching for the bill.",
                variant: "destructive"
            });
        } finally {
            setSearching(false);
        }
    };

    const toggleReturnItem = (item: any) => {
        const existing = returnItems.find(ri => ri.id === item.id);
        if (existing) {
            setReturnItems(returnItems.filter(ri => ri.id !== item.id));
        } else {
            setReturnItems([...returnItems, {
                ...item,
                returnQty: 1,
                reason: "Patient Not Required"
            }]);
        }
    };

    const updateReturnQty = (id: string, qty: number, max: number) => {
        if (qty < 1) qty = 1;
        if (qty > max) qty = max;
        setReturnItems(returnItems.map(item => 
            item.id === id ? { ...item, returnQty: qty } : item
        ));
    };

    const updateReturnReason = (id: string, reason: string) => {
        setReturnItems(returnItems.map(item => 
            item.id === id ? { ...item, reason } : item
        ));
    };

    const calculateRefund = () => {
        return returnItems.reduce((sum, item) => sum + (item.returnQty * item.unit_price), 0);
    };

    const getRefundDetails = () => {
        const subtotal = returnItems.reduce((sum, item) => sum + (item.returnQty * item.unit_price), 0);
        return { subtotal, gstAmount: 0, total: subtotal };
    };

    const handleProcessReturn = async () => {
        if (returnItems.length === 0) return;

        setProcessing(true);
        try {
            const payload = {
                bill_id: selectedBill.id,
                patient_id: selectedBill.patient_id,
                refund_method: refundMethod,
                gst_percent: 0,
                items: returnItems.map(item => ({
                    medicine_id: item.medicine_id,
                    batch_number: item.batch_number || null,
                    return_qty: item.returnQty,
                    selling_price: item.unit_price,
                    reason: item.reason
                }))
            };

            await pharmacyService.processReturn(payload);

            toast({
                title: "Return processed",
                description: `Successfully processed return for ₹${calculateRefund().toFixed(2)}`,
            });

            // Reset state
            setSelectedBill(null);
            setReturnItems([]);
            setSearchQuery('');
            fetchHistory(); // Refresh history
        } catch (error: any) {
            toast({
                title: "Return failed",
                description: error.response?.data?.message || "Failed to process return.",
                variant: "destructive"
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteReturn = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this return? This will reverse the stock changes.")) return;

        try {
            await pharmacyService.deleteReturn(id);
            toast({
                title: "Return deleted",
                description: "Successfully deleted return and reversed stock."
            });
            fetchHistory();
        } catch (error: any) {
            toast({
                title: "Failed to delete return",
                description: error.response?.data?.message || "There was an error deleting the return.",
                variant: "destructive"
            });
        }
    };

    return (
        <DashboardLayout role="pharmacist">
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Medicine Returns</h1>
                    <p className="text-muted-foreground">Process and track patient medicine returns</p>
                </div>
            </div>

            <Tabs defaultValue="return" className="space-y-6">
                <TabsList className="bg-muted p-1 rounded-lg">
                    <TabsTrigger value="return" className="px-6 py-2 rounded-md transition-all duration-200">
                        Process Return
                    </TabsTrigger>
                    <TabsTrigger value="history" className="px-6 py-2 rounded-md transition-all duration-200" onClick={fetchHistory}>
                        Return History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="return" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Bill</CardTitle>
                            <CardDescription>Enter Invoice Number, Patient Name, or Phone</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="flex gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Invoice # or Patient Details..." 
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={searching}>
                                    {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    Search Bill
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {searchResults.length > 0 && (
                        <Card className="animate-in fade-in slide-in-from-top-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Search Results ({searchResults.length})</CardTitle>
                                <CardDescription>Multiple bills found. Please select one.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Bill Date</TableHead>
                                                <TableHead>Bill #</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {searchResults.map((bill) => (
                                                <TableRow key={bill.id}>
                                                    <TableCell>{format(new Date(bill.created_at || bill.createdAt), 'dd MMM yyyy')}</TableCell>
                                                    <TableCell className="font-mono text-xs font-bold">{bill.bill_number || bill.billNumber}</TableCell>
                                                    <TableCell>
                                                        {bill.patient ? (
                                                            `${bill.patient.first_name || bill.patient.firstName} ${bill.patient.last_name || bill.patient.lastName}`
                                                        ) : (
                                                            bill.customer_name || bill.customerName || "Walk-in"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-bold">₹{Number(bill.grand_total || bill.grandTotal || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" onClick={() => selectBill(bill)}>Select</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedBill && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                                    <div>
                                        <CardTitle className="text-xl">Bill Details: {selectedBill.bill_number || selectedBill.billNumber}</CardTitle>
                                        <CardDescription className="text-base text-primary font-medium">
                                            Patient: {selectedBill.patient 
                                                ? `${selectedBill.patient.first_name || selectedBill.patient.firstName} ${selectedBill.patient.last_name || selectedBill.patient.lastName}` 
                                                : (selectedBill.customer_name || selectedBill.customerName || "Walk-in Patient")}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "px-3 py-1",
                                        (selectedBill.status === 'PAID' || (selectedBill.status as any) === 'paid') ? "text-green-600 border-green-200 bg-green-50" : "text-primary border-primary bg-primary/5"
                                    )}>
                                        {selectedBill.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead>Qty Sold</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedBill.items.map((item: any) => {
                                                const isReturning = returnItems.some(ri => ri.id === item.id);
                                                return (
                                                    <TableRow key={item.id} className={cn(isReturning && "bg-muted/50")}>
                                                        <TableCell className="font-medium">
                                                            <div>{item.description}</div>
                                                            {(item.batch_number || item.batchNumber) && (
                                                                <div className="text-[10px] text-muted-foreground font-mono">Batch: {item.batch_number || item.batchNumber}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>₹{Number(item.unit_price || item.unitPrice || 0).toFixed(2)}</TableCell>
                                                        <TableCell>₹{Number(item.total || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button 
                                                                variant={isReturning ? "destructive" : "outline"}
                                                                size="sm"
                                                                onClick={() => toggleReturnItem(item)}
                                                            >
                                                                {isReturning ? <RotateCcw className="h-4 w-4 mr-1" /> : "Return"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="border-primary/20 shadow-lg">
                                    <CardHeader className="bg-primary/5 border-b">
                                        <CardTitle className="text-lg">Return Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        {returnItems.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                                                <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-30" />
                                                <p className="text-sm text-muted-foreground">Select items from the bill to return</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                    {returnItems.map(item => (
                                                        <div key={item.id} className="p-3 border rounded-lg space-y-3 bg-card hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between font-bold text-sm">
                                                                <span className="truncate flex-1">{item.description}</span>
                                                                <span className="text-primary ml-2">₹{(item.returnQty * item.unit_price).toFixed(2)}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Qty (Max: {item.quantity})</Label>
                                                                    <Input 
                                                                        type="number" 
                                                                        className="h-8 text-xs"
                                                                        value={item.returnQty}
                                                                        onChange={(e) => updateReturnQty(item.id, parseInt(e.target.value), item.quantity)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Reason</Label>
                                                                    <Select 
                                                                        value={item.reason} 
                                                                        onValueChange={(val) => updateReturnReason(item.id, val)}
                                                                    >
                                                                        <SelectTrigger className="h-8 text-[11px]">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {RETURN_REASONS.map(r => (
                                                                                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="w-full h-7 text-xs text-destructive hover:bg-destructive/10"
                                                                onClick={() => toggleReturnItem(item)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-4 border-t space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm text-muted-foreground">Refund Method</Label>
                                                        <Select value={refundMethod} onValueChange={setRefundMethod}>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {REFUND_METHODS.map(m => (
                                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                                                            <span>Subtotal (Base)</span>
                                                            <span>₹{getRefundDetails().subtotal.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3 border-t pt-2">
                                                            <span>Original Bill Total</span>
                                                            <span className="line-through">₹ {Number(selectedBill.grand_total || selectedBill.grandTotal || 0).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xl font-black text-primary">
                                                            <span>Refund Amt</span>
                                                            <span>₹{getRefundDetails().total.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        className="w-full shadow-lg h-12 text-base font-bold" 
                                                        size="lg"
                                                        disabled={processing}
                                                        onClick={handleProcessReturn}
                                                    >
                                                        {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                        Confirm & Process Refund
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Return History Filters</CardTitle>
                            <CardDescription>View past medicine returns and refunds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Bill No or Patient Name..." 
                                            className="pl-10"
                                            value={historyFilters.search}
                                            onChange={(e) => setHistoryFilters({...historyFilters, search: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input 
                                        type="date" 
                                        value={historyFilters.startDate}
                                        onChange={(e) => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input 
                                        type="date" 
                                        value={historyFilters.endDate}
                                        onChange={(e) => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button className="flex-1" onClick={fetchHistory}>
                                        <Filter className="mr-2 h-4 w-4" /> Filter
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => {
                                        setHistoryFilters({ search: '', startDate: '', endDate: '' });
                                        setTimeout(fetchHistory, 0);
                                    }}>
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Bill No</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Qty Returned</TableHead>
                                        <TableHead>Refund Amt</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                                <p className="mt-2 text-sm text-muted-foreground font-medium">Loading return history...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : history.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
                                                <p className="text-base font-semibold text-muted-foreground">No return history found</p>
                                                <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedHistory.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">
                                                    {format(new Date(record.return_date || record.returnDate), 'dd MMM yyyy')}
                                                    <div className="text-[10px] text-muted-foreground">{format(new Date(record.return_date || record.returnDate), 'hh:mm a')}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{record.bill?.bill_number || record.bill?.billNumber || "N/A"}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{record.patient?.firstName || record.patient?.first_name} {record.patient?.lastName || record.patient?.last_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">UHID: {record.patient?.uhid || record.patient_id || record.patientId}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-bold">
                                                        {record.items?.reduce((sum: number, i: any) => sum + (i.return_qty || i.returnQty || 0), 0)} Items
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-primary font-black">₹{Number(record.refund_amount || record.refundAmount || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold">
                                                        {record.refund_method || record.refundMethod}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => setSelectedReturn(record)}>
                                                        View Details
                                                    </Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteReturn(record.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                        {/* Pagination Controls */}
                        {!historyLoading && history.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 mt-2">
                                <div className="text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{Math.min(history.length, (historyPage - 1) * itemsPerPage + 1)}</span> to{" "}
                                    <span className="font-semibold text-foreground">{Math.min(history.length, historyPage * itemsPerPage)}</span> of{" "}
                                    <span className="font-semibold text-foreground">{history.length}</span> entries
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                        disabled={historyPage === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="flex items-center gap-1 mx-2">
                                        {getPageNumbers().map((page, index) => (
                                            typeof page === 'number' ? (
                                                <Button
                                                    key={index}
                                                    variant={historyPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setHistoryPage(page)}
                                                    className={`h-8 w-8 p-0 ${historyPage === page ? 'bg-primary hover:bg-primary/90' : ''}`}
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
                                        onClick={() => setHistoryPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={historyPage === totalPages}
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
        </div>

            {/* Return Details Dialog */}
            <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="h-5 w-5 text-primary" />
                            Return Details
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReturn && (
                        <div className="space-y-5">
                            {/* Return Info */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground">Bill No</p>
                                    <p className="font-mono font-bold text-sm">{selectedReturn.bill?.bill_number || selectedReturn.bill?.billNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Return Date</p>
                                    <p className="font-semibold text-sm">{format(new Date(selectedReturn.return_date || selectedReturn.returnDate), 'dd MMM yyyy, hh:mm a')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Patient</p>
                                    <p className="font-semibold text-sm">
                                        {selectedReturn.patient?.firstName || selectedReturn.patient?.first_name}{' '}
                                        {selectedReturn.patient?.lastName || selectedReturn.patient?.last_name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">UHID: {selectedReturn.patient?.uhid || selectedReturn.patient_id || selectedReturn.patientId}</p>
                                </div>
                            </div>

                            {/* Returned Items Table */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Returned Medicines</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead className="text-center">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead>Reason</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(selectedReturn.items || []).map((item: any, idx: number) => {
                                                const qty = item.return_qty || item.returnQty || item.quantity || 0;
                                                const price = Number(item.selling_price || item.sellingPrice || item.sale_price || item.salePrice || item.unit_price || item.unitPrice || 0);
                                                return (
                                                    <TableRow key={item.id || idx}>
                                                        <TableCell className="font-medium">
                                                            {item.medicine_name || item.medicine?.name || item.medicineName || item.description || 'Medicine'}
                                                            {(item.batch_number || item.batchNumber) && (
                                                                <div className="text-[10px] text-muted-foreground font-mono">Batch: {item.batch_number || item.batchNumber}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center font-bold">{qty}</TableCell>
                                                        <TableCell className="text-right">₹{price.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">₹{(qty * price).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-[10px]">{item.reason || 'N/A'}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {(!selectedReturn.items || selectedReturn.items.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No item details available</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Refund Summary */}
                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Subtotal (Base)</span>
                                    <span className="font-semibold">₹{(Number(selectedReturn.refund_amount || selectedReturn.refundAmount || 0) - Number(selectedReturn.gst_amount || selectedReturn.gstAmount || 0)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Refund</p>
                                        <p className="text-2xl font-black text-primary">₹{Number(selectedReturn.refund_amount || selectedReturn.refundAmount || 0).toFixed(2)}</p>
                                    </div>
                                    <Badge className="px-4 py-2 text-sm font-bold">{selectedReturn.refund_method || selectedReturn.refundMethod}</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

         </DashboardLayout>
    );
}
