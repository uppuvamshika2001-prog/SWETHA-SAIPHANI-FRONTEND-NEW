import React from 'react';
import { LabelContent, LabelOptions, LABEL_SIZES } from '@/types/label';

interface ClinicLabelProps {
    content: LabelContent;
    options: LabelOptions;
}

export const ClinicLabel: React.FC<ClinicLabelProps> = ({ content, options }) => {
    const { width, height } = LABEL_SIZES[options.size];

    const isSmall = options.size === '50x25' || options.size === '50x30';
    // Scaling factors for different sizes
    const baseFontSize = isSmall ? '8px' : '10px';
    const headerTitleSize = isSmall ? '8px' : '11px';
    const headerSubtitleSize = isSmall ? '5px' : '7px';
    const logoSize = isSmall ? '14px' : '20px';

    return (
        <div style={{
            width: width,
            height: height,
            position: 'relative',
            backgroundColor: 'white',
            overflow: 'hidden',
            fontFamily: 'Helvetica, Arial, sans-serif',
            boxSizing: 'border-box',
            pageBreakInside: 'avoid',
            border: '1px solid #eee' // Helper border for screen, print removes it
        }} className="clinic-label-print">

            {/* Watermark - Low Opacity */}
            {options.showWatermark && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.08,
                    width: '50%',
                    pointerEvents: 'none',
                    zIndex: 0
                }}>
                    <img src="/saiphani-logo-v3.png" alt="" style={{ width: '100%', height: 'auto' }} />
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, padding: '2mm', height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                {options.showHeader !== false && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '0.5px solid #000',
                        paddingBottom: '2px',
                        marginBottom: '2px'
                    }}>
                        {/* Left Logo */}
                        <img
                            src="/saiphani-logo-v3.png"
                            alt="Logo"
                            style={{ width: logoSize, height: logoSize, objectFit: 'contain', marginRight: '4px' }}
                        />

                        {/* Center Text */}
                        <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.1 }}>
                            <div style={{
                                fontSize: headerTitleSize,
                                fontWeight: 'bold',
                                color: '#00509E',
                                whiteSpace: 'nowrap'
                            }}>
                                SWETHA SAIPHANI CLINIC
                            </div>
                            <div style={{
                                fontSize: headerSubtitleSize,
                                color: '#C11A1A',
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                marginTop: '1px'
                            }}>
                                The Brain & Bone Center
                            </div>
                            {!isSmall && (
                                <div style={{ fontSize: '5px', color: '#666', marginTop: '1px' }}>
                                    NEUROSURGERY | ORTHOROBOTICS
                                </div>
                            )}
                        </div>

                        {/* Right KIMS Logo/Text */}
                        <div style={{ marginLeft: '4px', textAlign: 'right' }}>
                            {/* Placeholder for KIMS logo if available, else text */}
                            <div style={{ fontSize: isSmall ? '6px' : '8px', fontWeight: 'bold', color: '#C11A1A' }}>KIMS</div>
                            <div style={{ fontSize: isSmall ? '5px' : '6px', fontWeight: 'bold', color: '#C11A1A' }}>CLINICS</div>
                        </div>
                    </div>
                )}

                {/* Body */}
                <div style={{ flex: 1, fontSize: baseFontSize, lineHeight: 1.2, display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>

                    {content.patientName && (
                        <div style={{ fontWeight: 'bold', fontSize: isSmall ? '9px' : '11px', marginBottom: '1px' }}>
                            {content.patientName.toUpperCase()}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: isSmall ? '7px' : '9px' }}>
                        {content.patientId && <span>ID: <strong>{content.patientId}</strong></span>}
                        {content.ageGender && <span>{content.ageGender}</span>}
                    </div>

                    {/* Test / Medicine Info */}
                    {content.testName && (
                        <div style={{ fontWeight: 600, marginTop: '2px', borderTop: '0.5px dashed #ccc', paddingTop: '1px' }}>
                            {content.testName}
                        </div>
                    )}
                    {content.medicineName && (
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>
                            {content.medicineName}
                            <span style={{ fontWeight: 'normal', marginLeft: '4px' }}>{content.dosage}</span>
                        </div>
                    )}

                    {/* Address for Address Labels */}
                    {content.address && (
                        <div style={{ marginTop: '2px', fontSize: isSmall ? '7px' : '9px', whiteSpace: 'pre-wrap' }}>
                            {content.address}
                        </div>
                    )}

                    {/* Barcode Placeholder */}
                    {content.barcodeValue && (
                        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '2px' }}>
                            <div style={{ fontFamily: '"Libre Barcode 39 Text", monospace', fontSize: isSmall ? '16px' : '20px' }}>
                                *{content.barcodeValue}*
                            </div>
                        </div>
                    )}

                    {/* Date Footer if no barcode */}
                    {!content.barcodeValue && content.date && (
                        <div style={{ marginTop: 'auto', textAlign: 'right', fontSize: '7px', color: '#666' }}>
                            {content.date}
                        </div>
                    )}
                </div>

                {/* Footer (Full Address) - Only for large labels if enabled */}
                {options.showFooter && !isSmall && (
                    <div style={{
                        borderTop: '0.5px solid #000',
                        paddingTop: '2px',
                        marginTop: '2px',
                        fontSize: '6px',
                        textAlign: 'center',
                        color: '#333',
                        lineHeight: 1.1
                    }}>
                        GROUND FLOOR, 6-6-652/2, Opp. Adarsha Nagar Main Road,<br />
                        Near Manchiryal Chowrastha, Karimnagar - 505001.
                    </div>
                )}
            </div>
        </div>
    );
};
