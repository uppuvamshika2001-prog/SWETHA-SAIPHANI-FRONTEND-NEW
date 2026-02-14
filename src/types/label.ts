export type LabelSize = '50x25' | '50x30' | '75x50' | '100x50';

export interface LabelDimensions {
    width: string; // e.g. '50mm'
    height: string; // e.g. '25mm'
}

export const LABEL_SIZES: Record<LabelSize, LabelDimensions> = {
    '50x25': { width: '50mm', height: '25mm' },
    '50x30': { width: '50mm', height: '30mm' },
    '75x50': { width: '75mm', height: '50mm' },
    '100x50': { width: '100mm', height: '50mm' },
};

export interface LabelContent {
    title?: string;
    subtitle?: string;

    // Patient Info
    patientName?: string;
    patientId?: string;
    ageGender?: string;

    // Specific Info
    testName?: string;
    sampleType?: string;
    medicineName?: string;
    dosage?: string;

    // Meta
    date?: string;
    barcodeValue?: string;

    // Footer
    address?: string; // If simplified footer needed
}

export interface LabelOptions {
    size: LabelSize;
    showWatermark?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
}
