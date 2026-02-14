import { Play, MessageSquareHeart } from "lucide-react";

interface VideoTestimonial {
    id: string;
    youtubeId: string;
    title: string;
    subtitle: string;
    description: string;
}

export const PatientFeedbackSection = () => {
    const videoTestimonials: VideoTestimonial[] = [
        {
            id: "1",
            youtubeId: "ANqyjpa8eG0",
            title: "Mrs. Anwar Jahan",
            subtitle: "Robotic Knee Replacement",
            description: "Watch the full testimonial to see how our expert care makes a difference."
        },
        {
            id: "2",
            youtubeId: "qE8ZVzNnj3A",
            title: "Mrs. A. Durga",
            subtitle: "Age 55 | Robotic Knee Replacement",
            description: "Watch the full testimonial to see how our expert care makes a difference."
        },
    ];

    return (
        <section className="py-20 bg-white dark:bg-slate-950">
            <div className="container">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
                        Patient Feedback & Success Stories
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                        Hear directly from our patients about their journey to recovery and the care they received at Swetha SaiPhani Clinic.
                    </p>
                </div>

                {/* Video Testimonials Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                    {videoTestimonials.map((video) => (
                        <div key={video.id} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 flex flex-col group hover:shadow-xl transition-shadow duration-300">
                            {/* Video Thumbnail Container */}
                            <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <img
                                    src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                                    alt={video.title}
                                    width={640}
                                    height={360}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                                    }}
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                                {/* Play Button */}
                                <a
                                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="w-16 h-12 bg-[#FF0000] rounded-xl flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                                    </div>
                                </a>

                                {/* Optional Badge - Mimicking the 'Accredited Hospital' badge from screenshot if needed */}
                                {/* <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <span>From an accredited hospital</span>
                                </div> */}
                            </div>

                            {/* Content */}
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-1">
                                        <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                                            Success Story: Transforming Lives
                                        </h3>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed pl-14">
                                    {video.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
