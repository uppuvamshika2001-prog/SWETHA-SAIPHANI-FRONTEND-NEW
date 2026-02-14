import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Quote, Star, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
    {
        id: 1,
        name: "Rajesh Kumar",
        role: "Knee Replacement Patient",
        content: "Dr. Sai Phani and his team are exceptional. The robotic surgery was precise, and my recovery was much faster than I expected. I'm back to my morning walks within weeks!",
        rating: 5,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
    },
    {
        id: 2,
        name: "Sunitha Reddy",
        role: "Neurological Care",
        content: "The care I received at Swetha SaiPhani Clinic for my chronic migraines was life-changing. Dr. Swetha is so patient and knowledgeable. The staff is also very supportive.",
        rating: 5,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sunitha"
    },
    {
        id: 3,
        name: "Amit Sharma",
        role: "Trauma Recovery",
        content: "After my accident, I was worried about my leg mobility. Thanks to Dr. Roshan's pediatric expertise and the advanced facilities here, I am walking perfectly now.",
        rating: 5,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit"
    },
    {
        id: 4,
        name: "Priya Lakshmi",
        role: "Sports Injury",
        content: "Professional, clean, and highly efficient. Dr. Hariprakash treated my ACL tear with great care. The physiotherapy sessions were also excellent.",
        rating: 4,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya"
    }
];

export const TestimonialsSection = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        loop: true,
        skipSnaps: false,
        dragFree: true
    });

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
            <div className="container">
                <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
                            <Activity className="w-4 h-4" />
                            <span>Real Stories, Real Results</span>
                        </div>
                        <h2 className="text-slate-900 dark:text-white mb-6">
                            Patient Feedback & <span className="text-blue-600 font-extrabold italic">Success Stories</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Discover why thousands of patients trust us with their health. Your well-being is our greatest achievement and the heart of everything we do.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full border-slate-200 dark:border-slate-800 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                            onClick={scrollPrev}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full border-slate-200 dark:border-slate-800 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                            onClick={scrollNext}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>
                </div>

                <div className="embla" ref={emblaRef}>
                    <div className="flex gap-6 py-4">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4"
                            >
                                <div className="h-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative group hover:border-blue-500/50 transition-all duration-300">
                                    <div className="absolute top-6 right-8 text-slate-100 dark:text-slate-700/50 group-hover:text-blue-100 dark:group-hover:text-blue-900/20 transition-colors duration-300">
                                        <Quote className="w-16 h-16 rotate-12" />
                                    </div>

                                    <div className="flex gap-1 mb-6 relative z-10">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                                            />
                                        ))}
                                    </div>

                                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 font-medium leading-relaxed italic relative z-10">
                                        "{testimonial.content}"
                                    </p>

                                    <div className="flex items-center gap-4 mt-auto border-t border-slate-100 dark:border-slate-700 pt-6 relative z-10">
                                        <Avatar className="h-12 w-12 border-2 border-blue-100 dark:border-blue-900 ring-4 ring-white dark:ring-slate-800">
                                            <AvatarImage src={testimonial.image} />
                                            <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">{testimonial.name}</h4>
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <div className="inline-block p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4 px-6 py-2">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Join <span className="text-slate-900 dark:text-white font-bold">5,000+</span> happy patients
                            </p>
                            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                            <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4">
                                Share Your Story
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
