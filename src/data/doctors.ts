export const DOCTORS = [
    { id: '1', full_name: 'Dr. B. Sai Phani Chandra', specialization: 'MBBS, DNB Orthopaedics, MNAMS, FIAAS (Korea), FIJR( Chennai )', department: 'Orthopaedics', role: 'doctor', status: 'active' },
    { id: '4', full_name: 'Dr. Hariprakash', specialization: 'MBBS, D-Ortho, DNB Orthopaedic, MNAMS, FIAS, FIAP, FIFA', department: 'Orthopaedics', role: 'doctor', status: 'active' },
    { id: '2', full_name: 'Dr. Swetha Pendyala', specialization: 'MBBS, DNB Neurosurgery', department: 'Neurosurgeon', role: 'doctor', status: 'active' },
    { id: '3', full_name: 'Dr. Roshan Kumar Jaiswal', specialization: 'MBBS, DNB, Paediatric Orthopaedic(Germany)', department: 'Paediatric Orthopaedics', role: 'doctor', status: 'active' },
    { id: '5', full_name: 'Dr. Ravikanti Nagaraju', specialization: 'MBBS, DNB (Internal Medicine)', department: 'General Physician', role: 'doctor', status: 'active' },
    { id: '7', full_name: 'Dr. Mahesh Gudelli', specialization: 'MBBS, DNB Pulmonary Medicine, EDARM', department: 'Pulmonology', role: 'doctor', status: 'active' },
    { id: '8', full_name: 'Dr. Sneha Sagar', specialization: 'Medical Oncology', department: 'Oncology', role: 'doctor', status: 'active' },
    { id: '9', full_name: 'Dr. T Dheeraj', specialization: 'MBBS, MS General Surgery, DNB Surgical Oncology', department: 'Oncology', role: 'doctor', status: 'active' },
    { id: '10', full_name: 'Dr. Navya Sri Yenigalla', specialization: 'MBBS, MD-Pediatrics', department: 'Paediatric Hemato-Oncology', role: 'doctor', status: 'active' },
];

export const getDepartmentMapping = (dept: string): string | null => {
    const deptLower = (dept || "").toLowerCase();
    if (deptLower.includes("ortho")) return "Orthopaedics";
    if (deptLower.includes("neuro")) return "Neurosurgeon";
    return null;
};
