import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Loader2, Pencil, X, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/services/api";
import { toast } from "sonner";

interface ProfileData {
    displayName: string;
    contactNumber: string;
    email: string;
}

interface HospitalData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // System Preferences state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // Original profile data (for cancel functionality)
    const [originalProfileData, setOriginalProfileData] = useState<ProfileData>({
        displayName: "",
        contactNumber: "",
        email: "",
    });

    // Profile form state
    const [profileData, setProfileData] = useState<ProfileData>({
        displayName: "",
        contactNumber: "",
        email: "",
    });

    // Hospital profile state
    const [isEditingHospital, setIsEditingHospital] = useState(false);
    const [savingHospital, setSavingHospital] = useState(false);
    const [hospitalData, setHospitalData] = useState<HospitalData>({
        name: "Swetha SaiPhani Clinic",
        email: "admin@hospital.com",
        phone: "+91 98765 43210",
        address: "Karimnagar, Telangana",
    });
    const [originalHospitalData, setOriginalHospitalData] = useState<HospitalData>({
        name: "Swetha SaiPhani Clinic",
        email: "admin@hospital.com",
        phone: "+91 98765 43210",
        address: "Karimnagar, Telangana",
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch current user profile on load
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const user = await api.get<any>('/users/me');
                setProfileData({
                    displayName: user.full_name || user.name || "Admin",
                    contactNumber: user.phone || "",
                    email: user.email || "",
                });
                setOriginalProfileData({
                    displayName: user.full_name || user.name || "Admin",
                    contactNumber: user.phone || "",
                    email: user.email || "",
                });
            } catch (error) {
                console.error("Failed to fetch profile", error);
                // Use defaults from localStorage if API fails
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        setProfileData({
                            displayName: parsed.full_name || parsed.name || "Admin",
                            contactNumber: parsed.phone || "",
                            email: parsed.email || "",
                        });
                    } catch { }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async () => {
        setSaving(true);
        try {
            // Split displayName into firstName and lastName
            const names = profileData.displayName.trim().split(' ');
            const firstName = names[0] || "";
            const lastName = names.slice(1).join(' ') || "";

            await api.updateProfile({
                firstName,
                lastName,
                phone: profileData.contactNumber,
                email: profileData.email,
            });
            toast.success("Profile updated successfully");
            setIsEditing(false);
            // Update original data after successful save
            setOriginalProfileData({ ...profileData });
        } catch (error: any) {
            console.error("Failed to update profile", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            toast.error("Please fill in all password fields");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }

        setChangingPassword(true);
        try {
            await api.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success("Password changed successfully");
            setPasswordDialogOpen(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            console.error("Failed to change password", error);
            toast.error(error.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <SettingsIcon className="h-6 w-6" />
                        Settings
                    </h1>
                    <p className="text-muted-foreground">Manage system configurations</p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Personal Profile</CardTitle>
                                <CardDescription>Update your personal information and login credentials</CardDescription>
                            </div>
                            {!loading && !isEditing && (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                                {getInitials(profileData.displayName || "AD")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold text-lg">{profileData.displayName || "Administrator"}</h3>
                                            <p className="text-sm text-muted-foreground">{profileData.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input
                                                value={profileData.displayName}
                                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                                placeholder="Enter your name"
                                                disabled={!isEditing}
                                                className={!isEditing ? "bg-muted" : ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                placeholder="Enter your email"
                                                disabled={!isEditing}
                                                className={!isEditing ? "bg-muted" : ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contact Number</Label>
                                            <Input
                                                value={profileData.contactNumber}
                                                onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                disabled={!isEditing}
                                                className={!isEditing ? "bg-muted" : ""}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {isEditing ? (
                                            <>
                                                <Button onClick={handleUpdateProfile} disabled={saving}>
                                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                                <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                                                    Change Password
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setProfileData({ ...originalProfileData });
                                                        setIsEditing(false);
                                                    }}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                                                Change Password
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Hospital Profile</CardTitle>
                                <CardDescription>General hospital information</CardDescription>
                            </div>
                            {!isEditingHospital && (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingHospital(true)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Hospital Name</Label>
                                    <Input
                                        value={hospitalData.name}
                                        onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })}
                                        disabled={!isEditingHospital}
                                        className={!isEditingHospital ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input
                                        type="email"
                                        value={hospitalData.email}
                                        onChange={(e) => setHospitalData({ ...hospitalData, email: e.target.value })}
                                        disabled={!isEditingHospital}
                                        className={!isEditingHospital ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={hospitalData.phone}
                                        onChange={(e) => setHospitalData({ ...hospitalData, phone: e.target.value })}
                                        disabled={!isEditingHospital}
                                        className={!isEditingHospital ? "bg-muted" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input
                                        value={hospitalData.address}
                                        onChange={(e) => setHospitalData({ ...hospitalData, address: e.target.value })}
                                        disabled={!isEditingHospital}
                                        className={!isEditingHospital ? "bg-muted" : ""}
                                    />
                                </div>
                            </div>
                            {isEditingHospital ? (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={() => {
                                            // Here you would call an API to save hospital settings
                                            toast.success("Hospital profile updated successfully");
                                            setOriginalHospitalData({ ...hospitalData });
                                            setIsEditingHospital(false);
                                        }}
                                        disabled={savingHospital}
                                    >
                                        {savingHospital && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setHospitalData({ ...originalHospitalData });
                                            setIsEditingHospital(false);
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Click Edit to modify hospital settings.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Preferences</CardTitle>
                            <CardDescription>Application wide settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-2 border rounded">
                                <span>Enable System Notifications</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setNotificationsEnabled(!notificationsEnabled);
                                        toast.success(`System Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`);
                                    }}
                                    className={notificationsEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
                                >
                                    {notificationsEnabled ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded">
                                <span>Maintenance Mode</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setMaintenanceMode(!maintenanceMode);
                                        toast.success(`Maintenance Mode ${!maintenanceMode ? 'enabled' : 'disabled'}`);
                                    }}
                                    className={maintenanceMode ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-700 border-gray-200"}
                                >
                                    {maintenanceMode ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Change Password Dialog */}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
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
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="Enter new password"
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
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleChangePassword} disabled={changingPassword}>
                            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout >
    );
}
