import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Plus, Trash2, CheckCircle, Loader2, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLab, LabOrder } from "@/contexts/LabContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestParameter {
    name: string;
    value: string;
    unit: string;
    normalRange: string;
}

const LabResultsEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');

    const { labOrders, submitResult, uploadFile, fetchLabOrders, loading } = useLab();
    const [submitting, setSubmitting] = useState(false);
    const [interpretation, setInterpretation] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || "");
    const [parameters, setParameters] = useState<TestParameter[]>([
        { name: "", value: "", unit: "", normalRange: "" }
    ]);

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);

    // Filter orders that are in progress (ready for results)
    const inProgressOrders = labOrders.filter(o => o.status === 'IN_PROGRESS');
    const selectedOrder = labOrders.find(o => o.id === selectedOrderId);

    useEffect(() => {
        if (orderId) {
            setSelectedOrderId(orderId);
        }
    }, [orderId]);

    const addParameter = () => {
        setParameters([...parameters, { name: "", value: "", unit: "", normalRange: "" }]);
    };

    const removeParameter = (index: number) => {
        if (parameters.length > 1) {
            setParameters(parameters.filter((_, i) => i !== index));
        }
    };

    const updateParameter = (index: number, field: keyof TestParameter, value: string) => {
        const updated = [...parameters];
        updated[index][field] = value;
        setParameters(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedOrderId) {
            toast.error("Please select an order");
            return;
        }

        // Validate at least one parameter OR a file
        const validParams = parameters.filter(p => p.name.trim() && p.value.trim());
        if (validParams.length === 0 && !selectedFile) {
            toast.error("Please enter at least one test parameter or upload a result document");
            return;
        }

        setSubmitting(true);
        try {
            const attachments: string[] = [];

            // Upload file if selected
            if (selectedFile) {
                setUploadProgress(true);
                const uploadResponse = await uploadFile(selectedFile);
                attachments.push(uploadResponse.url);
                setUploadProgress(false);
            }

            await submitResult({
                orderId: selectedOrderId,
                result: {
                    parameters: validParams.map(p => ({
                        name: p.name,
                        value: p.value,
                        unit: p.unit || undefined,
                        normalRange: p.normalRange || undefined,
                    })),
                },
                interpretation: interpretation || undefined,
                attachments: attachments.length > 0 ? attachments : undefined
            });

            toast.success("Lab result submitted successfully! Order marked as COMPLETED.");
            // Refresh and reset
            await fetchLabOrders();
            setSelectedOrderId("");
            setParameters([{ name: "", value: "", unit: "", normalRange: "" }]);
            setInterpretation("");
            setSelectedFile(null);
            navigate('/lab/pending-tests');
        } catch (error: any) {
            toast.error(error.message || "Failed to submit result");
            setUploadProgress(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout role="lab_technician">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <FileText className="h-8 w-8" />
                        Results Entry
                    </h1>
                    <p className="text-muted-foreground mt-1">Enter and submit lab test results</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Order Selection */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Select Order</CardTitle>
                            <CardDescription>Choose an order to enter results</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-20">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : inProgressOrders.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                    <p>No orders ready for results entry</p>
                                    <p className="text-sm">Process orders from the Pending Tests queue first</p>
                                </div>
                            ) : (
                                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an order..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inProgressOrders.map((order) => (
                                            <SelectItem key={order.id} value={order.id}>
                                                <div className="flex flex-col">
                                                    <span>{order.patient.firstName} {order.patient.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{order.testName}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {selectedOrder && (
                                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Patient:</span>
                                        <span className="font-medium">{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Test:</span>
                                        <span className="font-medium">{selectedOrder.testName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Priority:</span>
                                        <Badge variant={selectedOrder.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                            {selectedOrder.priority.toUpperCase()}
                                        </Badge>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div className="pt-2 border-t">
                                            <span className="text-sm text-muted-foreground">Notes:</span>
                                            <p className="text-sm">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Entry Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Test Parameters & Report</CardTitle>
                            <CardDescription>Enter values or upload result document</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* File Upload Section */}
                            <div className="border-2 border-dashed border-input rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                                {selectedFile ? (
                                    <div className="w-full flex items-center justify-between p-3 bg-background border rounded-md">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Upload className="h-6 w-6 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-1">Upload Report Document</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Drag and drop or click to upload PDF/Image
                                        </p>
                                        <div className="relative">
                                            <Button variant="outline">Choose File</Button>
                                            <Input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Label>Test Parameters (Optional if File Uploaded)</Label>
                                {parameters.map((param, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-4">
                                            <Label className={index === 0 ? "" : "sr-only"}>Parameter Name</Label>
                                            <Input
                                                placeholder="e.g., Hemoglobin"
                                                value={param.name}
                                                onChange={(e) => updateParameter(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Label className={index === 0 ? "" : "sr-only"}>Value</Label>
                                            <Input
                                                placeholder="e.g., 14.5"
                                                value={param.value}
                                                onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className={index === 0 ? "" : "sr-only"}>Unit</Label>
                                            <Input
                                                placeholder="g/dL"
                                                value={param.unit}
                                                onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className={index === 0 ? "" : "sr-only"}>Normal Range</Label>
                                            <Input
                                                placeholder="12-16"
                                                value={param.normalRange}
                                                onChange={(e) => updateParameter(index, 'normalRange', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeParameter(index)}
                                                disabled={parameters.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                <Button variant="outline" onClick={addParameter} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Parameter
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <Label>Interpretation / Comments (Optional)</Label>
                                <Textarea
                                    placeholder="Enter clinical interpretation or additional comments..."
                                    value={interpretation}
                                    onChange={(e) => setInterpretation(e.target.value)}
                                    rows={3}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => navigate('/lab/pending-tests')}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting || !selectedOrderId}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            {uploadProgress ? "Uploading File..." : "Submitting..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Submit Results
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabResultsEntry;
