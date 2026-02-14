import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope, MapPin, Facebook, Instagram } from "lucide-react";

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
                    </div>
                </div>
            )}
        </nav>
    );
};
