import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { appointmentService } from '@/services/appointmentService';
import { Appointment } from '@/types';
import { Printer, Home, Loader2, Phone, Mail, MapPin } from 'lucide-react';

export default function InvoicePage() {
    const { appointmentId } = useParams<{ appointmentId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!appointmentId) return;
            try {
                const data = await appointmentService.getPublicAppointment(appointmentId);
                setAppointment(data);
            } catch (error) {
                console.error("Failed to load invoice", error);
                toast({
                    variant: "destructive",
                    title: "Error loading invoice",
                    description: "Could not fetch appointment details.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [appointmentId, toast]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Invoice Not Found</h2>
                <Button onClick={() => navigate('/')}>Back to Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:p-0 print:bg-white print:min-h-0">
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0; /* Let container handle margins */
                    }
                    body {
                        background: white;
                    }
                    /* Hide scrollbars during print */
                    ::-webkit-scrollbar {
                        display: none;
                    }
                    /* Ensure background graphics (colors) are printed */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* A4 Container */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] flex flex-col print:shadow-none print:w-[210mm] print:h-[297mm] print:max-w-none print:min-h-[297mm] print:m-0 relative overflow-hidden">

                {/* Watermark Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img
                        src="/watermark-logo.png"
                        alt="Watermark"
                        className="w-[500px] h-auto object-contain opacity-[0.15] -rotate-45 grayscale"
                    />
                </div>

                {/* Header / Branding */}
                <div className="relative z-10 p-8 border-b-2 border-[#0099cc] flex justify-between items-start print:px-12 print:pt-12">
                    <div className="flex items-center gap-4">
                        {/* Logo & Name Group */}
                        <div className="flex items-center justify-center">
                            <img
                                src="/swetha-saiphani-logo.png"
                                alt="Clinic Logo"
                                className="h-24 w-auto object-contain block"
                                style={{ minHeight: '96px', minWidth: '96px' }}
                            />
                        </div>

                        <div className="text-left">
                            <h1 className="text-2xl font-extrabold text-[#0099cc] uppercase tracking-wide">Swetha SaiPhani Clinic</h1>
                            <p className="text-sm text-gray-500">Excellence in Healthcare</p>
                        </div>
                    </div>

                    <div className="text-right mt-4">
                        <h2 className="text-3xl font-light text-gray-400 uppercase">Invoice</h2>
                        <p className="font-mono text-sm text-gray-600 mt-1">#{appointment.appointment_id.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="relative z-10 p-8 space-y-8 print:px-12">

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Billed To</h3>
                            <p className="font-bold text-lg text-gray-800">{appointment.patient_name}</p>
                            <p className="text-gray-600">{appointment.patient_id}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Appointment Details</h3>
                            <p className="text-gray-800"><span className="font-medium">Date:</span> {new Date(appointment.date).toLocaleDateString()}</p>
                            <p className="text-gray-800"><span className="font-medium">Time:</span> {appointment.time}</p>
                            <p className="text-gray-800"><span className="font-medium">Doctor:</span> {appointment.doctor_name}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mt-8 border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">Medical Consultation</div>
                                        <div className="text-sm text-gray-500">{appointment.doctor_name} - {appointment.department}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        ₹ {appointment.doctor_name.includes('Swetha') ? '600.00' : '500.00' /* Logic can be improved if backend provides fee */}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td className="px-6 py-3 text-right font-bold text-gray-900">Total</td>
                                    <td className="px-6 py-3 text-right font-bold text-[#0099cc]">
                                        ₹ {appointment.doctor_name.includes('Swetha') ? '600.00' : '500.00'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Status */}
                    <div className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-500">Payment Status</p>
                            <p className="font-bold text-orange-600 uppercase">UNPAID (Pay at Clinic)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Payment Mode</p>
                            <p className="font-medium text-gray-900">{appointment.notes || 'N/A'}</p>
                        </div>
                    </div>



                </div>

                {/* Footer / Contact - Pushed to bottom */}
                <div className="mt-auto p-8 border-t text-center space-y-2 text-sm text-gray-500 footer-break-avoid print:px-12 print:pb-12">
                    <p className="font-bold text-[#0099cc] text-lg">Swetha SaiPhani Clinic</p>
                    <div className="flex justify-center items-center gap-6 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Karimnagar, Telangana</span>
                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> +91 98765 43210</span>
                        <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> contact@clinic.com</span>
                    </div>
                    <p className="text-xs mt-4">Thank you for choosing us for your healthcare needs.</p>
                </div>
            </div>

            {/* Actions - Hidden on Print */}
            <div className="fixed bottom-8 right-8 flex gap-4 print:hidden z-50">
                <Button variant="outline" onClick={() => navigate('/')} className="shadow-lg bg-white hover:bg-gray-100">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                </Button>
                <Button onClick={handlePrint} className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
                </Button>
            </div>
        </div>
    );
}
