import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    IndianRupee,
    Users,
    Calendar,
    FileText,
    Pill,
    FlaskConical,
    Receipt,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
    Activity,
    UserCog,
    Stethoscope,
    ClipboardList,
    MapPin,
    ChevronDown,
    Package,
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { notificationService } from '@/services/notificationService';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    subItems?: NavItem[];
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    role: AppRole;
}

const getNavItems = (role: AppRole, basePath: string): NavItem[] => {
    const baseItems: NavItem[] = [
        { title: 'Dashboard', href: `${basePath}/dashboard`, icon: <LayoutDashboard className="h-5 w-5" /> },
    ];

    switch (role) {
        case 'admin':
            return [
                ...baseItems,
                {
                    title: 'OPD Management',
                    href: '#',
                    icon: <Activity className="h-5 w-5" />,
                    subItems: [
                        { title: 'Consultation', href: `${basePath}/opd/consultation`, icon: <Stethoscope className="h-4 w-4" /> },
                        { title: 'Prescriptions', href: `${basePath}/opd/prescriptions`, icon: <ClipboardList className="h-4 w-4" /> },
                    ]
                },
                {
                    title: 'Pathology',
                    href: `${basePath}/pathology/dashboard`,
                    icon: <FlaskConical className="h-5 w-5" />,
                },
                { title: 'Staff Management', href: `${basePath}/staff`, icon: <UserCog className="h-5 w-5" /> },
                { title: 'Patients', href: `${basePath}/patients`, icon: <Users className="h-5 w-5" /> },
                { title: 'Appointments', href: `${basePath}/appointments`, icon: <Calendar className="h-5 w-5" /> },
                { title: 'Departments', href: `${basePath}/departments`, icon: <Activity className="h-5 w-5" /> },
                { title: 'Pharmacy', href: `${basePath}/pharmacy`, icon: <Pill className="h-5 w-5" /> },
                { title: 'Billing', href: `${basePath}/billing`, icon: <IndianRupee className="h-5 w-5" /> },
                { title: 'Analytics', href: `${basePath}/analytics`, icon: <Activity className="h-5 w-5" /> },
                { title: 'Reports', href: `${basePath}/reports`, icon: <FileText className="h-5 w-5" /> },
                { title: 'Settings', href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
            ];
        case 'doctor':
            return [
                ...baseItems,
                { title: 'My Appointments', href: `${basePath}/appointments`, icon: <Calendar className="h-5 w-5" /> },
                { title: 'My Patients', href: `${basePath}/patients`, icon: <Users className="h-5 w-5" /> },
                { title: 'Medical Records', href: `${basePath}/records`, icon: <FileText className="h-5 w-5" /> },
                { title: 'Prescriptions', href: `${basePath}/prescriptions`, icon: <ClipboardList className="h-5 w-5" /> },
                { title: 'Lab Results', href: `${basePath}/lab-results`, icon: <FlaskConical className="h-5 w-5" /> },
            ];

        case 'receptionist':
            return [
                ...baseItems,
                { title: 'Lab Results', href: `${basePath}/lab-results`, icon: <FlaskConical className="h-5 w-5" /> },
                { title: 'Patient Registration', href: `${basePath}/patients`, icon: <Users className="h-5 w-5" /> },
                { title: 'Appointments', href: `${basePath}/appointments`, icon: <Calendar className="h-5 w-5" /> },
                { title: 'Billing', href: `${basePath}/billing`, icon: <IndianRupee className="h-5 w-5" /> },
                { title: 'Staff Management', href: `${basePath}/staff`, icon: <UserCog className="h-5 w-5" /> },
                { title: 'Settings', href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
            ];
        case 'pharmacist':
            return [
                ...baseItems,
                { title: 'Pending Orders', href: `${basePath}/orders`, icon: <ClipboardList className="h-5 w-5" /> },
                { title: 'Inventory', href: `${basePath}/inventory`, icon: <Pill className="h-5 w-5" /> },
                { title: 'Dispensing', href: `${basePath}/dispensing`, icon: <Package className="h-5 w-5" /> },
                { title: 'Billing', href: `${basePath}/billing`, icon: <IndianRupee className="h-5 w-5" /> },
                { title: 'Low Stock Alerts', href: `${basePath}/alerts`, icon: <Bell className="h-5 w-5" /> },
            ];
        case 'lab_technician':
            return [
                ...baseItems,
                { title: 'Pending Tests', href: `${basePath}/pending-tests`, icon: <FlaskConical className="h-5 w-5" /> },
                { title: 'Sample Collection', href: `${basePath}/sample-collection`, icon: <ClipboardList className="h-5 w-5" /> },
                { title: 'Results Entry', href: `${basePath}/results-entry`, icon: <FileText className="h-5 w-5" /> },
                { title: 'Test Catalog', href: `${basePath}/test-catalog`, icon: <Activity className="h-5 w-5" /> },
            ];
        case 'patient':
            return [
                ...baseItems,
                { title: 'Lab', href: `${basePath}/lab-results`, icon: <FlaskConical className="h-5 w-5" /> },
                { title: 'Medical Records', href: `${basePath}/records`, icon: <FileText className="h-5 w-5" /> },
                { title: 'Prescriptions', href: `${basePath}/prescriptions`, icon: <Pill className="h-5 w-5" /> },
                { title: 'Billing', href: `${basePath}/billing`, icon: <IndianRupee className="h-5 w-5" /> },
                { title: 'Reports', href: `${basePath}/reports`, icon: <ClipboardList className="h-5 w-5" /> },
                { title: 'Settings', href: `${basePath}/profile`, icon: <Settings className="h-5 w-5" /> },
            ];
        default:
            return baseItems;
    }
};

const roleLabels: Record<AppRole, string> = {
    admin: 'Hospital Administrator',
    doctor: 'Doctor',
    receptionist: 'Receptionist',
    pharmacist: 'Pharmacist',
    lab_technician: 'Lab Technician',
    patient: 'Patient',
};

const roleBasePaths: Record<AppRole, string> = {
    admin: '/admin',
    doctor: '/doctor',
    receptionist: '/reception',
    pharmacist: '/pharmacy',
    lab_technician: '/lab',
    patient: '/patient',
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, signOut } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Notification States
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const basePath = roleBasePaths[role];
    const navItems = getNavItems(role, basePath);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            // Ensure we count unread
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
            // Fallback or empty state
        }
    };

    useEffect(() => {
        if (profile) {
            fetchNotifications();
            // Poll every 60s
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await notificationService.markAllAsRead();
            setNotifications([]); // Clear the list from view
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                // Decrease unread count safely
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Failed to mark read', error);
            }
        }

        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-orange-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-blue-500';
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-300',
                    sidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <img src="/swetha-saiphani-logo.png" alt="Swetha SaiPhani Clinic" className="h-8 w-auto" />
                            <span className="font-bold text-lg">Swetha SaiPhani Clinics</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                        <ChevronRight className={cn('h-5 w-5 transition-transform', sidebarOpen && 'rotate-180')} />
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {navItems.map((item) => {
                            if (item.subItems) {
                                return (
                                    <Collapsible key={item.title} className="group/collapsible">
                                        <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                                            {item.icon}
                                            {sidebarOpen && (
                                                <>
                                                    <span className="flex-1 text-left">{item.title}</span>
                                                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                                </>
                                            )}
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            {item.subItems.map((subItem) => {
                                                const isSubActive = location.pathname === subItem.href;
                                                return (
                                                    <Link
                                                        key={subItem.href}
                                                        to={subItem.href}
                                                        className={cn(
                                                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors pl-9',
                                                            isSubActive
                                                                ? 'bg-sidebar-primary/10 text-sidebar-primary'
                                                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                                        )}
                                                    >
                                                        {sidebarOpen && <span className="flex-1 text-left">{subItem.title}</span>}
                                                    </Link>
                                                );
                                            })}
                                        </CollapsibleContent>
                                    </Collapsible>
                                );
                            }

                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                    )}
                                >
                                    {item.icon}
                                    {sidebarOpen && (
                                        <>
                                            <span className="flex-1 text-left">{item.title}</span>
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                {/* User Section */}
                <div className="p-4 border-t border-sidebar-border">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {profile ? getInitials(profile.full_name) : 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {sidebarOpen && (
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{roleLabels[role]}</p>
                                    </div>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border transform transition-transform lg:hidden',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <img src="/swetha-saiphani-logo.png" alt="Swetha SaiPhani Clinic" className="h-8 w-auto" />
                        <span className="font-bold text-lg">Swetha SaiPhani Clinics</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 py-4">
                    <nav className="px-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                    )}
                                >
                                    {item.icon}
                                    <span className="flex-1 text-left">{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </ScrollArea>

                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 p-2">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {profile ? getInitials(profile.full_name) : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{roleLabels[role]}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full mt-2 justify-start text-destructive"
                        onClick={handleSignOut}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">{roleLabels[role]} Portal</h1>
                            <p className="text-sm text-muted-foreground hidden sm:block">
                                Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center text-sm text-muted-foreground mr-2 bg-muted/50 px-3 py-1.5 rounded-full">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>Karimnagar, Telangana</span>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 p-0.5 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    <span>Notifications</span>
                                    {notifications.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={handleMarkAllRead}
                                        >
                                            Clear All
                                        </Button>
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-[300px]">
                                    {notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className={cn(
                                                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                                    !notification.read && "bg-muted/50"
                                                )}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getNotificationColor(notification.type))} />
                                                    <span className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                                                        {notification.title}
                                                    </span>
                                                    {notification.read && <span className="ml-auto text-[10px] text-muted-foreground">Read</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground ml-4">{notification.message}</p>
                                                <span className="text-[10px] text-muted-foreground ml-4 mt-1">
                                                    {getTimeAgo(notification.createdAt)}
                                                </span>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No notifications
                                        </div>
                                    )}
                                </ScrollArea>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="justify-center text-primary cursor-pointer p-2">
                                    View All Notifications
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="hidden sm:block">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                {profile ? getInitials(profile.full_name) : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden md:inline">{profile?.full_name || 'User'}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Profile Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-2 lg:p-4">{children}</div>
                </main>
            </div>
        </div>
    );
}
