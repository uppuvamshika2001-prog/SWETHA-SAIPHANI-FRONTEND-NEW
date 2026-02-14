import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
            <div className="mx-auto flex w-full max-w-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                    <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-500" />
                </div>
                <h1 className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-gray-50 mb-2">
                    Access Denied
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 px-4">
                    You do not have permission to access this page. This area is restricted to authorized personnel only.
                </p>
                <div className="flex flex-col gap-2 w-full max-w-[300px]">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="w-full"
                    >
                        Go Back
                    </Button>
                    {user && (
                        <div className="space-y-2 mt-2">
                            <p className="text-sm text-muted-foreground">
                                Signed in as: <span className="font-medium text-foreground">{user.email}</span> ({user.role})
                            </p>
                            <Button
                                onClick={() => navigate(
                                    user.role === 'doctor' ? '/doctor/dashboard' :
                                        user.role === 'admin' ? '/admin/dashboard' :
                                            user.role === 'pharmacist' ? '/pharmacy/dashboard' :
                                                user.role === 'receptionist' ? '/reception/dashboard' :
                                                    user.role === 'lab_technician' ? '/lab/dashboard' :
                                                        '/'
                                )}
                                className="w-full"
                            >
                                Go to My Dashboard
                            </Button>
                            <Button
                                onClick={() => signOut()}
                                variant="ghost"
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                Sign Out
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
