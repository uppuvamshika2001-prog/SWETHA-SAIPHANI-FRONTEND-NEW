
import { toast } from "sonner";
import { MedicalRecord } from "@/types";

// Helper to format address for HTML display
const formatAddressHTML = (fullAddress: string) => {
    if (!fullAddress || fullAddress.trim() === '' || fullAddress.trim() === ',') {
        return 'N/A';
    }

    const cleanAddr = fullAddress.replace(/^[,\s]+/, '').trim();
    const parts = cleanAddr.split(',').map(p => p.trim()).filter(p => p);

    let houseLine = '';
    let streetLine = '';
    let city = '';
    let state = '';
    let pinCode = '';

    if (parts.length >= 1) houseLine = parts[0];
    if (parts.length >= 2) streetLine = parts[1];
    if (parts.length >= 3) city = parts.slice(2, parts.length - 1).join(', ');
    if (parts.length >= 4) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('–') || lastPart.includes('-')) {
            const statePinParts = lastPart.split(/[–-]/);
            state = statePinParts[0].trim();
            pinCode = statePinParts[1]?.trim() || '';
        } else {
            state = lastPart;
        }
    }

    let html = '';
    if (houseLine) html += `<div>${houseLine}</div>`;
    if (streetLine) html += `<div>${streetLine}</div>`;
    if (city) html += `<div>${city}</div>`;
    if (state) html += `<div>${state}${pinCode ? ` - ${pinCode}` : ''}</div>`;

    return html || cleanAddr;
};

