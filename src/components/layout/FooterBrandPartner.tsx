
export const FooterBrandPartner = () => {
    return (
        <a
            href="https://resonira.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Resonira Technologies"
            className="block w-full relative group overflow-hidden"
        >
            {/* Background Base - Matches Footer */}
            <div className="absolute inset-0 bg-slate-950" />

            {/* Image Container */}
            <div className="relative w-full h-[140px] md:h-[170px] flex items-center justify-center">
                {/* The Banner Image - Optimized WebP with responsive srcset */}
                <picture>
                    <source
                        type="image/webp"
                        srcSet="/optimized/resonira-partner-sm.webp 480w, /optimized/resonira-partner-md.webp 800w, /optimized/resonira-partner-lg.webp 1200w, /optimized/resonira-partner.webp 1400w"
                        sizes="100vw"
                    />
                    <img
                        src="/images/resonira-partner.jpeg"
                        alt="Resonira Technologies"
                        className="w-full h-full object-cover opacity-90"
                        width="1400"
                        height="170"
                        loading="lazy"
                        decoding="async"
                    />
                </picture>

                {/* Gradient Overlay: Left & Right Fades (Horizontal Blending) */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />

                {/* Gradient Overlay: Top & Bottom Fades (Vertical Blending) */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900" />

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
        </a>
    );
};
