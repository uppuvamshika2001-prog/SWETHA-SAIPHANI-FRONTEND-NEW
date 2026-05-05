import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, Search, Clock, CheckCircle, RotateCcw, Loader2, FileText, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLab, LabOrder } from "@/contexts/LabContext";
import { useNavigate } from "react-router-dom";
import { LabResultDetailsDialog } from "@/components/lab/LabResultDetailsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { DatePicker } from "@/components/ui/date-picker";
import { format, subDays } from "date-fns";

const LabPendingTests = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const navigate = useNavigate();

    const { labOrders, loading, fetchLabOrders, updateOrderStatus, deleteLabOrder } = useLab();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [completedPage, setCompletedPage] = useState(1);
    // Increased to 10 to show more by default, or they can use pagination
    const ITEMS_PER_PAGE = 10;

    // Fetch whenever the selected date changes
    useEffect(() => {
        fetchLabOrders(undefined, selectedDate);
    }, [fetchLabOrders, selectedDate]);

    // Filter for pending orders
    const pendingOrders = labOrders.filter(order =>
        (order.status === 'ORDERED' || order.status === 'READY_FOR_SAMPLE_COLLECTION' || order.status === 'SAMPLE_COLLECTED' || order.status === 'IN_PROGRESS')
    ).filter(order =>
        `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.testName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter for completed orders
    const completedOrders = labOrders.filter(order =>
        order.status === 'COMPLETED'
    ).filter(order =>
        `${order.patient.firstName} ${order.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.testName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(pendingOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedOrders = pendingOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Pagination calculations for Completed Tests
    const totalCompletedPages = Math.ceil(completedOrders.length / ITEMS_PER_PAGE);
    const startCompletedIndex = (completedPage - 1) * ITEMS_PER_PAGE;
    const paginatedCompletedOrders = completedOrders.slice(startCompletedIndex, startCompletedIndex + ITEMS_PER_PAGE);

    // Reset to page 1 when search term or date changes
    useEffect(() => {
        setCurrentPage(1);
        setCompletedPage(1);
    }, [searchTerm, selectedDate]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'stat': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getNextStatus = (currentStatus: string): string | null => {
        switch (currentStatus) {
            case 'ORDERED': return 'PAYMENT_PENDING';
            case 'PAYMENT_PENDING': return null; // Payment must be confirmed by reception
            case 'READY_FOR_SAMPLE_COLLECTION': return 'SAMPLE_COLLECTED';
            case 'SAMPLE_COLLECTED': return 'IN_PROGRESS';
            case 'IN_PROGRESS': return null; // Need to go to results entry
            default: return null;
        }
    };

    const getNextActionLabel = (currentStatus: string): string => {
        switch (currentStatus) {
            case 'ORDERED': return 'Mark for Billing';
            case 'PAYMENT_PENDING': return 'Awaiting Payment';
            case 'READY_FOR_SAMPLE_COLLECTION': return 'Collect Sample';
            case 'SAMPLE_COLLECTED': return 'Start Processing';
            case 'IN_PROGRESS': return 'Enter Results';
            default: return 'View';
        }
    };

    const handleUpdateStatus = async (order: LabOrder) => {
        const nextStatus = getNextStatus(order.status);

        if (!nextStatus) {
            // Navigate to results entry
            navigate(`/lab/results-entry?orderId=${order.id}`);
            return;
        }

        setUpdatingId(order.id);
        try {
            await updateOrderStatus(order.id, nextStatus);
            toast.success(`Order status updated to ${nextStatus.replace('_', ' ')}`);
            // Refetch with current date filter to prevent showing all orders if filtered
            fetchLabOrders(undefined, selectedDate);
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to permanently delete this lab order? This action cannot be undone.")) return;

        try {
            await deleteLabOrder(orderId);
            toast.success("Lab order deleted successfully");
            fetchLabOrders(undefined, selectedDate);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete lab order");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ORDERED': return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200">Ordered</Badge>;
            case 'PAYMENT_PENDING': return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Payment Pending</Badge>;
            case 'READY_FOR_SAMPLE_COLLECTION': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Ready for Collection</Badge>;
            case 'SAMPLE_COLLECTED': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Sample Collected</Badge>;
            case 'IN_PROGRESS': return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Processing</Badge>;
            case 'COMPLETED': return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Completed</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout role="lab_technician">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pending Tests</h1>
                        <p className="text-muted-foreground mt-1">Manage and track pending laboratory test orders</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-slate-100 p-1 rounded-md">
                            <Button 
                                variant={selectedDate === undefined ? "secondary" : "ghost"}
                                size="sm" 
                                className="text-xs h-8 px-3"
                                onClick={() => setSelectedDate(undefined)}
                            >
                                All Time
                            </Button>
                            <Button 
                                variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? "secondary" : "ghost"}
                                size="sm" 
                                className="text-xs h-8 px-3"
                                onClick={() => setSelectedDate(new Date())}
                            >
                                Today
                            </Button>
                            <Button 
                                variant={selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd') ? "secondary" : "ghost"}
                                size="sm" 
                                className="text-xs h-8 px-3"
                                onClick={() => setSelectedDate(subDays(new Date(), 1))}
                            >
                                Yesterday
                            </Button>
                        </div>
                        
                        <DatePicker 
                            date={selectedDate} 
                            setDate={setSelectedDate} 
                            className="h-9 w-[180px]"
                        />

                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fetchLabOrders(undefined, selectedDate)}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-8 w-[180px] h-9 bg-white dark:bg-slate-950"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Card className="border-t-4 border-t-yellow-500 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            Pending Orders Queue
                        </CardTitle>
                        <CardDescription>Orders waiting for processing or sample collection</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Test</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Ordered At</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</TableCell>
                                            <TableCell>{order.patient.firstName} {order.patient.lastName}</TableCell>
                                            <TableCell>{order.testName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getPriorityColor(order.priority)}>
                                                    {order.priority.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(order)}
                                                    disabled={updatingId === order.id || order.status === 'PAYMENT_PENDING'}
                                                    variant={order.status === 'PAYMENT_PENDING' ? 'outline' : 'default'}
                                                >
                                                    {updatingId === order.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : null}
                                                    {getNextActionLabel(order.status)}
                                                </Button>
                                                {user?.role === 'admin' && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {pendingOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                                <p className="font-medium">All caught up!</p>
                                                <p className="text-sm">No pending orders found.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}

                        {!loading && totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <p className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, pendingOrders.length)} of {pendingOrders.length} orders
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                className="w-8 h-8 p-0"
                                                onClick={() => setCurrentPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed Tests Section */}
                <Card className="border-t-4 border-t-emerald-500 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            Completed Tests
                        </CardTitle>
                        <CardDescription>Recently completed lab tests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Completed At</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCompletedOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</TableCell>
                                        <TableCell>{order.patient.firstName} {order.patient.lastName}</TableCell>
                                        <TableCell>{order.testName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getPriorityColor(order.priority)}>
                                                {order.priority.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {order.result?.completedAt ? new Date(order.result.completedAt).toLocaleString() : new Date(order.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <LabResultDetailsDialog orderId={order.id}>
                                                <Button size="sm" variant="outline">
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View Results
                                                </Button>
                                            </LabResultDetailsDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {completedOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                            <p className="font-medium">No completed tests</p>
                                            <p className="text-sm">Completed lab tests will appear here</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {!loading && totalCompletedPages > 1 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <p className="text-sm text-muted-foreground">
                                    Showing {startCompletedIndex + 1} to {Math.min(startCompletedIndex + ITEMS_PER_PAGE, completedOrders.length)} of {completedOrders.length} tests
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCompletedPage(prev => Math.max(1, prev - 1))}
                                        disabled={completedPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalCompletedPages }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={completedPage === page ? "default" : "outline"}
                                                size="sm"
                                                className="w-8 h-8 p-0"
                                                onClick={() => setCompletedPage(page)}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCompletedPage(prev => Math.min(totalCompletedPages, prev + 1))}
                                        disabled={completedPage === totalCompletedPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default LabPendingTests;
