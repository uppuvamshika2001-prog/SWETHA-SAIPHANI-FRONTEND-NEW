
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { User, Lock, Mail, Phone, Calendar, MapPin, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { api } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PatientSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await patientService.getMyProfile();
                setProfile(data);
            } catch (error) {
                console.error('Failed to fetch profile', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load profile data'
                });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordSuccess(false);

        // Validation
        if (passwordForm.newPassword.length < 8) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'New password must be at least 8 characters long'
            });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'New passwords do not match'
            });
            return;
        }

        setPasswordLoading(true);
        try {
            await api.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            setPasswordSuccess(true);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            toast({
                title: 'Password Changed',
                description: 'Your password has been successfully updated.'
            });
        } catch (error: any) {
            // Extract detailed error message from API response
            let errorMessage = 'Failed to change password.';
            if (error.message) {
                errorMessage = error.message;
            }
            // Check for validation details
            if (error.response?.data?.details?.length > 0) {
                errorMessage = error.response.data.details.map((d: any) => d.message).join('. ');
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                variant: 'destructive',
                title: 'Password Change Failed',
                description: errorMessage
            });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="patient">
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="patient">
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account settings and password</p>
                </div>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Your personal details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Full Name</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{profile?.full_name || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">UHID</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <span className="font-mono font-bold text-primary">{profile?.uhid || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Email</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{profile?.email || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Phone</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{profile?.phone || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Date of Birth</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Gender</Label>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <span className="capitalize">{profile?.gender?.toLowerCase() || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        {profile?.address && (
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm">Address</Label>
                                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>{profile.address}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your password to secure your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {passwordSuccess && (
                            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    Your password has been changed successfully!
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        placeholder="Enter your current password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        required
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    If this is your first login, your current password is your phone number.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        required
                                        minLength={8}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Password must be at least 8 characters with uppercase, lowercase, and a number.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm your new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        required
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>

                            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800 dark:text-amber-200">
                                    After changing your password, you will need to use the new password to log in.
                                </AlertDescription>
                            </Alert>

                            <Button type="submit" disabled={passwordLoading} className="w-full sm:w-auto">
                                {passwordLoading ? 'Changing Password...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PatientSettings;
