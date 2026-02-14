import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Lock, Bell, Shield, Mail, Phone, Stethoscope, FileText, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/services/api";

export default function DoctorSettings() {
    const { user, profile, refreshProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [bio, setBio] = useState("");

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || "");
            // Mocking these for now as backend might not have them in the flat profile yet
            setPhone(profile.phone || "");
            setSpecialization(profile.specialization || "General Physician");
            setBio(profile.bio || "Dedicated healthcare professional providing comprehensive medical care.");
        }
    }, [profile]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const names = fullName.trim().split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || '';

            await api.updateProfile({
                firstName,
                lastName,
                phone,
                specialization,
            });
            await refreshProfile();
            toast.success("Profile updated successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            await api.changePassword({
                currentPassword,
                newPassword
            });
            toast.success("Password updated successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DashboardLayout role="doctor">
            <div className="space-y-8 container max-w-5xl mx-auto py-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Settings className="h-8 w-8 text-primary" />
                            Profile Settings
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                            Manage your professional profile and account security.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[300px_1fr]">

                    {/* Left Sidebar - Profile Card */}
                    <div className="space-y-6">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-primary/10 to-blue-500/10"></div>
                            <CardContent className="pt-0 -mt-12 text-center pb-8">
                                <div className="flex justify-center mb-4">
                                    <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-md">
                                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                                            {profile ? getInitials(profile.full_name) : 'D'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Dr. {profile?.full_name || 'Doctor'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{user?.email}</p>

                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                    <Shield className="h-3 w-3" />
                                    Medical Practitioner
                                </div>

                                <Separator className="my-6" />

                                <div className="space-y-3 text-left px-2">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="truncate">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span>{phone || "No phone provided"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <Stethoscope className="h-4 w-4 text-slate-400" />
                                        <span>{specialization}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Content */}
                    <div className="space-y-6">
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="w-full justify-start h-12 bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none p-0 mb-6 space-x-6">
                                <TabsTrigger
                                    value="profile"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-slate-500 data-[state=active]:text-primary font-medium text-base transition-all"
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Professional Profile
                                </TabsTrigger>
                                <TabsTrigger
                                    value="security"
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-slate-500 data-[state=active]:text-primary font-medium text-base transition-all"
                                >
                                    <Lock className="h-4 w-4 mr-2" />
                                    Account Security
                                </TabsTrigger>
                            </TabsList>

                            {/* Profile Tab */}
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-xl">Doctor Details</CardTitle>
                                        <CardDescription>Update your professional information and contact details.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fullName" className="text-slate-600">Full Name</Label>
                                                    <Input
                                                        id="fullName"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        className="h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-slate-600">Email Address (Login ID)</Label>
                                                    <Input id="email" defaultValue={user?.email} disabled className="h-11 bg-slate-50 text-slate-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
                                                    <Input
                                                        id="phone"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        placeholder="+91..."
                                                        className="h-11"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="specialization" className="text-slate-600">Specialization</Label>
                                                    <Input
                                                        id="specialization"
                                                        value={specialization}
                                                        onChange={(e) => setSpecialization(e.target.value)}
                                                        className="h-11"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bio" className="text-slate-600">Professional Bio</Label>
                                                <Textarea
                                                    id="bio"
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    className="min-h-[120px] resize-none"
                                                    placeholder="Tell patients about your medical background and expertise..."
                                                />
                                            </div>
                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 min-w-[140px]">
                                                    {isLoading ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Security Tab */}
                            <TabsContent value="security" className="mt-0 space-y-6">
                                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                    <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-xl text-slate-800 dark:text-white">Change Password</CardTitle>
                                        <CardDescription className="text-slate-500">Ensure your account is using a strong password.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <form onSubmit={handlePasswordChange} className="space-y-6">
                                            <div className="space-y-2.5">
                                                <Label htmlFor="current" className="text-slate-700 font-medium">Current Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="current"
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="h-11 pr-10"
                                                        placeholder="Enter current password"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    >
                                                        {showCurrentPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="new" className="text-slate-700 font-medium">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="new"
                                                            type={showNewPassword ? "text" : "password"}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            className="h-11 pr-10"
                                                            placeholder="Enter new password"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="confirm" className="text-slate-700 font-medium">Confirm Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirm"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            className="h-11 pr-10"
                                                            placeholder="Confirm new password"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-6">
                                                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 min-w-[160px] h-11 text-base">
                                                    {isLoading ? "Updating..." : "Update Password"}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
