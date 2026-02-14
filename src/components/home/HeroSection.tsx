import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

const doctorImages = [
    { src: "/dr_sai_phani_chandra_v2.png", alt: "Dr. B. Sai Phani Chandra - Orthopaedics" },
    { src: "/dr_swetha_pendyala_v2.jpg", alt: "Dr. Swetha Pendyala - Neurosurgery" },
    { src: "/dr_roshan_kumar_jaiswal_v2.png", alt: "Dr. Roshan Kumar Jaiswal - Paediatric Orthopaedics" },
    { src: "/dr_hariprakash_v2.png", alt: "Dr. D. Hari Prakash - Orthopaedics" },
    { src: "/dr_ravikanti_nagaraju.jpg", alt: "Dr. Ravikanti Nagaraju - General Medicine" },
];

export const HeroSection = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % doctorImages.length);
    }, []);

    useEffect(() => {
        const interval = setInterval(nextImage, 2500);
        return () => clearInterval(interval);
    }, [nextImage]);

    return (
        <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 pt-32 pb-16 lg:pt-48 lg:pb-32">
            <div className="container">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">

                    {/* Content */}
                    <div className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                            <Activity className="w-4 h-4" />
                            <span>Leading Healthcare Provider</span>
                        </div>

                        <h1>
                            Compassionate Care, <br />
                            <span className="text-blue-600">Advanced Healing</span>
                        </h1>

                        <p className="max-w-2xl mx-auto lg:mx-0 leading-relaxed text-slate-600 dark:text-slate-400">
                            Dedicated to restoring your health with personalized medical excellence. We blend cutting-edge technology with human touch to ensure your well-being at every step.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Link to="/book-appointment">
                                <Button size="lg" className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                    Book an Appointment <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
                                Learn More
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">50+</div>
                                <div className="text-sm text-slate-500">Expert Doctors</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">10k+</div>
                                <div className="text-sm text-slate-500">Happy Patients</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">24/7</div>
                                <div className="text-sm text-slate-500">Emergency Care</div>
                            </div>
                        </div>
                    </div>

                    {/* Image Carousel */}
                    <div className="flex-1 relative w-full max-w-xl lg:max-w-none">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl rotate-3 opacity-20 blur-2xl dark:opacity-40"></div>

                            <div className="relative rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700 overflow-hidden aspect-[4/5] sm:aspect-[4/3] lg:aspect-[3/4]">
                                {doctorImages.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentImageIndex === index ? "opacity-100" : "opacity-0"
                                            }`}
                                    >
                                        <OptimizedImage
                                            src={img.src}
                                            alt={img.alt}
                                            width={800}
                                            height={1000}
                                            className="w-full h-full object-cover"
                                            loading={index === 0 ? "eager" : "lazy"}
                                            fetchPriority={index === 0 ? "high" : "low"}
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                                    <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">Best Hospital</div>
                                    <div className="text-xs text-slate-500">Award Winner 2024</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};
