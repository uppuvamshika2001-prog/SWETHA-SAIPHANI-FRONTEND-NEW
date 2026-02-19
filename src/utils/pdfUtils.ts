/**
 * Shared PDF Utilities
 * Provides consistent PDF generation with:
 * - A4 dimensions
 * - Centered watermark with transparency
 * - Naming conventions (first vs masked)
 * - Data masking functionality
 */

import jsPDF from 'jspdf';

// Re-export lightweight utilities from pdfCore for backward compatibility.
// Consumers that only need these should import from '@/utils/pdfCore' directly.
export { generatePdfFilename, maskData, resetDownloadCount } from './pdfCore';

/**
 * Get base64 image from URL
 */
export const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            resolve(reader.result as string);
        });
        reader.addEventListener("error", () => {
            reject(new Error("Failed to convert image to base64"));
        });
        reader.readAsDataURL(blob);
    });
};

/**
 * Add watermark to PDF document (centered, with opacity)
 */
export const addWatermark = async (doc: jsPDF): Promise<void> => {
    try {
        const logoUrl = '/saiphani-logo-v3.png'; // Use consistent logo
        const base64Logo = await getBase64ImageFromUrl(logoUrl);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const watermarkWidth = 120; // Large
        const watermarkHeight = 120;
        const centerX = (pageWidth - watermarkWidth) / 2;
        const centerY = (pageHeight - watermarkHeight) / 2;

        // Try to set opacity
        const GState = (doc as any).GState;
        if (GState) {
            // Very light opacity (0.08)
            const gState = new GState({ opacity: 0.08 });
            doc.setGState(gState);
            doc.addImage(base64Logo, 'PNG', centerX, centerY, watermarkWidth, watermarkHeight);
            // Reset opacity
            const resetGState = new GState({ opacity: 1.0 });
            doc.setGState(resetGState);
        } else {
            // Fallback: If opacity not supported, maybe skip or use very light color if possible (images can't change color easily)
            // Just add it small/faded if possible, or skip to avoid blocking text
        }
    } catch (err) {
        console.warn("Watermark could not be added", err);
    }
};

/**
 * Add header logo (top-left)
 */
export const addHeaderLogo = async (doc: jsPDF): Promise<void> => {
    try {
        const logoUrl = '/images/new_logo.png';
        const base64Logo = await getBase64ImageFromUrl(logoUrl);

        // Create image to get dimensions
        const img = new Image();
        img.src = base64Logo;
        await new Promise((resolve) => { img.onload = resolve; });

        // Reduced size to prevent overlap
        const logoWidth = 22;
        const logoHeight = img.height > 0 ? (img.height * logoWidth) / img.width : 22;

        doc.addImage(base64Logo, 'PNG', 14, 6, logoWidth, logoHeight);
    } catch (err) {
        console.warn("Header logo could not be added", err);
    }
};


/**
 * CLINIC BRANDING CONSTANTS
 */
const BRAND_COLORS = {
    primary: [0, 80, 158] as [number, number, number], // 'SWETHA SAIPHANI CLINIC' Blue
    secondary: [193, 26, 26] as [number, number, number], // 'The Brain & Bone Center' Red
    text: [33, 33, 33] as [number, number, number],
    muted: [100, 100, 100] as [number, number, number]
};

/**
 * Draw the standardized clinic header (Image Based)
 */
export const drawClinicHeader = async (doc: jsPDF, title: string = '') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerImageUrl = '/templete%20new.jpeg';

    try {
        const headerBase64 = await getBase64ImageFromUrl(headerImageUrl);

        // Load image to get dimensions for aspect ratio
        const img = new Image();
        img.src = headerBase64;
        await new Promise((resolve) => { img.onload = resolve; });

        // Padding from top/left/right
        const x = 10;
        const y = 5;
        const availableWidth = pageWidth - 20; // 10px padding each side

        // Calculate height based on aspect ratio
        const imgHeight = img.height > 0 ? (img.height * availableWidth) / img.width : 30;

        // Draw the full width header image
        doc.addImage(headerBase64, 'JPEG', x, y, availableWidth, imgHeight);

        // Document Title (Optional, below header)
        if (title) {
            const titleY = y + imgHeight + 8;
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), pageWidth / 2, titleY, { align: 'center' });

            // Divider Line (Optional, below title)
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(10, titleY + 5, pageWidth - 10, titleY + 5);
        } else {
            // Divider Line (if no title)
            const dividerY = y + imgHeight + 5;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(10, dividerY, pageWidth - 10, dividerY);
        }

    } catch (e) {
        console.warn("Error drawing header image", e);
    }
};

/**
 * Draw the standardized clinic footer
 */
export const drawClinicFooter = (doc: jsPDF, pageNumber?: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

    // Address Text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const addressLine1 = "SWETHA SAIPHANI CLINIC, GROUND FLOOR, 6-6-652/2, Opposite to Adarsha Nagar Main Road,";
    const addressLine2 = "Near Manchiryal Chowrastha, Choppadandi Road, Karimnagar, Telangana - 505001.";

    doc.text(addressLine1, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(addressLine2, pageWidth / 2, pageHeight - 6, { align: 'center' });

    // Page Number (Optional)
    if (pageNumber) {
        doc.setFontSize(7);
        doc.text(`Page ${pageNumber}`, pageWidth - 15, pageHeight - 5);
    }
};

/**
 * Get transparent table styles for autoTable
 */
export const getTransparentTableStyles = () => ({
    theme: 'plain' as const, // Ensure no default fills
    styles: {
        fontSize: 8,
        cellPadding: 2,
        fillColor: false as any, // Fully transparent
        textColor: [0, 0, 0] as [number, number, number]
    },
    headStyles: {
        fillColor: false as any,
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: 'bold' as const,
        lineWidth: 0.1,
        lineColor: [0, 0, 0] as [number, number, number]
    },
    bodyStyles: {
        fillColor: false as any
    },
    // Ensure alternate row styles are also transparent
    alternateRowStyles: {
        fillColor: false as any
    }
});

