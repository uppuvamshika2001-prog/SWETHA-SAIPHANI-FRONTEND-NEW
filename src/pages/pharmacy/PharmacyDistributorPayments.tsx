import { useState, useEffect } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, IndianRupee, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, Loader2, Plus } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Receipt } from "lucide-react";
import { AddPurchaseDialog } from "@/components/pharmacy/AddPurchaseDialog";

export default function DistributorPayments() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
    const [report, setReport] = useState<any>({
        stats: {
            totalAmount: 0,
            totalPaid: 0,
            totalBalance: 0,
            pendingCount: 0
        },
        pendingByDistributor: {}
    });
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        distributor: "",
        status: "ALL",
        searchTerm: ""
    });

    useEffect(() => {
        fetchData();
    }, [filters.status, filters.distributor]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [purchasesRes, reportRes] = await Promise.all([
                pharmacyService.getPurchases({
                    distributor: filters.distributor || undefined,
                    status: filters.status !== "ALL" ? filters.status : undefined
                }),
                pharmacyService.getDistributorReport()
            ]);
            
            console.log("Distributor Payments API:", { purchases: purchasesRes, report: reportRes });

            if (purchasesRes && purchasesRes.items) {
                setPurchases(purchasesRes.items);
            } else {
                setPurchases([]);
            }

            if (reportRes && reportRes.stats) {
                setReport(reportRes);
            } else {
                setReport({
                    stats: { totalAmount: 0, totalPaid: 0, totalBalance: 0, pendingCount: 0 },
                    pendingByDistributor: {}
                });
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load payment data");
            setPurchases([]);
            setReport({
                stats: { totalAmount: 0, totalPaid: 0, totalBalance: 0, pendingCount: 0 },
                pendingByDistributor: {}
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Paid</Badge>;
            case "PARTIALLY_PAID":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Partially Paid</Badge>;
            case "PENDING":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredPurchases = purchases.filter(p => 
        p.invoiceNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        p.distributorName?.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout role="pharmacist">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Distributor Payments</h1>
                        <p className="text-slate-500">Track and manage distributor invoices and payments</p>
                    </div>
                    <Button onClick={() => setIsAddPurchaseOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Purchase
                    </Button>
                </div>

                {report && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-white border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Purchase</p>
                                        <h3 className="text-2xl font-bold">₹{report?.stats?.totalAmount?.toLocaleString() ?? 0}</h3>
                                    </div>
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <IndianRupee className="h-5 w-5 text-blue-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-l-4 border-l-green-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Paid</p>
                                        <h3 className="text-2xl font-bold">₹{report?.stats?.totalPaid?.toLocaleString() ?? 0}</h3>
                                    </div>
                                    <div className="p-2 bg-green-50 rounded-lg">
                                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-l-4 border-l-red-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Balance</p>
                                        <h3 className="text-2xl font-bold">₹{report?.stats?.totalBalance?.toLocaleString() ?? 0}</h3>
                                    </div>
                                    <div className="p-2 bg-red-50 rounded-lg">
                                        <ArrowDownRight className="h-5 w-5 text-red-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-l-4 border-l-purple-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Pending Invoices</p>
                                        <h3 className="text-2xl font-bold">{report?.stats?.pendingCount ?? 0}</h3>
                                    </div>
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-purple-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
                        <TabsTrigger value="history">Purchase History</TabsTrigger>
                        <TabsTrigger value="report">Distributor Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-lg">Purchase Transactions</CardTitle>
                                        <CardDescription>View all medicine purchase records</CardDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search invoice or distributor..."
                                                className="pl-9 w-[250px]"
                                                value={filters.searchTerm}
                                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                            />
                                        </div>
                                        <Select 
                                            value={filters.status} 
                                            onValueChange={(v) => setFilters({ ...filters, status: v })}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Status</SelectItem>
                                                <SelectItem value="PAID">Paid</SelectItem>
                                                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" onClick={fetchData}>
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead>Invoice #</TableHead>
                                                <TableHead>Distributor</TableHead>
                                                <TableHead>Purchase Date</TableHead>
                                                <TableHead className="text-right">Total Amount</TableHead>
                                                <TableHead className="text-right">Paid</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : filteredPurchases.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                                        No purchase records found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredPurchases.map((purchase) => (
                                                    <TableRow key={purchase.id}>
                                                        <TableCell className="font-medium text-purple-700">{purchase.invoiceNumber}</TableCell>
                                                        <TableCell>{purchase.distributorName}</TableCell>
                                                        <TableCell>{format(new Date(purchase.purchaseDate), "dd MMM yyyy")}</TableCell>
                                                        <TableCell className="text-right">₹{(purchase.totalAmount || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-green-600">₹{(purchase.amountPaid || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-red-600 font-semibold">₹{(purchase.balanceAmount || 0).toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">{getStatusBadge(purchase.paymentStatus)}</TableCell>
                                                                                                                 <TableCell className="text-center">
                                                             {purchase.paymentStatus !== "PAID" && (
                                                                 <RecordPaymentDialog 
                                                                     purchase={purchase} 
                                                                     onSuccess={fetchData} 
                                                                 />
                                                             )}
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

                    <TabsContent value="report">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Outstanding Distributor Dues</CardTitle>
                                <CardDescription>Summary of pending payments grouped by distributor</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>Distributor Name</TableHead>
                                                <TableHead className="text-center">Invoices</TableHead>
                                                <TableHead className="text-right">Total Outstanding</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : (!report || !report.pendingByDistributor || Object.keys(report.pendingByDistributor).length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                                        No outstanding payments
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                Object.entries(report.pendingByDistributor).map(([name, data]: [string, any]) => (
                                                    <TableRow key={name}>
                                                        <TableCell className="font-medium">{name}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="secondary">{data.count || 0}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-red-600">
                                                            ₹{(data.totalBalance || 0).toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, distributor: name, status: "PENDING" })}>
                                                                <Filter className="h-3.5 w-3.5 mr-1" />
                                                                Filter
                                                            </Button>
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

function RecordPaymentDialog({ purchase, onSuccess }: { purchase: any, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: purchase.balanceAmount.toString(),
        paymentMethod: "Cash",
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ""
    });

    const handleSubmit = async () => {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > purchase.balanceAmount) {
            toast.error(`Amount cannot exceed balance (₹${purchase.balanceAmount})`);
            return;
        }

        try {
            setIsLoading(true);
            await pharmacyService.recordPayment(purchase.id, {
                purchaseId: purchase.id,
                amount,
                paymentMethod: formData.paymentMethod,
                paymentDate: formData.paymentDate,
                notes: formData.notes
            });
            toast.success("Payment recorded successfully");
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error("Failed to record payment:", error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => setOpen(true)}>
                <Receipt className="h-4 w-4 mr-1" />
                Pay
            </Button>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Payment for Invoice #{purchase.invoiceNumber} (Distributor: {purchase.distributorName})
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-slate-500 uppercase">Total Amount</span>
                            <span className="font-semibold text-slate-700">₹{Number(purchase.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 uppercase">Current Balance</span>
                            <span className="font-bold text-red-600">₹{Number(purchase.balanceAmount).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount to Pay (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select
                            value={formData.paymentMethod}
                            onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI/Online</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date">Payment Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.paymentDate}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            placeholder="e.g. Transaction ID or check number"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirm Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
