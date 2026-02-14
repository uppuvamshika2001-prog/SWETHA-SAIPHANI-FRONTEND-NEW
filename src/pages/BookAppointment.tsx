import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { staffService } from '@/services/staffService';
import { appointmentService } from '@/services/appointmentService';
import { ArrowLeft, Loader2, Calendar as CalendarIcon, Clock, CheckCircle, MapPin, Award, Stethoscope } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function BookAppointment() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [selectedDoctorDetails, setSelectedDoctorDetails] = useState<any>(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        doctorId: '',
        date: '',
        time: '',
        paymentType: 'PAY_AT_CLINIC',
        reason: '',
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await staffService.getPublicActiveDoctors();
                setDoctors(data);

                // Handle pre-selection from navigation state
                const preSelectedDoctorId = location.state?.doctorId;
                if (preSelectedDoctorId) {
                    const foundDoctor = data.find((d: any) => d.id === preSelectedDoctorId);
                    if (foundDoctor) {
                        setFormData(prev => ({ ...prev, doctorId: preSelectedDoctorId }));
                        setSelectedDoctorDetails(foundDoctor);
                    }
                }
            } catch (error) {
                console.error("Failed to load doctors", error);
                toast({
                    variant: "destructive",
                    title: "Error loading doctors",
                    description: "Could not fetch available doctors. Please try again later.",
                });
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchDoctors();
    }, [toast, location.state]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'doctorId') {
            const foundDoctor = doctors.find((d: any) => d.id === value);
            setSelectedDoctorDetails(foundDoctor || null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.doctorId || !formData.date || !formData.time) {
            toast({
                variant: "destructive",
                title: "Missing Fields",
                description: "Please fill in all required fields.",
            });
            return;
        }

        setLoading(true);

        try {
            // Combine date and time to ISO string
            const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();

            const response = await appointmentService.createPublicAppointment({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                doctorId: formData.doctorId,
                scheduledAt: scheduledAt,
                paymentType: formData.paymentType,
            });

            // Show Success Modal instead of redirecting
            setBookedAppointmentId(response.id);
            setShowSuccessModal(true);

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Booking Failed",
                description: error.message || "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = () => {
        if (bookedAppointmentId) {
            navigate(`/invoice/appointment/${bookedAppointmentId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="mb-4 hover:bg-gray-100"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Booking Form */}
                    <Card className="lg:col-span-2 shadow-xl border-t-4 border-t-blue-600">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-3xl font-bold text-gray-900">Book an Appointment</CardTitle>
                            <CardDescription className="text-lg mt-2">
                                Schedule a consultation with our expert doctors
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Patient Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+91 98765 43210"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold border-b pb-2 text-gray-700">Appointment Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="doctorId">Select Doctor *</Label>
                                            <Select
                                                onValueChange={(value) => handleSelectChange('doctorId', value)}
                                                value={formData.doctorId}
                                                disabled={loadingDoctors}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingDoctors ? "Loading doctors..." : "Choose a doctor"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {doctors.map((doc: any) => {
                                                        const name = doc.staff ? `Dr. ${doc.staff.firstName} ${doc.staff.lastName}` : (doc.full_name || doc.email);
                                                        const special = doc.specialization ? ` - ${doc.specialization}` : (doc.staff?.specialization ? ` - ${doc.staff.specialization}` : '');
                                                        return (
                                                            <SelectItem key={doc.id} value={doc.id}>
                                                                {name}{special}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="date">Date *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="date"
                                                    name="date"
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="pl-10"
                                                />
                                                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="time">Time *</Label>
                                            <div className="relative">
                                                <Input
                                                    id="time"
                                                    name="time"
                                                    type="time"
                                                    value={formData.time}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="pl-10"
                                                />
                                                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="paymentType">Payment Mode *</Label>
                                            <Select
                                                onValueChange={(value) => handleSelectChange('paymentType', value)}
                                                value={formData.paymentType}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Payment Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PAY_AT_CLINIC">Pay at Clinic</SelectItem>
                                                    <SelectItem value="CASH">Cash</SelectItem>
                                                    <SelectItem value="CARD">Card</SelectItem>
                                                    <SelectItem value="UPI">UPI</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                                            <Textarea
                                                id="reason"
                                                name="reason"
                                                placeholder="Briefly describe your symptoms or reason for visit"
                                                value={formData.reason}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all duration-300"
                                    disabled={loading || loadingDoctors}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Confirming Appointment...
                                        </>
                                    ) : (
                                        "Confirm Appointment Booking"
                                    )}
                                </Button>

                                <p className="text-xs text-center text-gray-500 mt-4">
                                    By booking an appointment, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Selected Doctor Details */}
                    <div className="lg:col-span-1">
                        {selectedDoctorDetails ? (
                            <Card className="shadow-lg sticky top-6 border-t-4 border-t-green-500">
                                <CardHeader>
                                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md mb-4 bg-gray-100">
                                        <img
                                            src={selectedDoctorDetails.image || "/placeholder-doctor.jpg"}
                                            alt={selectedDoctorDetails.full_name || "Doctor"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "/logo192.png"; }}
                                        />
                                    </div>
                                    <CardTitle className="text-center text-xl">
                                        {selectedDoctorDetails.staff
                                            ? `Dr. ${selectedDoctorDetails.staff.firstName} ${selectedDoctorDetails.staff.lastName}`
                                            : (selectedDoctorDetails.full_name || selectedDoctorDetails.email)
                                        }
                                    </CardTitle>
                                    <CardDescription className="text-center font-medium text-blue-600">
                                        {selectedDoctorDetails.specialization || selectedDoctorDetails.staff?.specialization || "General Physician"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-gray-600">
                                    {selectedDoctorDetails.department && (
                                        <div className="flex items-start gap-3">
                                            <Award className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Department</p>
                                                <p>{selectedDoctorDetails.department}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDoctorDetails.location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Location</p>
                                                <p>{selectedDoctorDetails.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDoctorDetails.consultation_fee && (
                                        <div className="flex items-start gap-3 border-t pt-3 mt-2">
                                            <Stethoscope className="w-5 h-5 text-green-600 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-gray-900">Consultation Fee</p>
                                                <p className="text-green-700 font-bold">₹{selectedDoctorDetails.consultation_fee}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDoctorDetails.availability_text && (
                                        <div className="bg-blue-50 p-3 rounded-lg text-xs">
                                            <p className="font-semibold text-blue-800 mb-1">Availability</p>
                                            <p className="text-blue-700 whitespace-pre-wrap">{selectedDoctorDetails.availability_text}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="shadow-sm border-dashed">
                                <CardContent className="py-12 flex flex-col items-center text-center text-gray-400">
                                    <Stethoscope className="w-12 h-12 mb-3 opacity-20" />
                                    <p>Select a doctor to view their details here</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Success Modal */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                        <DialogHeader className="flex flex-col items-center text-center space-y-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <DialogTitle className="text-2xl font-bold">Appointment Booked Successfully</DialogTitle>
                            <DialogDescription className="text-center">
                                Your appointment has been confirmed. You can view and print your invoice below.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-2 text-center text-sm font-medium text-gray-500">
                            Reference ID: <span className="text-gray-900 font-mono tracking-wide">{bookedAppointmentId?.substring(0, 8).toUpperCase()}</span>
                        </div>

                        <DialogFooter className="sm:justify-center">
                            <Button
                                type="button"
                                variant="default"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleViewInvoice}
                            >
                                Invoice
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
