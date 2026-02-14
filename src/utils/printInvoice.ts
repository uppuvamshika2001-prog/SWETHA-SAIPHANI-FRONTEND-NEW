
import { toast } from "sonner";
import { Bill } from "@/services/billingService";

export const printInvoice = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Please allow popups to print the invoice");
        return;
    }

    const itemsHtml = bill.items.map((item, index) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.unitPrice).toFixed(2)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.total).toFixed(2)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${bill.billNumber}</title>
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    color: #000; 
                    background: #fff;
                    font-size: 12px;
                    line-height: 1.5;
                    width: 210mm;
                    min-height: 297mm;
                }
                /* ===== HEADER & FOOTER (Matches Patient Report PDF) ===== */
                /* Header logic: We use inline styles in the HTML below to match the PDF generation reference exactly */
                
                /* ===== CONTENT ===== */
                .page-container {
                    min-height: 297mm;
                    display: flex;
                    flex-direction: column;
                    padding: 40px; 
                    position: relative;
                    width: 100%;
                    background-image: url('/header_template.jpg');
                    background-repeat: no-repeat;
                    background-position: top center;
                    background-size: 100% 100%;
                }
                
                .content-wrapper {
                     flex: 1;
                     width: 100%;
                     margin-top: 200px; /* Push content down to clear header */
                }

                .invoice-title {
                    font-size: 18px; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    border-bottom: 2px solid #0099cc; /* More visible underline */
                    padding-bottom: 5px; 
                    margin-bottom: 25px; 
                    color: #111827;
                    text-align: center; /* Center the title too */
                    width: 100%;
                }

                .section-header {
                    font-size: 14px; 
                    font-weight: 700; 
                    color: #111827; 
                    border-bottom: 1px solid #e5e7eb; 
                    padding-bottom: 8px; 
                    margin-bottom: 15px;
                }

                /* Table Styles from PDF */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                    margin-top: 20px;
                }
                
                th {
                    color: #6b7280;
                    text-align: left;
                    padding: 10px 8px;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #e5e7eb;
                }

                td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #eee;
                    color: #111827;
                }
                
                .totals-section {
                    margin-top: 30px;
                    display: flex;
                    justify-content: flex-end;
                    width: 100%;
                }
                
                .totals-table {
                    width: 300px;
                    font-size: 13px;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .grand-total {
                    font-size: 15px;
                    font-weight: bold;
                    color: #111827; /* Matches PDF dark text */
                    border-top: 2px solid #e5e7eb;
                    border-bottom: none;
                    margin-top: 10px;
                    padding-top: 10px;
                }

                @media print { 
                    body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        width: 210mm;
                        height: 297mm;
                    }
                    .page-container {
                        padding: 0;
                        margin: 0;
                        width: 100%;
                        height: 100%;
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        background-size: 100% 100%;
                    }
                    .content-wrapper {
                        padding: 40px;
                        margin-top: 200px;
                    }
                    @page { 
                        margin: 0;
                        size: A4;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page-container">
                <!-- BODY -->
                <div class="content-wrapper">
                    <div class="invoice-title">Invoice</div>

                    <!-- Two Column Info -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                         <!-- Patient Info -->
                        <div style="width: 48%;">
                             <div class="section-header">Patient Details</div>
                             <table style="width: 100%; margin-top: 0;">
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; width: 80px;">Name</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${bill.patient?.firstName} ${bill.patient?.lastName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">ID</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${bill.patientId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Phone</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${bill.patient?.phone || 'N/A'}</td>
                                </tr>
                             </table>
                        </div>
                        
                        <!-- Invoice Info -->
                        <div style="width: 48%;">
                             <div class="section-header">Invoice Details</div>
                             <table style="width: 100%; margin-top: 0;">
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; width: 80px;">Invoice #</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${bill.billNumber}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Date</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${new Date(bill.createdAt).toLocaleDateString()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; border: none; color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Status</td>
                                    <td style="padding: 4px 0; border: none; font-weight: 500;">${bill.status}</td>
                                </tr>
                             </table>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th>Description</th>
                                <th style="text-align: right; width: 80px;">Qty</th>
                                <th style="text-align: right; width: 100px;">Price</th>
                                <th style="text-align: right; width: 120px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <!-- Totals -->
                    <div class="totals-section">
                        <div class="totals-table">
                            <div class="total-row">
                                <span style="color: #6b7280;">Subtotal</span>
                                <span style="font-weight: 500;">Rs. ${Number(bill.subtotal).toFixed(2)}</span>
                            </div>
                            ${bill.discount > 0 ? `
                            <div class="total-row" style="color: #ef4444;">
                                <span>Discount</span>
                                <span>- Rs. ${Number(bill.discount).toFixed(2)}</span>
                            </div>` : ''}
                            ${bill.gstAmount > 0 ? `
                            <div class="total-row">
                                <span style="color: #6b7280;">GST (${bill.gstPercent || 18}%)</span>
                                <span style="font-weight: 500;">+ Rs. ${Number(bill.gstAmount).toFixed(2)}</span>
                            </div>` : ''}
                            <div class="total-row grand-total">
                                <span>Grand Total</span>
                                <span style="color: #0d9488;">Rs. ${Number(bill.grandTotal).toFixed(2)}</span>
                            </div>
                             <div class="total-row" style="margin-top: 5px;">
                                <span style="color: #6b7280;">Paid Amount</span>
                                <span style="font-weight: 500;">Rs. ${Number(bill.paidAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${bill.notes ? `
                    <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                        <strong>Notes:</strong> <span style="color: #666;">${bill.notes}</span>
                    </div>
                    ` : ''}
                </div>
                
                <!-- FOOTER REMOVED (Included in Background) -->

            </div>
            
            <script>
                // Wait for logo to load before printing
                window.onload = function() { 
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