export const printPatientCard = (patient: any, medicalRecords: MedicalRecord[] = [], showClinicalInfo: boolean = true) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Please allow popups to print the patient card");
        return;
    }

    // Calculate age
    let ageDisplay = 'N/A';
    if (patient.age) {
        ageDisplay = patient.age.toString();
    } else if (patient.date_of_birth) {
        const dob = new Date(patient.date_of_birth);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        ageDisplay = Math.abs(age_dt.getUTCFullYear() - 1970).toString();
    }

    const genderDisplay = patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : 'N/A';
    const addressHtml = formatAddressHTML(patient.address || '');

    const recordsHtml = medicalRecords.length > 0 ? medicalRecords.map(record => `
        <div style="margin-bottom: 12px; border: 1px solid #eee; padding: 12px; border-radius: 6px;">
            <div style="margin-bottom: 6px; display: flex; justify-content: space-between;">
               <div><span style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600;">Date</span> <span style="font-weight: 500; font-size: 12px; margin-left: 4px;">${record.date}</span></div>
               <div><span style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600;">Doctor</span> <span style="font-weight: 500; font-size: 12px; margin-left: 4px;">${record.doctor_name}</span></div>
            </div>
            <div style="margin-top: 4px;">
               <span style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600;">Diagnosis</span>
               <div style="font-weight: 500; font-size: 12px; margin-top: 1px;">${record.diagnosis}</div>
            </div>
             ${record.treatment_notes ? `
            <div style="margin-top: 4px;">
               <span style="color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 600;">Treatment</span>
               <div style="font-weight: 500; font-size: 12px; margin-top: 1px;">${record.treatment_notes}</div>
            </div>` : ''}
        </div>
    `).join('') : '<div style="color: #6b7280; font-style: italic; font-size: 11px; padding: 6px 0;">No medical records found</div>';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Report - ${patient.full_name}</title>
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
                
                .page-container {
                    min-height: 297mm;
                    display: flex;
                    flex-direction: column;
                    padding: 40px; 
                    position: relative;
                    width: 100%;
                    background-image: url('/2.jpg');
                    background-repeat: no-repeat;
                    background-position: top center;
                    background-size: 100% 100%; /* Fill the A4 container */
                }
                
                .content-wrapper {
                     flex: 1;
                     width: 100%;
                     margin-top: 105mm; /* Push content down to avoid overlapping the header background */
                }

                .report-title {
                    font-size: 18px; 
                    font-weight: bold; 
                    text-transform: uppercase; 
                    border-bottom: 2px solid #0099cc; 
                    padding-bottom: 5px; 
                    margin-bottom: 20px; 
                    color: #111827;
                    text-align: center;
                    width: 100%;
                }

                .section-header {
                    font-size: 14px; 
                    font-weight: 700; 
                    color: #111827; 
                    border-bottom: 1px solid #e5e7eb; 
                    padding-bottom: 5px; 
                    margin-bottom: 10px;
                }

                /* Table Styles */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                
                td {
                    padding: 4px 6px;
                    vertical-align: top;
                    color: #111827;
                }

                /* Watermark */
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 50%;
                    max-width: 400px;
                    opacity: 0.08;
                    z-index: 0;
                    pointer-events: none;
                }
                .watermark img {
                    width: 100%;
                    height: auto;
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
                        background-size: 100% 100%; /* Ensure it fills the page if it's a full template */
                    }
                    .content-wrapper {
                        padding: 40px; /* Add internal padding for content */
                        margin-top: 150px; /* Maintain header spacing in print */
                    }
                    @page { 
                        margin: 0;
                        size: A4;
                    }
                }
            </style>
        </head>
        <body>
            <!-- WATERMARK -->
            <div class="watermark">
                <img src="/saiphani-logo-v3.png" alt="" />
            </div>

                <div class="page-container">
                    <!-- Absolute Positioned Header Fields -->
                   
                    <!-- Row 1: Name (with Age/Gender) & Date - 51mm -->
                    <div style="position: absolute; top: 51mm; left: 57mm; font-weight: bold; text-transform: uppercase;">${patient.full_name} (${ageDisplay}/${genderDisplay.charAt(0)})</div>
                    <div style="position: absolute; top: 51mm; left: 168mm; font-weight: bold;">${new Date().toLocaleDateString()}</div>

                    <!-- Row 2: ID & Mobile - 58mm -->
                    <div style="position: absolute; top: 58mm; left: 57mm; font-weight: bold; text-transform: uppercase;">${patient.uhid || patient.id || 'N/A'}</div>
                    <div style="position: absolute; top: 58mm; left: 168mm; font-weight: bold;">${patient.phone}</div>

                    <!-- Row 3: Consultant & Dept - 64mm -->
                    <!-- Note: For printPatientCard we don't always have exact doctor info, defaulting to OPD or whatever available -->
                    <div style="position: absolute; top: 64mm; left: 57mm; font-weight: bold; text-transform: uppercase;">${'OPD'}</div>
                    <div style="position: absolute; top: 64mm; left: 168mm; font-weight: bold;">OPD</div>

                    <!-- Address - 79mm -->
                    <div style="position: absolute; top: 79mm; left: 57mm; width: 125mm; font-weight: bold; text-transform: uppercase; line-height: 1.2;">
                         ${addressHtml.replace(/<[^>]*>/g, ', ').replace(/^,\s*/, '')}
                    </div>

                    <!-- BODY -->
                    <div class="content-wrapper">
                        <div class="report-title">Patient Details</div>

                    ${showClinicalInfo ? `
                    <!-- Active Medical Conditions -->
                    <div style="margin-bottom: 20px;">
                        <div class="section-header">Active Medical Conditions</div>
                        <div style="font-size: 12px; color: #4b5563; font-style: italic;">${patient.medical_history || 'No active conditions recorded'}</div>
                    </div>

                     <!-- Medical Records History -->
                    <div style="margin-bottom: 20px;">
                        <div class="section-header">Medical Records History</div>
                        ${recordsHtml}
                    </div>

                    <!-- Current Medications -->
                    <div style="margin-bottom: 20px;">
                        <div class="section-header">Current Medications</div>
                        <div style="font-size: 12px; color: #4b5563; font-style: italic;">No active medications</div>
                    </div>

                    <!-- Recent Lab Results -->
                    <div style="margin-bottom: 30px;">
                        <div class="section-header">Recent Lab Results</div>
                        <div style="font-size: 12px; color: #4b5563; font-style: italic;">No recent lab results found</div>
                    </div>
                    ` : ''}

                </div>
                
                <!-- FOOTER REMOVED (Included in Background Image) -->

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

