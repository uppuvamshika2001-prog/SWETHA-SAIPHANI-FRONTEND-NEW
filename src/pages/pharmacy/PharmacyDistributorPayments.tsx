import { useState, useEffect } from "react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, IndianRupee, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DistributorPayments() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [report, setReport] = useState<any>(null);
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
            
            setPurchases(purchasesRes.items || []);
            setReport(reportRes);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load payment data");
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
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Distributor Payments</h1>
                    <p className="text-slate-500">Track and manage distributor invoices and payments</p>
                </div>

                {report && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-white border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Purchase</p>
                                        <h3 className="text-2xl font-bold">₹{report.stats.totalAmount.toLocaleString()}</h3>
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
                                        <h3 className="text-2xl font-bold">₹{report.stats.totalPaid.toLocaleString()}</h3>
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
                                        <h3 className="text-2xl font-bold">₹{report.stats.totalBalance.toLocaleString()}</h3>
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
                                        <h3 className="text-2xl font-bold">{report.stats.pendingCount}</h3>
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
                                                <TableHead>Method</TableHead>
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
                                                        <TableCell className="text-right">₹{purchase.totalAmount.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-green-600">₹{purchase.amountPaid.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-red-600 font-semibold">₹{purchase.balanceAmount.toFixed(2)}</TableCell>
                                                        <TableCell className="text-center">{getStatusBadge(purchase.paymentStatus)}</TableCell>
                                                        <TableCell>{purchase.paymentMethod}</TableCell>
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
                                            ) : (!report || Object.keys(report.pendingByDistributor).length === 0) ? (
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
                                                            <Badge variant="secondary">{data.count}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-red-600">
                                                            ₹{data.totalBalance.toFixed(2)}
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
