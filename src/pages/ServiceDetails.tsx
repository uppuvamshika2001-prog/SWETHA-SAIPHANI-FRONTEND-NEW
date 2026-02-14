import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { servicesData } from "@/data/servicesData";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Calendar, Phone } from "lucide-react";

export default function ServiceDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const service = servicesData.find(s => s.slug === slug);

    useEffect(() => {
        if (service) {
            document.title = `${service.title} | Swetha SaiPhani Clinic`;
        } else {
            document.title = "Service Not Found | Swetha SaiPhani Clinic";
        }
        window.scrollTo(0, 0);
    }, [service]);

    if (!service) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
                <HomeNavbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Service Not Found</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
                        The service you are looking for does not exist or has been moved.
                    </p>
                    <Button onClick={() => navigate("/")} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Simplified Header - Logo Only */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm py-4">
                <div className="container">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/swetha-saiphani-logo.png" alt="Swetha SaiPhani Clinics" className="h-[6.5rem] w-auto" />
                            <span className="text-4xl font-extrabold leading-[2.75rem] text-[#0099cc]">
                                Swetha SaiPhani Clinic
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className={`relative pt-40 pb-20 lg:pt-48 lg:pb-28 ${service.color.split(' ')[1]} dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800`}>
                <div className="container">
                    <div className="max-w-3xl">
                        <Link to="/#services" className="inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 mb-6 transition-colors" onClick={() => {
                            // Small timeout to allow navigation to complete before scrolling
                            setTimeout(() => {
                                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Services
                        </Link>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-4 rounded-2xl bg-white shadow-sm ${service.color.split(' ')[0]}`}>
                                <service.icon className="w-8 h-8" />
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 text-sm font-medium border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                                Medical Service
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                            {service.title}
                        </h1>
                        <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                            {service.shortDescription}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="py-16 md:py-24">
                <div className="container">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Main Info - Now Full Width since Sidebar is removed */}
                        <div className="lg:col-span-3 space-y-12">
                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About This Service</h2>
                                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Key Features & Treatments</h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {service.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/20">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Expert Team</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-0">
                                    Our {service.title} department is led by experienced {service.specialists} dedicated to providing the best possible care.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
