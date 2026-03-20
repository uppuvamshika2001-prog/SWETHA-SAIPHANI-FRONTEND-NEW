import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RotateCcw, Save, Trash2, Printer, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import axios from "axios";

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const url = `${import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:5000'}/api/pharmacy/bills?search=${encodeURIComponent(searchQuery)}&format=returns`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
            });

            // CRITICAL REQUIREMENT LOGIC
            const items = response.data.items || [];
            
            if (items.length === 0) {
                toast({
                    title: "No bill found",
                    description: "Could not find any bill matching your query.",
                    variant: "destructive"
                });
                setSelectedBill(null);
            } else {
                setSelectedBill(items[0]);
                setReturnItems([]); // Reset return items
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
        return returnItems.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);
    };

    const handleProcessReturn = async () => {
        if (returnItems.length === 0) return;

        setProcessing(true);
        try {
            const payload = {
                billId: selectedBill.id,
                patientId: selectedBill.patientId,
                refundMethod,
                items: returnItems.map(item => ({
                    medicineId: item.medicineId,
                    batchNumber: item.batchNumber || null,
                    returnQty: item.returnQty,
                    salePrice: item.unitPrice,
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
                    <p className="text-muted-foreground">Process patient medicine returns and refunds</p>
                </div>
            </div>

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Bill Items: {selectedBill.billNumber}</CardTitle>
                                <CardDescription>Patient: {selectedBill.patientName || "Loading..."}</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary">
                                {selectedBill.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
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
                                                    {item.description}
                                                    {item.batchNumber && (
                                                        <div className="text-xs text-muted-foreground">Batch: {item.batchNumber}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Return Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {returnItems.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                        <RotateCcw className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-xs text-muted-foreground">Select items to return</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {returnItems.map(item => (
                                            <div key={item.id} className="p-3 border rounded-lg space-y-2">
                                                <div className="flex justify-between font-medium">
                                                    <span className="truncate">{item.description}</span>
                                                    <span>₹{(item.returnQty * item.unitPrice).toFixed(2)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <Label className="text-[10px]">Qty</Label>
                                                        <Input 
                                                            type="number" 
                                                            size={1}
                                                            className="h-8 py-1 px-2"
                                                            value={item.returnQty}
                                                            onChange={(e) => updateReturnQty(item.id, parseInt(e.target.value), item.quantity)}
                                                        />
                                                    </div>
                                                    <div className="flex-[2]">
                                                        <Label className="text-[10px]">Reason</Label>
                                                        <Select 
                                                            value={item.reason} 
                                                            onValueChange={(val) => updateReturnReason(item.id, val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {RETURN_REASONS.map(r => (
                                                                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="mt-4 h-8 w-8 text-destructive"
                                                        onClick={() => toggleReturnItem(item)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="pt-4 border-t space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label>Refund Method</Label>
                                                <Select value={refundMethod} onValueChange={setRefundMethod}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {REFUND_METHODS.map(m => (
                                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold pt-2">
                                                <span>Total Refund</span>
                                                <span className="text-primary">₹{calculateRefund().toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <Button 
                                            className="w-full" 
                                            size="lg"
                                            disabled={processing}
                                            onClick={handleProcessReturn}
                                        >
                                            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Process Refund
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
