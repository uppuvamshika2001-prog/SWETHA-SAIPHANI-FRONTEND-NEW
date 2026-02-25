import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { FileText, Calendar, User, FlaskConical, AlertTriangle, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLab } from "@/contexts/LabContext";
import { downloadLabReportPDF } from "@/utils/downloadLabReport";

interface LabResultDetailsDialogProps {
    children?: React.ReactNode;
    orderId?: string;
    order?: any; // Accept direct order object
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LabResultDetailsDialog({
    children,
    orderId,
    order: propOrder,
    open: controlledOpen,
    onOpenChange
}: LabResultDetailsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { labOrders } = useLab();

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
        setInternalOpen(newOpen);
    };

    const order = propOrder || labOrders.find(o => o.id === orderId);

    if (!order) return null;

    const handleDownload = () => {
        downloadLabReportPDF(order);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">View Results</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lab Report</DialogTitle>
                    <DialogDescription>
                        Order ID: LAB-{order.id.toUpperCase()}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Patient</span>
                            <div className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {order.patient.firstName} {order.patient.lastName}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Doctor</span>
                            <div className="font-medium flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Dr. {order.orderedBy.firstName} {order.orderedBy.lastName}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Date</span>
                            <div className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <div>
                                <StatusBadge status={order.status.toLowerCase() as any} />
                            </div>
                        </div>
                    </div>

                    {/* Test Results */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FlaskConical className="h-4 w-4" />
                                Test Results
                            </h3>
                            {(order.priority === 'urgent' || order.priority === 'stat') && (
                                <Badge variant="destructive" className="flex gap-1">
                                    <AlertTriangle className="h-3 w-3" /> {order.priority.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                        <div className="p-4 space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center border-b pb-2 mb-2">
                                    <span className="font-medium text-lg">{order.testName}</span>
                                    <Badge variant="outline">{order.status}</Badge>
                                </div>

                                {order.result ? (
                                    <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                                        <div className="text-muted-foreground">Parameter</div>
                                        <div className="text-muted-foreground">Result</div>
                                        <div className="text-muted-foreground">Normal Range</div>

                                        {order.result.result.parameters.map((p, i) => (
                                            <React.Fragment key={i}>
                                                <div>{p.name}</div>
                                                <div className="font-bold">{p.value} {p.unit}</div>
                                                <div>{p.normalRange || "-"}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        Results not yet available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attached Report Documents */}
                    {order.result?.attachments && order.result.attachments.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 p-3 border-b">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Attached Report Documents
                                </h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {order.result.attachments.map((rawUrl: string, idx: number) => {
                                    // Fix old URLs that were stored with wrong domain
                                    const url = rawUrl.replace('api.swethasaiphani.com', 'api.swethasaiphani.clinic');
                                    const filename = url.split('/').pop() || `Document ${idx + 1}`;
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center gap-3 p-3 border rounded-md bg-background">
                                                <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{filename}</p>
                                                    <p className="text-xs text-muted-foreground">{isImage ? 'Image' : 'Document'}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2 shrink-0"
                                                    onClick={() => window.open(url, '_blank')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    View / Download
                                                </Button>
                                            </div>
                                            {isImage && (
                                                <img
                                                    src={url}
                                                    alt={filename}
                                                    className="max-h-48 rounded-md border object-contain cursor-pointer"
                                                    onClick={() => window.open(url, '_blank')}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Remarks */}
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Clinical Remarks
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {order.result?.interpretation || order.notes || "No remarks available."}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:justify-between sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
                    <Button onClick={handleDownload} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
