import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope, MapPin, Facebook, Instagram, LogIn, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const HomeNavbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const navLinks = [
        { name: "Home", id: "home" },
        { name: "Services", id: "services" },
        { name: "Doctors", id: "doctors" },
        { name: "About Us", id: "about" },
        { name: "Contact", id: "contact" },
    ];

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
                ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm py-4"
                : "bg-transparent py-4 sm:py-6"
                }`}
        >
            <div className="container">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection("home")}>
                        <img src="/optimized/swetha-saiphani-logo.webp" alt="Swetha SaiPhani Clinics" className="h-[6.5rem] w-auto" width="104" height="104" fetchpriority="high" />
                        <span className="text-4xl font-extrabold leading-[2.75rem] text-[#0099cc]">
                            Swetha SaiPhani Clinic
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.id)}
                                className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {link.name}
                            </button>
                        ))}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <a href="https://www.facebook.com/profile.php?id=61586434084791" target="_blank" rel="noopener noreferrer" className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-full text-blue-600 transition-colors">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href="https://www.instagram.com/swethasaiphani_clinics?igsh=bWN1YXNlaWdzcXg=" target="_blank" rel="noopener noreferrer" className="p-1.5 bg-pink-50 hover:bg-pink-100 rounded-full text-pink-600 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a href="https://www.google.com/maps/search/?api=1&query=Karimnagar,Telangana" target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-50 hover:bg-green-100 rounded-full text-green-600 transition-colors">
                                    <MapPin className="w-4 h-4" />
                                </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <span>Karimnagar, Telangana</span>
                            </div>
                            
                            <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="default" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4">
                                            <LogIn className="w-4 h-4" />
                                            Login
                                            <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl">
                                        <DropdownMenuItem asChild>
                                            <Link to="/patient/login" className="cursor-pointer w-full text-slate-700 hover:text-blue-600">Patient Portal</Link>
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <DropdownMenuItem asChild>
                                            <Link to="/doctor/login" className="cursor-pointer w-full text-slate-700 hover:text-blue-600">Doctor</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/reception/login" className="cursor-pointer w-full text-slate-700 hover:text-blue-600">Receptionist</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/pharmacy/login" className="cursor-pointer w-full text-slate-700 hover:text-blue-600">Pharmacist</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/lab/login" className="cursor-pointer w-full text-slate-700 hover:text-blue-600">Lab Technician</Link>
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <DropdownMenuItem asChild>
                                            <Link to="/admin/login" className="cursor-pointer w-full text-blue-600 font-medium hover:text-blue-700">Administrator</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6 text-slate-900 dark:text-white" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-900 dark:text-white" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shadow-lg md:hidden">
                    <div className="flex flex-col p-4 space-y-4">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => scrollToSection(link.id)}
                                className="text-left py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {link.name}
                            </button>
                        ))}
                        
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 flex flex-col gap-3">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Logins</p>
                           <Link to="/patient/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">Patient Portal</Link>
                           <Link to="/doctor/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">Doctor</Link>
                           <Link to="/reception/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">Receptionist</Link>
                           <Link to="/pharmacy/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">Pharmacist</Link>
                           <Link to="/lab/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">Lab Technician</Link>
                           <Link to="/admin/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Administrator</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
