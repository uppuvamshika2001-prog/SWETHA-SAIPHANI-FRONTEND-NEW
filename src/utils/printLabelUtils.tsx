import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { LabelContent, LabelOptions, LABEL_SIZES } from '@/types/label';
import { ClinicLabel } from '@/components/labels/ClinicLabel';
import { toast } from "sonner";

export const printClinicLabel = (content: LabelContent, options: LabelOptions = { size: '50x30', showWatermark: true }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Please allow popups to print labels");
        return;
    }

    const labelHtml = ReactDOMServer.renderToStaticMarkup(
        <ClinicLabel content={content} options={options} />
    );

    const { width, height } = LABEL_SIZES[options.size];

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Label Print</title>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: ${width} ${height};
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
                .clinic-label-print {
                    border: none !important; /* Remove screen border */
                }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${labelHtml}
            <script>
                window.onload = function() {
                    // Slight delay to ensure fonts/images load
                    setTimeout(function() {
                        window.print();
                        // Optional: window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
