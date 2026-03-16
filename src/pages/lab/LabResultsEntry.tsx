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
    Alert,
    AlertDescription
} from "@/components/ui/alert";

import { labService } from "@/services/labService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TestParameter {
    id?: string;
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    normalMin?: number;
    normalMax?: number;
    flag?: 'NORMAL' | 'LOW' | 'HIGH';
}

const LabResultsEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');

    const { labOrders, submitResult, uploadFile, fetchLabOrders, loading } = useLab();
    const [submitting, setSubmitting] = useState(false);
    const [interpretation, setInterpretation] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || "");
    const [parameters, setParameters] = useState<TestParameter[]>([]);
    const [loadingParameters, setLoadingParameters] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchParameters = async () => {
            if (!selectedOrderId) {
                setParameters([]);
                return;
            }

            setLoadingParameters(true);
            setError(null);
            try {
                const response = await labService.getOrderParameters(selectedOrderId);
                const data = response.parameters || [];
                
                if (data && data.length > 0) {
                    setParameters(data.map((p: any) => ({
                        id: p.id,
                        name: p.parameter || p.parameter_name || p.name,
                        unit: p.unit,
                        normalRange: p.normalRange || p.normal_range || `${p.normal_min}-${p.normal_max}`,
                        normalMin: p.normalMin !== undefined ? p.normalMin : p.normal_min,
                        normalMax: p.normalMax !== undefined ? p.normalMax : p.normal_max,
                        value: "",
                        flag: "NORMAL"
                    })));
                } else {
                    // Fallback to empty if no parameters defined
                    setParameters([{ name: "", value: "", unit: "", normalRange: "" }]);
                }
            } catch (error: any) {
                console.error("Failed to fetch parameters", error);
                setError(error.message || "Failed to load test parameters. The database might be missing templates for this test.");
                setParameters([{ name: "", value: "", unit: "", normalRange: "" }]);
            } finally {
                setLoadingParameters(false);
            }
        };

        fetchParameters();
    }, [selectedOrderId]);

    const calculateFlag = (value: string, min?: number, max?: number): 'NORMAL' | 'LOW' | 'HIGH' => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || min === undefined || max === undefined) return 'NORMAL';
        if (numValue < min) return 'LOW';
        if (numValue > max) return 'HIGH';
        return 'NORMAL';
    };

    const updateParameter = (index: number, value: string) => {
        const updated = [...parameters];
        updated[index].value = value;
        updated[index].flag = calculateFlag(value, updated[index].normalMin, updated[index].normalMax);
        setParameters(updated);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
            if (nextInput) {
                nextInput.focus();
            } else {
                // If it's the last one, maybe focus the interpretation or submit?
                const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                if (textarea) textarea.focus();
            }
        }
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
                        parameterId: p.id,
                        name: p.name,
                        value: p.value,
                        unit: p.unit || undefined,
                        normalRange: p.normalRange || undefined,
                        flag: p.flag
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
                                <div className="space-y-4">
                                    <Label>Pending Lab Orders</Label>
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                        {inProgressOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                onClick={() => setSelectedOrderId(order.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedOrderId === order.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-sm">{order.patient.firstName} {order.patient.lastName}</span>
                                                    <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                                                        {order.priority.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate">{order.testName}</div>
                                                <div className="text-[10px] text-muted-foreground mt-2 flex justify-between">
                                                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>#{order.id.slice(-4).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedOrder && (
                                <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-3 border">
                                    <h4 className="font-medium text-sm border-b pb-2">Order Details</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <span className="text-muted-foreground">Patient:</span>
                                        <span className="font-medium text-right">{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</span>
                                        <span className="text-muted-foreground">Test:</span>
                                        <span className="font-medium text-right">{selectedOrder.testName}</span>
                                        <span className="text-muted-foreground">ID:</span>
                                        <span className="font-medium text-right">#{selectedOrder.id.slice(-6).toUpperCase()}</span>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div className="pt-2 border-t mt-2">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Doctor Notes:</span>
                                            <p className="text-xs mt-1 text-muted-foreground italic">"{selectedOrder.notes}"</p>
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
                                <Label className="text-base">Test Parameters</Label>
                                {loadingParameters ? (
                                    <div className="flex items-center justify-center py-10 border rounded-lg">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        <span>Loading test parameters...</span>
                                    </div>
                                ) : error ? (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                ) : !selectedOrderId ? (
                                    <Alert>
                                        <AlertDescription>
                                            Please select a lab order to enter parameters.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Parameter</TableHead>
                                                    <TableHead className="w-[150px]">Result</TableHead>
                                                    <TableHead>Unit</TableHead>
                                                    <TableHead>Normal Range</TableHead>
                                                    <TableHead className="text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {parameters.map((param, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{param.name}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                className={`h-8 ${param.flag === 'HIGH' ? 'border-red-500 focus-visible:ring-red-500' :
                                                                    param.flag === 'LOW' ? 'border-orange-500 focus-visible:ring-orange-500' : ''
                                                                    }`}
                                                                placeholder="Enter value"
                                                                value={param.value}
                                                                data-index={index}
                                                                onChange={(e) => updateParameter(index, e.target.value)}
                                                                onKeyDown={(e) => handleKeyDown(e, index)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">{param.unit}</TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">{param.normalRange}</TableCell>
                                                        <TableCell className="text-right">
                                                            {param.value && (
                                                                <Badge
                                                                    variant={param.flag === 'NORMAL' ? 'secondary' : 'destructive'}
                                                                    className={param.flag === 'NORMAL' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                                        param.flag === 'LOW' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-none' : ''
                                                                    }
                                                                >
                                                                    {param.flag}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
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
