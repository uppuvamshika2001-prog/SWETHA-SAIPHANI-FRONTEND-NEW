import { useNavigate, Link } from "react-router-dom";
import { servicesData } from "@/data/servicesData";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const ServicesSection = () => {
    return (
        <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Departments</span>
                    <h2 className="mt-3 text-slate-900 dark:text-white">
                        Our Medical Services
                    </h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                        We provide comprehensive medical solutions with top-tier specialists and advanced technology.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {servicesData.map((service, index) => (
                        <div
                            key={index}
                            className="group relative p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${service.color} transition-colors`}>
                                <service.icon className="w-7 h-7" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">
                                {service.title}
                            </h3>

                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {service.shortDescription}
                            </p>

                            <Link
                                to={`/services/${service.slug}`}
                                className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                                View Details
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
