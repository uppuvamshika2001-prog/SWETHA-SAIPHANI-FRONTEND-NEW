import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, Plus, Trash2, CheckCircle, Loader2, Upload, X, ChevronRight, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef, Fragment, KeyboardEvent, ChangeEvent } from "react";
import { toast } from "sonner";
import { useLab, LabOrder } from "@/contexts/LabContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
    referenceRange: string;
    normalMin?: number;
    normalMax?: number;
    flag?: 'NORMAL' | 'LOW' | 'HIGH';
    department?: string;
    inputType?: string;
    options?: string[];
}

interface TestCategory {
    id?: string;
    name: string;
    parameters: TestParameter[];
}

const LabResultsEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');

    const { labOrders, submitResult, uploadFile, fetchLabOrders, loading } = useLab();
    const [submitting, setSubmitting] = useState(false);
    const [interpretation, setInterpretation] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || "");
    const [categories, setCategories] = useState<TestCategory[]>([]);
    const [loadingParameters, setLoadingParameters] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReportVisible, setIsReportVisible] = useState(true);
    const [testType, setTestType] = useState<'PANEL' | 'SINGLE' | 'REPORT'>('PANEL');

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);

    // Filter orders that are in progress (ready for results)
    const inProgressOrders = labOrders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'SAMPLE_COLLECTED');
    const selectedOrder = labOrders.find(o => o.id === selectedOrderId);

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (orderId) {
            setSelectedOrderId(orderId);
        }
    }, [orderId]);

    useEffect(() => {
        const fetchParameters = async () => {
            if (!selectedOrderId) {
                setCategories([]);
                return;
            }

            setLoadingParameters(true);
            setError(null);
            try {
                const response = await labService.getOrderParameters(selectedOrderId);
                console.log("Lab Parameters API Response:", response);
                
                setTestType(response?.testType || 'PANEL');
                
                let data = [];
                if (response?.categories && Array.isArray(response.categories)) {
                    data = response.categories;
                } else if (Array.isArray(response)) {
                    // Backwards compatibility for old API format (flat array)
                    data = [{
                        name: "General",
                        parameters: response
                    }];
                } else if (response && typeof response === 'object' && !response.categories) {
                    // Some other object format
                    data = [{ name: "General", parameters: [] }];
                }

                if (data && data.length > 0) {
                    setCategories(data.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name || "General",
                        parameters: (cat.parameters || []).map((p: any) => ({
                            id: p.id,
                            name: p.name || "",
                            unit: p.unit || "",
                            referenceRange: p.referenceRange || "",
                            normalMin: p.normalMin,
                            normalMax: p.normalMax,
                            inputType: p.inputType || 'number',
                            options: p.options,
                            value: "",
                            flag: "NORMAL"
                        }))
                    })));
                } else if (response?.testType === 'REPORT') {
                    // Report types don't need structured parameters
                    setCategories([]);
                } else {
                    setError("No structured parameters found for this test. Please add them manually or sync the test catalog.");
                    setCategories([]);
                }
            } catch (error: any) {
                console.error("Failed to fetch parameters", error);
                setError(error.message || "Failed to load test parameters.");
                setCategories([]);
            } finally {
                setLoadingParameters(false);
            }
        };

        if (selectedOrderId) {
            console.log("Selected Lab Order ID:", selectedOrderId);
            fetchParameters();
        }
    }, [selectedOrderId]);

    const calculateFlag = (value: string, rangeStr: string, min?: number, max?: number): 'NORMAL' | 'LOW' | 'HIGH' => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return 'NORMAL';
        
        // 1. Use explicit min/max from database if fully provided
        if (min !== null && min !== undefined && max !== null && max !== undefined) {
            if (numValue < min) return 'LOW';
            if (numValue > max) return 'HIGH';
            return 'NORMAL';
        }

        // 2. Fallback to strict string parsing of the reference range
        if (!rangeStr || typeof rangeStr !== 'string') return 'NORMAL';

        const cleaned = rangeStr.replace(/\s/g, '');

        if (cleaned.includes('-')) {
            const parts = cleaned.split('-');
            if (parts.length >= 2) {
                const rMin = parseFloat(parts[0]);
                const rMax = parseFloat(parts[1]);
                if (!isNaN(rMin) && numValue < rMin) return 'LOW';
                if (!isNaN(rMax) && numValue > rMax) return 'HIGH';
            }
            return 'NORMAL';
        }

        if (cleaned.startsWith('<') || cleaned.toLowerCase().startsWith('upto')) {
            const rMax = parseFloat(cleaned.replace(/<|upto/ig, ''));
            if (!isNaN(rMax)) return numValue >= rMax ? 'HIGH' : 'NORMAL';
        }

        if (cleaned.startsWith('>')) {
            const rMin = parseFloat(cleaned.replace(/>/ig, ''));
            if (!isNaN(rMin)) return numValue <= rMin ? 'LOW' : 'NORMAL';
        }

        return 'NORMAL';
    };

    const updateParameter = (catIndex: number, paramIndex: number, field: string, value: string) => {
        const updated = [...categories];
        const param = { ...updated[catIndex].parameters[paramIndex] } as any;
        param[field] = value;
        
        if (field === 'value') {
            param.flag = calculateFlag(value, param.referenceRange, param.normalMin, param.normalMax);
        }
        
        updated[catIndex].parameters[paramIndex] = param;
        setCategories(updated);
    };

    const addParameter = (catIndex: number) => {
        const updated = [...categories];
        updated[catIndex].parameters.push({
            name: "",
            value: "",
            unit: "",
            referenceRange: "",
            flag: 'NORMAL'
        });
        setCategories(updated);
    };

    const removeParameter = (catIndex: number, paramIndex: number) => {
        const updated = [...categories];
        updated[catIndex].parameters.splice(paramIndex, 1);
        if (updated[catIndex].parameters.length === 0 && updated.length > 1) {
            updated.splice(catIndex, 1);
        } else if (updated[catIndex].parameters.length === 0) {
            updated[catIndex].parameters.push({ name: "", value: "", unit: "", referenceRange: "", flag: 'NORMAL' });
        }
        setCategories(updated);
    };

    const handleKeyDown = (e: KeyboardEvent, catIndex: number, paramIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Try to find next parameter in same category
            let nextParam = categories[catIndex].parameters[paramIndex + 1];
            let nextCatIndex = catIndex;
            let nextParamIndex = paramIndex + 1;

            if (!nextParam) {
                // Try next category
                const nextCat = categories[catIndex + 1];
                if (nextCat) {
                    nextParam = nextCat.parameters[0];
                    nextCatIndex = catIndex + 1;
                    nextParamIndex = 0;
                }
            }

            if (nextParam) {
                const nextInput = inputRefs.current[`${nextCatIndex}-${nextParamIndex}`];
                if (nextInput) {
                    nextInput.focus();
                }
            } else {
                const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                if (textarea) textarea.focus();
            }
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
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

        const allParams = categories.flatMap(cat => cat.parameters);
        const validParams = allParams.filter(p => p.name.trim() && p.value.trim());
        
        if (validParams.length === 0 && !selectedFile) {
            toast.error("Please enter at least one test parameter or upload a result document");
            return;
        }

        setSubmitting(true);
        try {
            const attachments: string[] = [];

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
                        referenceRange: p.referenceRange || undefined,
                        flag: p.flag
                    })),
                },
                interpretation: interpretation || undefined,
                attachments: attachments.length > 0 ? attachments : undefined,
                isReportVisibleToPatient: isReportVisible
            } as any);

            toast.success("Lab result submitted successfully!");
            await fetchLabOrders();
            setSelectedOrderId("");
            setCategories([]);
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
            <div className="space-y-6 max-w-[1200px] mx-auto">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                            <FileText className="h-8 w-8 text-blue-600" />
                            Lab Results Entry
                        </h1>
                        <p className="text-muted-foreground mt-1 text-base">Enter observed values from machine output</p>
                    </div>
                    {selectedOrder && (
                        <div className="flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                            <div className="text-sm font-medium text-blue-900">
                                Patient: <span className="font-bold">{selectedOrder.patient.firstName} {selectedOrder.patient.lastName}</span>
                            </div>
                            <div className="h-4 w-px bg-blue-200"></div>
                            <div className="text-sm font-medium text-blue-900">
                                Test: <span className="font-bold">{selectedOrder.testName}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Left Sidebar: Select Order */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-3 bg-slate-50/50">
                                <CardTitle className="text-base">Pending Orders</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    </div>
                                ) : inProgressOrders.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500 opacity-50" />
                                        <p className="text-sm">No pending tests</p>
                                    </div>
                                ) : (
                                    <div className="divide-y max-h-[600px] overflow-y-auto">
                                        {inProgressOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                onClick={() => setSelectedOrderId(order.id)}
                                                className={`p-4 cursor-pointer transition-all hover:bg-blue-50/50 ${selectedOrderId === order.id ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-inner' : 'bg-white'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-sm font-semibold ${selectedOrderId === order.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                                        {order.patient.firstName} {order.patient.lastName}
                                                    </span>
                                                    <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] px-1 h-4 uppercase">
                                                        {order.priority}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-medium">{order.testName}</div>
                                                <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                                                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span>#{order.id.slice(-4).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {selectedOrder && (
                            <Card className="shadow-sm border-slate-200 overflow-hidden">
                                <CardHeader className="pb-3 bg-slate-50/50">
                                    <CardTitle className="text-base">Report Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm">Visible to Patient</Label>
                                            <p className="text-[10px] text-muted-foreground">Show report in patient portal</p>
                                        </div>
                                        <Switch 
                                            checked={isReportVisible}
                                            onCheckedChange={setIsReportVisible}
                                        />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Label className="text-sm mb-2 block">Optional PDF Upload</Label>
                                        {selectedFile ? (
                                            <div className="flex items-center justify-between p-2 bg-slate-50 border rounded text-xs">
                                                <span className="truncate flex-1 mr-2">{selectedFile.name}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedFile(null)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Button variant="outline" size="sm" className="w-full text-xs h-8">
                                                    <Upload className="h-3 w-3 mr-2" /> Upload Report
                                                </Button>
                                                <Input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Content: Results Entry Table */}
                    <div className="lg:col-span-3 space-y-6">
                        {!selectedOrderId ? (
                            <Card className="h-full border-dashed flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
                                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <ChevronRight className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">Get Started</h3>
                                <p className="text-muted-foreground mt-2 max-w-sm">
                                    Select an order from the sidebar to begin entering machine-generated test results.
                                </p>
                            </Card>
                        ) : (
                            <Card className="shadow-md border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
                                <CardHeader className="bg-slate-900 text-white pb-6 pt-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {testType === 'REPORT' ? 'Document Upload' : 'Observed Values Entry'}
                                            </CardTitle>
                                            <CardDescription className="text-slate-400">
                                                {testType === 'REPORT' 
                                                    ? 'Upload the final report document.' 
                                                    : 'Enter machine results. Use [Enter] to move to the next field.'}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Standard Reference</div>
                                            <Badge variant="outline" className="text-white border-slate-700 bg-slate-800">
                                                {selectedOrder?.patient.firstName}'s History
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 flex flex-col">
                                    {loadingParameters ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                                            <p className="text-slate-500 animate-pulse">Loading test parameters from catalog...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="p-6">
                                            <Alert variant="destructive" className="bg-red-50">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription className="ml-2 font-medium">{error}</AlertDescription>
                                            </Alert>
                                        </div>
                                    ) : testType === 'REPORT' ? (
                                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                            <Upload className="h-16 w-16 text-blue-100 mb-4" />
                                            <h3 className="text-xl font-semibold text-slate-700">Upload Report Document</h3>
                                            <p className="text-slate-500 mt-2 mb-6 max-w-sm">
                                                This is a REPORT-type test. Please upload the generated report document using the "Report Settings" panel on the left.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-auto">
                                            <Table className="border-b">
                                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[30%] font-bold text-slate-700">Test Parameter</TableHead>
                                                        <TableHead className="w-[20%] font-bold text-slate-700">Observed Value</TableHead>
                                                        <TableHead className="w-[12%] font-bold text-slate-700">Unit</TableHead>
                                                        <TableHead className="w-[23%] font-bold text-slate-700">Reference Range</TableHead>
                                                        <TableHead className="w-[10%] text-center font-bold text-slate-700">Flag</TableHead>
                                                        <TableHead className="w-[5%] text-right font-bold text-slate-700"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {categories.map((cat, catIndex) => (
                                                        <Fragment key={catIndex}>
                                                            <TableRow className="bg-slate-100/50 hover:bg-slate-100/50 border-y-2 border-slate-200">
                                                                <TableCell colSpan={5} className="py-2.5 font-bold text-slate-900 text-xs uppercase tracking-wider bg-slate-100">
                                                                    {cat.name}
                                                                </TableCell>
                                                            </TableRow>
                                                            {cat.parameters.map((param, paramIndex) => (
                                                                <TableRow key={paramIndex} className={`group ${param.flag !== 'NORMAL' ? 'bg-orange-50/30' : ''}`}>
                                                                    <TableCell className="font-medium text-slate-700 py-3">
                                                                        {param.id ? (
                                                                            param.name
                                                                        ) : (
                                                                            <Input 
                                                                                className="h-8 text-xs" 
                                                                                placeholder="Parameter name" 
                                                                                value={param.name}
                                                                                onChange={(e) => updateParameter(catIndex, paramIndex, 'name', e.target.value)}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {param.inputType === 'select' ? (
                                                                            <select
                                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                                value={param.value}
                                                                                onChange={(e) => updateParameter(catIndex, paramIndex, 'value', e.target.value)}
                                                                            >
                                                                                <option value="">Select...</option>
                                                                                {param.options?.map(opt => (
                                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                                ))}
                                                                            </select>
                                                                        ) : (
                                                                            <Input
                                                                                ref={el => inputRefs.current[`${catIndex}-${paramIndex}`] = el}
                                                                                className={`h-9 font-bold text-base transition-all ${
                                                                                    param.flag === 'HIGH' ? 'border-red-500 bg-red-50 focus-visible:ring-red-500 text-red-900' :
                                                                                    param.flag === 'LOW' ? 'border-orange-500 bg-orange-50 focus-visible:ring-orange-500 text-orange-900' : 
                                                                                    'focus-visible:ring-blue-600 text-slate-900'
                                                                                }`}
                                                                                placeholder={param.inputType === 'number' ? '0.0' : 'Enter value'}
                                                                                value={param.value}
                                                                                onChange={(e) => updateParameter(catIndex, paramIndex, 'value', e.target.value)}
                                                                                onKeyDown={(e) => handleKeyDown(e, catIndex, paramIndex)}
                                                                                autoFocus={catIndex === 0 && paramIndex === 0}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {param.id ? (
                                                                            <span className="text-slate-500 text-sm italic">{param.unit}</span>
                                                                        ) : (
                                                                            <Input 
                                                                                className="h-8 text-xs" 
                                                                                placeholder="Unit" 
                                                                                value={param.unit}
                                                                                onChange={(e) => updateParameter(catIndex, paramIndex, 'unit', e.target.value)}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {param.id ? (
                                                                            <span className="text-slate-600 text-sm font-medium">{param.referenceRange}</span>
                                                                        ) : (
                                                                            <Input 
                                                                                className="h-8 text-xs" 
                                                                                placeholder="Range" 
                                                                                value={param.referenceRange}
                                                                                onChange={(e) => updateParameter(catIndex, paramIndex, 'referenceRange', e.target.value)}
                                                                            />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {param.value && (
                                                                            <Badge
                                                                                variant={param.flag === 'NORMAL' ? 'secondary' : 'destructive'}
                                                                                className={`text-[10px] font-bold px-1.5 py-0 ${
                                                                                    param.flag === 'NORMAL' ? 'bg-green-100 text-green-700' :
                                                                                    param.flag === 'LOW' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                                                                    'bg-red-100 text-red-700 border-red-200'
                                                                                }`}
                                                                            >
                                                                                {param.flag}
                                                                            </Badge>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            onClick={() => removeParameter(catIndex, paramIndex)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                            <TableRow className="hover:bg-transparent">
                                                                <TableCell colSpan={5} className="py-2">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                                                                        onClick={() => addParameter(catIndex)}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Add custom parameter to {cat.name}
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        </Fragment>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    <div className="p-6 bg-slate-50 border-t space-y-4">
                                        <div>
                                            <Label className="text-sm font-bold text-slate-700">Clinical Interpretation / Lab Comments</Label>
                                            <Textarea
                                                placeholder="Add diagnostic comments or interpretation here..."
                                                value={interpretation}
                                                onChange={(e) => setInterpretation(e.target.value)}
                                                rows={3}
                                                className="mt-2 bg-white resize-none focus-visible:ring-blue-600 border-slate-300"
                                            />
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Badge variant="outline" className="bg-white text-slate-400 border-slate-200 font-normal">
                                                    Esc: Reset
                                                </Badge>
                                                <Badge variant="outline" className="bg-white text-slate-400 border-slate-200 font-normal">
                                                    Ent: Next
                                                </Badge>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button 
                                                    variant="ghost" 
                                                    className="text-slate-500 hover:text-slate-700"
                                                    onClick={() => navigate('/lab/pending-tests')}
                                                >
                                                    Discard
                                                </Button>
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={submitting || !selectedOrderId}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-md shadow-blue-200"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                            {uploadProgress ? "Uploading..." : "Saving..."}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Submit Results
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabResultsEntry;
