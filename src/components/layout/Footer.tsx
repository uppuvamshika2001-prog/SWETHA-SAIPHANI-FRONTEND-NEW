import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { FooterBrandPartner } from "./FooterBrandPartner";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer id="contact" className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Clinic Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/optimized/swetha-saiphani-logo.webp" alt="Swetha SaiPhani Clinic" className="h-[6.5rem] w-auto" width="104" height="104" loading="lazy" />
                            <span className="text-4xl font-extrabold leading-[2.75rem] text-white">Swetha SaiPhani Clinic</span>
                        </div>
                        <p className="text-sm opacity-60 leading-relaxed">
                            Providing world-class healthcare with a personal touch. Your health is our priority.
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                            <a href="https://www.facebook.com/profile.php?id=61586434084791" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-full transition-colors text-white">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/swethasaiphani_clinics?igsh=bWN1YXNlaWdzcXg=" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-pink-600 rounded-full transition-colors text-white">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://www.google.com/maps/search/?api=1&query=Karimnagar,Telangana" target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-green-600 rounded-full transition-colors text-white">
                                <MapPin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Contact Us */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-blue-500" />
                                <span>9160244109, 8121418999</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-blue-500" />
                                <a href="mailto:swethasaiphaniclinic@gmail.com" className="hover:text-blue-400 transition-colors">
                                    swethasaiphaniclinic@gmail.com
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                <span>Karimnagar, Telangana</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="#services" className="hover:text-blue-400 transition-colors">Services</a></li>
                            <li><a href="#doctors" className="hover:text-blue-400 transition-colors">Doctors</a></li>
                            <li><a href="#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
                            <li><Link to="/patient/login" className="hover:text-blue-400 transition-colors">Patient Portal</Link></li>
                        </ul>
                    </div>
                </div>


            </div>

            {/* Digital Partner Banner - Full Width Outside Container */}
            <FooterBrandPartner />

            {/* Copyright & Credits */}
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center py-8 gap-4">
                    <p className="text-sm text-slate-400">
                        &copy; {currentYear} Swetha SaiPhani Clinic. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                        <span>Designed & Developed by</span>
                        <a
                            href="https://resonira.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-400 hover:text-blue-300 transition-colors hover:underline decoration-blue-400/30 underline-offset-4"
                        >
                            Resonira Technologies
                        </a>
                        <span className="text-slate-600 border-l border-slate-700 pl-2 ml-1">+91 91542 89324</span>
                    </div>
                </div>
            </div>

        </footer>
    );
};
