
import {
    Stethoscope,
    Heart,
    Microscope,
    Activity,
    Brain
} from "lucide-react";

export const servicesData = [
    {
        id: "primary-care",
        slug: "primary-care",
        title: "Primary Care",
        shortDescription: "Comprehensive general health services for patients of all ages.",
        description: "Our Primary Care department provides comprehensive general health services for patients of all ages, focusing on prevention, wellness, and the treatment of common illnesses. We are your first point of contact for all health concerns.",
        icon: Stethoscope,
        color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
        features: [
            "Routine health check-ups and screenings",
            "Vaccinations and immunizations",
            "Chronic disease management (Diabetes, Hypertension)",
            "Acute illness treatment (Flu, Infections)",
            "Preventive healthcare counseling"
        ],
        specialists: "Senior General Physicians"
    },
    {
        id: "cardiology",
        slug: "cardiology",
        title: "Cardiology",
        shortDescription: "Advanced cardiac care including diagnostics and treatment.",
        description: "Our Cardiology department offers advanced cardiac care including state-of-the-art diagnostics, treatment of heart conditions, and comprehensive rehabilitation programs. We are dedicated to keeping your heart healthy.",
        icon: Heart,
        color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
        features: [
            "ECG and Echocardiography",
            "Stress testing",
            "Holter monitoring",
            "Heart failure management",
            "Cardiac rehabilitation",
            "Hypertension management"
        ],
        specialists: "Expert Cardiologists"
    },
    {
        id: "laboratory",
        slug: "laboratory",
        title: "Laboratory",
        shortDescription: "State-of-the-art diagnostic testing with quick results.",
        description: "Our in-house bio-chemistry and pathology laboratory provides state-of-the-art diagnostic testing with quick turnaround times. We ensure accurate results to support correct diagnosis and treatment plans.",
        icon: Microscope,
        color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
        features: [
            "Complete Blood Count (CBC)",
            "Lipid Profile & Liver Function Tests",
            "Thyroid Function Tests",
            "Diabetes Screening (HbA1c)",
            "Urine Analysis",
            "Microbiology services"
        ],
        specialists: "Certified Lab Technicians"
    },
    {
        id: "emergency-care",
        slug: "emergency-care",
        title: "Emergency Care",
        shortDescription: "24/7 urgent care services for critical situations.",
        description: "We provide 24/7 urgent care services equipped to handle critical medical situations efficiently. Our emergency team is always ready to save lives with immediate medical intervention.",
        icon: Activity,
        color: "text-red-600 bg-red-100 dark:bg-red-900/30",
        features: [
            "24/7 Trauma care",
            "Management of acute cardiac events",
            "Accident and injury treatment",
            "Poisoning and drug overdose management",
            "Access to ambulance services"
        ],
        specialists: "Emergency Medicine Specialists"
    },
    {
        id: "neurology",
        slug: "neurology",
        title: "Neurology",
        shortDescription: "Expert diagnosis and treatment for brain and nervous system.",
        description: "Our Neurology department specializes in the diagnosis and treatment of disorders affecting the nervous system, including the brain, spinal cord, and nerves. We offer advanced neuro-care.",
        icon: Brain,
        color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
        features: [
            "Stroke management",
            "Epilepsy and seizure treatment",
            "Migraine and headache management",
            "Parkinson’s disease care",
            "Nerve conduction studies (NCS)",
            "EEG services"
        ],
        specialists: "Consultant Neurologists"
    }
];