// Masked copy version - no header, no footer, with "MASKED COPY" watermark
export const printMaskedPatientCard = (patient: any, medicalRecords: MedicalRecord[] = []) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        toast.error("Please allow popups to download the card");
        return;
    }

    // Calculate age from DOB if available
    let age = 'N/A';
    if (patient.date_of_birth) {
        const dob = new Date(patient.date_of_birth);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        age = Math.abs(age_dt.getUTCFullYear() - 1970).toString();
    }

    const recordsHtml = medicalRecords.length > 0 ? medicalRecords.map(record => `
        <div class="record-item" style="margin-bottom: 20px; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
            <div class="row"><div class="label">Date</div><div class="value">${record.date}</div></div>
            <div class="row"><div class="label">Doctor</div><div class="value">${record.doctor_name}</div></div>
            <div class="row"><div class="label">Diagnosis</div><div class="value">${record.diagnosis}</div></div>
            <div class="row"><div class="label">Treatment</div><div class="value">${record.treatment_notes}</div></div>
             <div class="row"><div class="label">Prescriptions</div><div class="value">
                ${record.prescriptions?.map(p => `<div>${p.medicine_name} - ${p.dosage} (${p.frequency})</div>`).join('') || 'None'}
            </div></div>
        </div>
    `).join('') : '<div class="empty-text">No medical records found</div>';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Masked Copy - ${patient.full_name}</title>
            <style>
                @page {
                    size: A4;
                    margin: 20mm;
                }
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    padding: 30px;
                    color: #000; 
                    background: #fff;
                    font-size: 12px;
                    line-height: 1.5;
                    position: relative;
                }
                
                /* ===== MASKED COPY WATERMARK ===== */
                .watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px;
                    font-weight: bold;
                    color: rgba(200, 0, 0, 0.15);
                    z-index: 1000;
                    pointer-events: none;
                    white-space: nowrap;
                    letter-spacing: 10px;
                    text-transform: uppercase;
                }
                
                /* ===== BODY CONTENT ===== */
                .container { 
                    padding: 20px 0; 
                    position: relative;
                    z-index: 1;
                }
                .section-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    color: #000; 
                    border-bottom: 1px solid #ccc; 
                    padding-bottom: 8px; 
                    margin-top: 20px; 
                    margin-bottom: 12px; 
                }
                .section-title:first-child {
                    margin-top: 0;
                }
                .grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 12px 30px; 
                    font-size: 12px; 
                }
                .row { 
                    margin-bottom: 10px; 
                }
                .label { 
                    color: #666; 
                    font-size: 10px; 
                    margin-bottom: 2px; 
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .value { 
                    font-weight: 500; 
                    color: #000; 
                    font-size: 12px;
                }
                .empty-text { 
                    color: #666; 
                    font-style: italic; 
                    font-size: 11px; 
                    padding: 6px 0; 
                }
                .record-item { 
                    margin-bottom: 12px; 
                    border: 1px solid #ddd; 
                    padding: 10px 12px; 
                    border-radius: 3px; 
                }
                
                @media print { 
                    body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    .watermark {
                        position: fixed;
                    }
                }
            </style>
        </head>
        <body>
            <!-- MASKED COPY WATERMARK -->
            <div class="watermark">MASKED COPY</div>
            
            <!-- BODY CONTENT (No Header, No Footer) -->
            <div class="container">
                <div class="section-title">Patient Information</div>
                <div class="grid">
                    <div>
                        <div class="row"><div class="label">Name</div><div class="value">${patient.full_name}</div></div>
                        <div class="row"><div class="label">Age / Gender</div><div class="value">${age} / ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</div></div>
                        <div class="row"><div class="label">Contact</div><div class="value">${patient.phone}</div></div>
                        <div class="row"><div class="label">Address</div><div class="value">${patient.address || 'N/A'}</div></div>
                    </div>
                    <div>
                        <div class="row"><div class="label">Patient ID</div><div class="value">${patient.uhid || patient.id || 'N/A'}</div></div>
                        <div class="row"><div class="label">Blood Group</div><div class="value">${patient.blood_group || 'N/A'}</div></div>
                        <div class="row"><div class="label">Email</div><div class="value">${patient.email || 'N/A'}</div></div>
                    </div>
                </div>

                <div class="section-title">Active Medical Conditions</div>
                <div class="empty-text">${patient.medical_history || 'No active conditions recorded'}</div>

                <div class="section-title">Medical Records History</div>
                ${recordsHtml}

                <div class="section-title">Current Medications</div>
                <div class="empty-text">No active medications</div>

                <div class="section-title">Recent Lab Results</div>
                <div class="empty-text">No recent lab results found</div>
            </div>
            
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
