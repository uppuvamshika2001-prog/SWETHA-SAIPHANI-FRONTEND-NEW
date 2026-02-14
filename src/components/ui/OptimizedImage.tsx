import { useState, useRef, useEffect } from "react";

interface OptimizedImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    loading?: "lazy" | "eager";
    fetchpriority?: "high" | "low" | "auto";
    sizes?: string;
    style?: React.CSSProperties;
    onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Get the WebP optimized path for a given image.
 * Falls back to the original image if the webp version doesn't exist.
 */
function getOptimizedSrc(originalSrc: string): {
    webp: string;
    webpSm: string;
    webpMd: string;
    original: string;
} {
    // Strip leading slash and path info
    const filename = originalSrc.startsWith("/")
        ? originalSrc.slice(1)
        : originalSrc;
    const baseName = filename
        .replace(/^images\//, "")
        .replace(/\.[^.]+$/, "");

    return {
        webp: `/optimized/${baseName}.webp`,
        webpSm: `/optimized/${baseName}-sm.webp`,
        webpMd: `/optimized/${baseName}-md.webp`,
        original: originalSrc,
    };
}

/**
 * OptimizedImage - A performance-focused image component.
 * 
 * Features:
 * - Serves WebP images with original fallback
 * - Uses srcset for responsive images  
 * - Explicit width/height to prevent CLS
 * - Native lazy loading support
 * - fetchPriority for above-the-fold images
 */
export const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    className = "",
    loading = "lazy",
    fetchpriority = "auto",
    sizes = "(max-width: 480px) 480px, (max-width: 800px) 800px, 100vw",
    style,
    onError,
}: OptimizedImageProps) => {
    const paths = getOptimizedSrc(src);
    const [useFallback, setUseFallback] = useState(false);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (!useFallback) {
            setUseFallback(true);
        }
        onError?.(e);
    };

    if (useFallback) {
        return (
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={className}
                loading={loading}
                style={style}
                onError={onError}
            />
        );
    }

    return (
        <picture>
            <source
                type="image/webp"
                srcSet={`${paths.webpSm} 480w, ${paths.webpMd} 800w, ${paths.webp} 1200w`}
                sizes={sizes}
            />
            <img
                src={paths.webp}
                alt={alt}
                width={width}
                height={height}
                className={className}
                loading={loading}
                fetchpriority={fetchpriority}
                style={style}
                onError={handleError}
                decoding={loading === "lazy" ? "async" : "auto"}
            />
        </picture>
    );
};
