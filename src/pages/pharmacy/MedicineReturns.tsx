import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw, Save, Trash2, Printer, CheckCircle2, AlertCircle, Loader2, Calendar, Filter } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { api } from "@/services/api";
import { normalizeResponse } from "@/utils/api-helpers";
import { API_BASE_URL } from "@/config/api";

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
    const [processing, setProcessing] = useState(false);

    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        search: '',
        startDate: '',
        endDate: ''
    });

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const url = `${API_BASE_URL.replace(/\/+$/, '')}/api/pharmacy/bills?search=${encodeURIComponent(searchQuery)}&format=returns`;
            const response = await api.getAxiosInstance().get(url) as any;

            // The interceptor already unwraps `{ status: 'success', data: ... }` OR returns the raw json if not wrapped.
            // Since getBills format=returns sends raw JSON `{ items: [...] }`, `response` IS that object.
            const items = response?.items || normalizeResponse(response);
            
            if (items.length === 0) {
                toast({
                    title: "No bill found",
                    description: "Could not find any bill matching your query.",
                    variant: "destructive"
                });
                setSelectedBill(null);
            } else {
                const bill = items[0];
                if (bill.items) {
                    bill.items = bill.items.filter((item: any) => item.medicine_id !== null);
                }
                setSelectedBill(bill);
                setReturnItems([]);
            }
        } catch (error) {
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

    const handleProcessReturn = async () => {
        if (returnItems.length === 0) return;

        setProcessing(true);
        try {
            const payload = {
                bill_id: selectedBill.id,
                patient_id: selectedBill.patient_id,
                refund_method: refundMethod,
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

    return (
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

                    {selectedBill && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                                    <div>
                                        <CardTitle className="text-xl">Bill Details: {selectedBill.billNumber}</CardTitle>
                                        <CardDescription className="text-base text-primary font-medium">Patient: {selectedBill.patientName || "Bill Patient"}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "px-3 py-1",
                                        selectedBill.status === 'PAID' ? "text-green-600 border-green-200 bg-green-50" : "text-primary border-primary bg-primary/5"
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
                                                            {item.batchNumber && (
                                                                <div className="text-[10px] text-muted-foreground font-mono">Batch: {item.batchNumber}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                                                        <TableCell>₹{item.total.toFixed(2)}</TableCell>
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
                                                            <span>Total Refund</span>
                                                            <span className="line-through">₹{selectedBill.grandTotal.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xl font-black text-primary">
                                                            <span>Refund Amt</span>
                                                            <span>₹{calculateRefund().toFixed(2)}</span>
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
                                            placeholder="Bill # or Patient..." 
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
                                        history.map((record) => (
                                            <TableRow key={record.id} className="hover:bg-muted/30">
                                                <TableCell className="font-medium">
                                                    {format(new Date(record.return_date || record.returnDate), 'dd MMM yyyy')}
                                                    <div className="text-[10px] text-muted-foreground">{format(new Date(record.return_date || record.returnDate), 'hh:mm a')}</div>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{record.bill?.bill_number || record.bill?.billNumber || "N/A"}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{record.patient?.firstName || record.patient?.first_name} {record.patient?.lastName || record.patient?.last_name}</div>
                                                    <div className="text-[10px] text-muted-foreground">UHID: {record.patient_id || record.patientId}</div>
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
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        // Future: Show details dialog
                                                        toast({ title: "Details Coming Soon", description: "Audit trail and medicine breakdown will be visible here." });
                                                    }}>
                                                        View Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
