import { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLab } from "@/contexts/LabContext";
import { FileText, Loader2 } from "lucide-react";

interface LabResultEntryDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultTrigger?: boolean;
    testId?: string;
}

export function LabResultEntryDialog({
    children,
    open: controlledOpen,
    onOpenChange,
    defaultTrigger = true,
    testId
}: LabResultEntryDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const { labOrders, submitResult, loading } = useLab();
    const [submitting, setSubmitting] = useState(false);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
        setInternalOpen(newOpen);
    };

    const order = labOrders.find(o => o.id === testId);
    const [resultValue, setResultValue] = useState("");
    const [remarks, setRemarks] = useState("");

    const handleSubmit = async () => {
        if (!resultValue) {
            toast.error("Please enter a result value");
            return;
        }

        if (!testId) return;

        setSubmitting(true);
        try {
            await submitResult({
                orderId: testId,
                result: {
                    parameters: [{
                        name: order?.testName || "Result",
                        value: resultValue
                    }]
                },
                interpretation: remarks
            });

            toast.success("Result entered successfully!", {
                description: `Result for ${order?.patient?.firstName || "Patient"} saved.`
            });

            // Reset and close
            setResultValue("");
            setRemarks("");
            handleOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit result");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {defaultTrigger && children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            {defaultTrigger && !children && (
                <DialogTrigger asChild>
                    <Button size="sm"><FileText className="mr-2 h-4 w-4" /> Enter Results</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Enter Lab Results</DialogTitle>
                    <DialogDescription>
                        Record test results for {order ? `${order.patient.firstName} ${order.patient.lastName}` : "Patient"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Test Name</Label>
                        <Input value={order?.testName || "Laboratory Test"} disabled />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="result">Result Value *</Label>
                        <Input
                            id="result"
                            value={resultValue}
                            onChange={(e) => setResultValue(e.target.value)}
                            placeholder="Enter result value or observation"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="remarks">Remarks / Notes</Label>
                        <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Additional clinical notes..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save & Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

