/**
 * PDF Core Utilities (Lightweight)
 * Pure helper functions with no heavy dependencies (no jsPDF, html2canvas, etc.)
 * Safe to statically import anywhere without bloating the bundle.
 */

// Track download counts per document ID (in-memory, resets on page reload)
const downloadCounts: Record<string, number> = {};

/**
 * Generate PDF filename based on download rules
 * @param patientName - Patient's full name
 * @param identifier - Invoice Number or Patient ID
 * @param documentId - Unique document identifier (for tracking downloads)
 * @param isInvoice - Boolean to indicate if this is an invoice (affects naming)
 * @returns Filename and whether this is a masked download
 */
export const generatePdfFilename = (
    patientName: string,
    identifier: string,
    documentId: string,
    isInvoice: boolean = false
): { filename: string; isMasked: boolean } => {
    // Increment download count
    downloadCounts[documentId] = (downloadCounts[documentId] || 0) + 1;
    const count = downloadCounts[documentId];

    // Sanitize name for filename
    const sanitizedName = patientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const isMasked = count > 1;

    // Standardized format: PatientName_ID_Date.pdf
    const filename = `${sanitizedName}_${identifier}_${dateStr}.pdf`;

    return {
        filename,
        isMasked: isMasked
    };
};

/**
 * Mask sensitive data
 */
export const maskData = (value: string, type: 'phone' | 'email' | 'address' | 'id' | 'name'): string => {
    if (!value) return value;

    switch (type) {
        case 'phone':
            // Show last 4 digits: ******1234
            return value.length > 4 ? '*'.repeat(value.length - 4) + value.slice(-4) : value;

        case 'email': {
            // Show first 2 chars and domain: ab****@domain.com
            const [local, domain] = value.split('@');
            if (local && domain) {
                const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
                return `${maskedLocal}@${domain}`;
            }
            return value;
        }

        case 'address': {
            // Show only city/state portion if available, mask street details
            const parts = value.split(',');
            if (parts.length >= 2) {
                return '*****' + ', ' + parts.slice(-2).join(', ');
            }
            return '*****';
        }

        case 'id':
            // Show last 4 chars: ********1234
            return value.length > 4 ? '*'.repeat(value.length - 4) + value.slice(-4) : value;

        case 'name': {
            // Requirement: Siddu Babu -> Siddu B***
            const nameParts = value.trim().split(' ');
            if (nameParts.length > 1) {
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];
                const lastInitial = lastName ? lastName[0] : '';
                return `${firstName} ${lastInitial}***`;
            }
            // If single name, masked partially
            return value.length > 3 ? value.slice(0, 3) + '***' : value + '***';
        }

        default:
            return value;
    }
};

/**
 * Reset download count for a document (e.g., after new registration)
 */
export const resetDownloadCount = (documentId: string): void => {
    delete downloadCounts[documentId];
};
