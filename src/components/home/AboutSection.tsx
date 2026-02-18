
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

export const AboutSection = () => {
    return (
        <section className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <div className="container">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Image Side */}
                    <div className="flex-1 w-full relative">
                        <div className="relative">
                            <OptimizedImage
                                src="/advanced-medical-care.jpg"
                                alt="Advanced Medical Care at Swetha SaiPhani Clinics"
                                width={800}
                                height={500}
                                className="rounded-2xl shadow-2xl relative z-10 w-full object-cover h-[400px] lg:h-[500px]"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                            {/* Decorative Elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-stripes-blue rounded-xl z-0 opacity-20"></div>
                        </div>

                        {/* Experience Badge */}
                        <div className="absolute top-10 -left-6 bg-blue-600 text-white p-6 rounded-r-xl shadow-lg z-20">
                            <p className="text-4xl font-bold">25+</p>
                            <p className="text-sm font-medium opacity-90">Years Experience</p>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">About Swetha SaiPhani Clinics</span>
                            <h2 className="mt-3 text-slate-900 dark:text-white">
                                Dedication to Your Health & Well-being
                            </h2>
                        </div>

                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                            Swetha SaiPhani Clinics has been a trusted name in healthcare for over two decades. We combine compassionate care with cutting-edge medical technology to provide the best possible outcomes for our patients.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Advanced Medical Infrastructure",
                                "Highly Qualified Doctors Team",
                                "Affordable Health Care Packages",
                                "24/7 Ambulance & Emergency"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="h-12 px-8 text-base bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                                        Discover More
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-blue-700">About Swetha SaiPhani Clinic</DialogTitle>
                                        <DialogDescription className="text-lg">
                                            A legacy of care, a future of health.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 mt-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Our History</h3>
                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                                Established in 2000, Swetha SaiPhani Clinic has grown from a small community clinic to a leading healthcare provider in Karimnagar. Our journey has been defined by a relentless commitment to patient care and medical excellence.
                                            </p>
                                        </div>

                                        <OptimizedImage
                                            src="/hero-patient-room.png"
                                            alt="Clinic Facility"
                                            width={800}
                                            height={256}
                                            className="w-full h-64 object-cover rounded-lg shadow-md"
                                            loading="lazy"
                                            sizes="(max-width: 768px) 100vw, 700px"
                                        />

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    To provide accessible, affordable, and high-quality healthcare services to all sections of society, ensuring that no patient is denied care due to lack of resources.
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">Our Vision</h3>
                                                <p className="text-slate-600 dark:text-slate-300">
                                                    To be the most trusted healthcare partner in the region, known for our clinical expertise, ethical practices, and patient-centric approach.
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">Awards & Recognition</h3>
                                            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                                                <li>Best Community Hospital Award (2022)</li>
                                                <li>Excellence in Patient Safety (2023)</li>
                                                <li>Green Hospital Certification</li>
                                            </ul>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
