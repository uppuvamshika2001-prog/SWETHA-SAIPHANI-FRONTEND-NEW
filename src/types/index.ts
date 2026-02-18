// Role types
export type AppRole = 'admin' | 'doctor' | 'receptionist' | 'pharmacist' | 'lab_technician' | 'patient';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  specialization?: string;
  license_number?: string;
  avatar_url?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// Patient types
export interface Patient {
  uhid: string; // The primary identifier (Unique Health ID)
  id: string;   // Alias for uhid for compatibility (e.g., DataTable)
  full_name: string;
  date_of_birth?: string;
  age: string | number;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  phone: string;
  email?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  insurance_provider?: string;
  insurance_id?: string;
  allergies?: string[];
  medical_history?: string;
  status: 'active';
  created_at: string;
  updated_at: string;
  consulting_doctor?: string;
  department?: string;
}

// Doctor types
export interface Doctor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  license_number: string;
  experience_years: number;
  consultation_fee: number;
  availability: DoctorAvailability[];
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
}

export interface DoctorAvailability {
  day: string;
  start_time: string;
  end_time: string;
  slot_duration: number; // in minutes
}

// Appointment types
export interface Appointment {
  id: string;
  appointment_id: string; // Display ID like APT-001
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: 'consultation' | 'follow_up' | 'emergency' | 'checkup';
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
}

// EMR types
export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  appointment_id?: string;
  date: string;
  chief_complaint: string;
  diagnosis: string;
  icd_code?: string;
  treatment_notes: string;
  prescriptions: Prescription[];
  lab_orders?: LabOrder[];
  vitals?: VitalSigns;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  recorded_at: string;
  recorded_by: string;
}

// Lab types
export interface LabTest {
  id: string;
  code: string;
  name: string;
  department: string;
  price: number;
  turnaround: string;
  isActive?: boolean;
  unit?: string;
  normal_range?: string;
}

export interface LabOrder {
  id: string;
  order_id: string; // Display ID like LAB-001
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  tests: LabTestOrder[];
  priority: 'routine' | 'urgent' | 'stat';
  status: 'payment_pending' | 'ready_for_sample_collection' | 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  ordered_at: string;
  completed_at?: string;
  notes?: string;
  bill?: {
    status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
    id: string;
  };
}

export interface LabTestOrder {
  test_id: string;
  test_name: string;
  result?: string;
  unit?: string;
  normal_range?: string;
  status: 'payment_pending' | 'ready_for_sample_collection' | 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  result_notes?: string;
}

// Pharmacy types
export interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  manufacturer: string;
  unit_price: number;
  stock_quantity: number;
  min_stock_level: number;
  batch_number: string;
  expiry_date: string;
  storage_conditions?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  discount?: number;
}

export interface PharmacyOrder {
  id: string;
  order_id: string; // Display ID like PH-001
  patient_id: string;
  patient_name: string;
  prescription_id?: string;
  items: PharmacyOrderItem[];
  total_amount: number;
  status: 'pending' | 'dispensed' | 'partial' | 'cancelled';
  dispensed_by?: string;
  dispensed_at?: string;
  created_at: string;
}

export interface PharmacyOrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dispensed_quantity?: number;
}

// Note: IPD types (Ward, Bed, Admission, NursingNote) have been removed
// as this clinic is OPD-only

// Billing types
export interface Bill {
  id: string;
  bill_id: string; // Display ID like BILL-001
  patient_id: string;
  patient_name: string;
  admission_id?: string;
  type: 'opd'; // OPD-only clinic
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid_amount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  payment_method?: 'cash' | 'card' | 'insurance' | 'upi';
  created_at: string;
  paid_at?: string;
}

export interface BillItem {
  id: string;
  description: string;
  category: 'consultation' | 'lab' | 'pharmacy' | 'procedure' | 'other';
  quantity: number;
  unit_price: number;
  total: number;
}

// Dashboard stats
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingLabTests: number;
  lowStockMedicines: number;
  todayRevenue: number;
  pendingBills: number;
}

// Staff member type for admin dashboard
export interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole;
  department?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  actionUrl?: string; // Optional link to navigate to
  metadata?: any;
  createdAt: string;
}
