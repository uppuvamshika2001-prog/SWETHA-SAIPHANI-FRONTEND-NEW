# Swetha Saiphani Clinics - Frontend Codebase Documentation

## 1. Project Overview
This project is a comprehensive Hospital Management System (HMS) web application built for **Swetha Saiphani Clinics - The Brain and Bone Center**. It handles various workflows including Patient Management, Doctor Consultations, Pharmacy Billing, Lab Management, and Admin Administration.

## 2. Technology Stack
- **Framework**: React with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Component Library**: shadcn/ui (Radix UI + Tailwind)
- **Routing**: React Router DOM (v6)
- **State Management**: React Context API + TanStack Query
- **Icons**: Lucide React
- **PDF Generation**: Native Browser Print with CSS (`@media print`)

## 3. Directory Structure
```
src/
├── components/         # Reusable UI components
│   ├── admin/          # Admin specific components
│   ├── hom/            # Landing page components
│   ├── layout/         # Layout components (DashboardLayout)
│   ├── medical/        # Medical related dialogs (Prescriptions)
│   ├── ui/             # shadcn/ui primitive components
│   └── ...
├── contexts/           # Global state contexts
│   ├── AuthContext.tsx
│   ├── PatientContext.tsx
│   └── PrescriptionContext.tsx
├── pages/              # Application Pages (Routes)
│   ├── admin/          # Admin Portal Pages
│   ├── doctor/         # Doctor Portal Pages
│   ├── patient/        # Patient Portal Pages
│   ├── pharmacy/       # Pharmacy Portal Pages
│   ├── reception/      # Reception Portal Pages
│   ├── lab/            # Lab Portal Pages
│   ├── opd/            # OPD Portal Pages
│   ├── Index.tsx       # Landing Page
│   └── NotFound.tsx
├── lib/               # Utilities (utils.ts)
└── App.tsx            # Main Application Component & Routing
```

## 4. Key Modules & Features

### A. Authentication & Roles
- **AuthContext**: Manages user login state and role-based access.
- **Roles**: Admin, Doctor, Pharmacist, Receptionist, Lab Technician, Patient.
- **Login Pages**: Separate login screens for each role (e.g., `/pharmacy/login`, `/doctor/login`).

### B. Pharmacy Portal (`/pharmacy`)
- **Dashboard**: Overview of pending orders and low stock.
- **Billing (`PharmacyBilling.tsx`)**: 
  - **Feature**: Full POS system for pharmacy.
  - **Functionality**:
    - Select Patient (Searchable).
    - Add Medicines (Searchable from mock data or Manual Entry).
    - Automatic Calculation of Subtotal, GST, Discounts, and Grand Total.
  - **Printing/PDF**: 
    - Generates a professional, watermarked PDF bill.
    - **Header**: Custom branding ("SWETHA SAIPHANI CLINICS - THE BRAIN AND BONE CENTER").
    - **Watermark**: Transparent background overlay.
    - **Logo**: High-resolution transparent logo integration.

### C. Doctor Portal (`/doctor`)
- **medicalRecords**: View and manage patient history.
- **Consultation**: Digital prescription generation.

### D. Patient Portal (`/patient`)
- **Billing**: View past bills and payments.
- **Records**: Access medical records.

## 5. Recent Implementation Highlights
### Pharmacy Billing Enhancements
- **Custom Print Layout**: A highly customized `@media print` CSS block was implemented in `PharmacyBilling.tsx` to ensure the generated bill looks professional and matches the clinic's physical branding.
- **Transparency Fixes**: Removed background colors from print containers to ensure the central watermark is visible through the tables and transparent overlays.
- **Logo Integration**: Integrated `saiphani-logo-v3.png` into the bill header with specific dimensions (90px) for optimal visual balance.

### Staff Management Enhancements
- **Role-Based Access**: Enabled "Staff Management" module for Receptionists.
- **Add Staff**: Exclusive "Add Staff" functionality for Receptionists with a comprehensive form dialog.
- **Edit Staff**: Added generic "Edit Staff" functionality allowing updates to name, role, department, and status.

### Reception Features
- **Queue Management**: Implemented functional Check-In button in `ReceptionQueue.tsx` with instant status updates and toast notifications.

### OPD Module
- **Consultation View**: Added a detailed "View" dialog in `OPDConsultation.tsx` to display full consultation records including vitals, diagnosis, and prescriptions.

### User Flow Improvements
- **Booking Redirection**: Updated "Book Appointment" buttons to redirect unauthenticated users to `/patient/login` with preserved booking intent, effectively bridging the public site and the dashboard.

### Doctor Portal Enhancements
- **Add Medical Record**: Implemented a functional "Add Record" dialog in `MedicalRecords.tsx` allowing doctors to create new records with Patient ID, Diagnosis, and Treatment fields.

### Admin Reports Module
- **Download Reports**: Added download action button in `Reports.tsx` with toast notifications simulating file download.

### Admin Analytics
- **Removed Pending Payments**: Removed the "Pending Payments" summary card from `AdminAnalytics.tsx` per requirements.

### Home Page Updates (`DoctorsSection.tsx`)
- **Dr. B. Sai Phani Chandra Profile**: 
  - Updated designation to "Ortho Robotics".
  - Corrected spelling to "Orthopaedic" (British/traditional) throughout bio and experience sections.

## 6. Assets
- **Images**: Located in `public/`.
- **Logos**: 
  - `saiphani-logo-v3.png` (Current transparent logo).
  - `watermark-logo.png` (Background watermark).
  - `dr_ravikanti_nagaraju.jpg` (Updated doctor profile image).

### Home Page Improvements (`Index.tsx` & `HeroSection.tsx`)
- **Doctor Slideshow**: Added **Dr. Ravikanti Nagaraju** to the hero section slideshow (`dr_ravikanti_nagaraju.jpg`).
- **Footer Updates**: 
  - Updated contact numbers to `9160244109, 8121418999`.
  - Made the email address clickable (`mailto:swethasaiphaniclinics@gmail.com`).

## 7. Running the Project
```bash
npm run dev
```
Currently configured to run on port `8080` (proxy or custom config in `vite.config.ts`).
