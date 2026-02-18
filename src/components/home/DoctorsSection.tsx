import { doctors } from "@/data/mockData";
import { Facebook, Twitter, Globe, Instagram, Clock, GraduationCap, Award, MapPin, Building, Stethoscope, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DoctorsSection = () => {
    const navigate = useNavigate();
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

    // Select top 4 doctors - Dr. Swetha first, then Dr. Sai Phani
    const doctorsList = [
        {
            ...doctors[1],
            full_name: "Dr. Swetha Pendyala",
            specialization: "Neurosurgery, Spinal Dysraphism and Scoliosis Correction",
            department: "Neurosurgery",
            image: "/dr_swetha_pendyala_v2_clean.jpg",
            website: "https://www.kimshospitals.com/doctor-profile/dr-swetha-pendyala/",
            availability: "Available Mon to Sat",
            location: "KIMS Hospital",
            experience: "12+ Years",
            about: "Dr. Swetha Pendyala is a Senior Consultant Neurosurgeon and Spine Surgeon at KIMS Hospital, Secunderabad. She also serves as a Visiting Consultant Neurosurgeon at Sunshine Hospital, Karimnagar, and One Hospital, Karimnagar.\n\nHer areas of special interest include Spinal Dysraphism and Scoliosis Correction. She completed her specialized training in Scoliosis Surgeries in Kochi and Fellowships in Epilepsy and Skullbase Surgery under Dr. Manas Panigrahi at KIMS Hospital, Secunderabad.",
            education: [
                "MBBS: Kamineni Institute of Medical Sciences, Narketpally (2003–2009)",
                "DNB Neurosurgery: Krishna Institute of Medical Sciences, Secunderabad (2010–2015)",
                "Fellowship in Epilepsy and Skullbase Surgery: KIMS Hospital, Secunderabad (2015–2017)",
                "Specialized Training in Scoliosis Surgeries: Kochi"
            ],
            experience_list: [
                "Senior Consultant Neurosurgeon and Spine Surgeon: KIMS Hospital, Secunderabad (Current)",
                "Visiting Consultant Neurosurgeon: Sunshine Hospital, Karimnagar",
                "Visiting Consultant Neurosurgeon: One Hospital, Karimnagar",
                "Lead Brain and Spine Surgeon: Medicover Hospital, Karimnagar (2021–2023)",
                "Lead Brain and Spine Surgeon: Akhira Hospitals, Karimnagar (2019–2021)",
                "Consultant Brain and Spine Surgeon: Great Eastern Medical School & Hospital, Ragolu, Srikakulam (2017–2019)"
            ],
            expertise: [
                "Brain Tumor Surgery",
                "Skull Base Surgery",
                "Neurovascular Surgery (Aneurysms, AVMs)",
                "Epilepsy Surgery",
                "Functional Neurosurgery (Deep Brain Stimulation)",
                "Pediatric Neurosurgery",
                "Head Injury & Trauma Management",
                "Hydrocephalus & Shunt Procedures",
                "Peripheral Nerve Surgery",
                "Minimally Invasive Neuroendoscopy",
                "Degenerative Spine Disorders",
                "Spinal Tumor Surgery",
                "Spinal Trauma & Fracture Management",
                "Spinal Deformity Correction (Scoliosis, Kyphosis)",
                "Minimally Invasive Spine Surgery (MISS)",
                "Endoscopic Spine Surgery",
                "Cervical & Lumbar Disc Replacement",
                "Spinal Fusion & Stabilization Procedures",
                "Revision Spine Surgery",
                "Pain Management & Nerve Blocks",
                "Spinal Dysraphism",
                "Scoliosis Correction",
                "Neurosurgery & Spine Surgery"
            ],
            papers: [
                "Published research on Minimally Invasive Spine Surgery techniques",
                "Paper on Management of Traumatic Brain Injuries at National Conference"
            ],
            availability_text: "Monday - Saturday: 10:00am - 09:00pm"
        },
        {
            ...doctors[0],
            full_name: "Dr. B. Sai Phani Chandra", 
            image: "/dr_sai_phani_chandra_v3_clean.png",
            imagePosition: "50% 5%",
            website: "https://www.kimshospitals.com/doctor-profile/dr-b-sai-phani-chandra/",
            specialization: "Orthopaedics, Arthroscopy & Robotic Joint Replacement Surgeon",
            department: "Orthopaedics",
            about: "Dr. Sai Phani Chandra Balijepalli is a highly experienced and dedicated orthopaedic surgeon specializing in hip and knee arthroplasty, complex trauma, and sports injuries. He is currently a Senior Consultant Orthopaedic Surgeon at Krishna Institute of Medical Sciences (KIMS) in Secunderabad, India. He also serves as a visiting consultant at KIMS-Sunshine and is an Associate Professor at Great Eastern Medical School & Hospital in Ragolu, Srikakulam.\n\nDr. Balijepalli is a certified Robotic Joint Replacement Surgeries Expert and is proficient in cartilage procedures and joint preservation techniques. His practice focuses on shoulder and knee arthroscopy, as well as primary and revision replacement surgeries of the hip and knee. He is officially registered with the Telangana State Medical Council (MCI Registration No: 67674).",
            education: [
                "MBBS: Kakatiya Medical College, Warangal",
                "DNB in Orthopaedics and Sports Medicine: Kamineni Hospitals, Hyderabad",
                "Fellowship in Joint Replacement Surgery: Kamineni Hospitals, Hyderabad",
                "Fellowship in Knee Arthroscopy Surgery: Kamineni Hospitals, Hyderabad",
                "Fellowship in Hip and Knee Joint Replacement: SRM Hospitals, Chennai",
                "Revision Arthroplasty Cadaveric Training: Chulalongkorn University",
                "Advanced Training in Unicondylar Oxford Knee Replacement: Ganga Hospital",
                "Observership in Advanced Shoulder and Knee Arthroscopy: Asan Medical Center, South Korea",
                "Clinical Scrubbed Observership in Advanced Shoulder Arthroscopy: Clinica Ars Medica, Switzerland, and Mendrisio Regional Hospital"
            ],
            experience_list: [
                "Consultant Orthopaedic and Robotic Joint Replacement Surgeon: KIMS Hospitals, Secunderabad",
                "Lead Consultant Orthopaedic and Joint Replacement Surgeon: Medicover Hospitals, Karimnagar",
                "Consultant Orthopaedic and Joint Replacement Surgeon: Sunshine Hospitals, Karimnagar",
                "Assistant Professor in Orthopaedics: Great Eastern Medical School & Hospitals, Srikakulam",
                "Assistant Professor: Kamineni Academy of Medical Sciences and Research Center",
                "Senior Registrar: Kamineni Academy of Medical Sciences and Research Center",
                "Orthopaedics Resident: Kamineni Hospitals, Hyderabad",
                "Junior Resident, Neurosurgery: CARE Hospitals, Hyderabad"
            ],
            expertise: [
                "Performed over 5,000 joint replacement surgeries.",
                "Completed over 1,000 arthroscopic ACL reconstructions and other complex knee ligament surgeries.",
                "Executed over 10,000 adult and pediatric trauma surgeries, including complex periarticular surgeries and acetabular fractures.",
                "Proficient in Ilizarov surgeries for the femur and tibia.",
                "Robotic Replacement Surgeon",
                "Revision and Complex Hip and Knee Surgeon",
                "Specialist in Advanced Knee and Shoulder Arthroscopy",
                "Foot & Ankle Surgeon"
            ],
            papers: [
                "Awarded a 'GOLD MEDAL' for a paper presentation on the role of zoledronic acid in musculoskeletal diseases.",
                "Co-investigator in two multicentric studies on the treatment of osteoarthritis of the knee.",
                "Functional outcome in arthroscopic anterior cruciate ligament reconstruction by suspensory fixation in comparison with aperture fixation method",
                "ZIMMERSPLINT: A Simple and effective technique for the treatment of intra-articular phalangeal of hand",
                "A Comparative Study of Arthroscopic ACL Reconstruction Using Single Bundle versus Double Bundle Technique"
            ],
            availability_text: "Monday to Friday: 9 am to 5 pm - KIMS Secunderabad\n1st & 3rd Saturday: 9 am to 5 pm - Warangal\n2nd & 4th Saturday: 9 am to 5 pm - Karimnagar"
        },
        {
            ...doctors[2],
            full_name: "Dr. Roshan Kumar Jaiswal",
            specialization: "Paediatric Orthopaedic Surgeon & Complex Trauma Surgeon Specialist",
            department: "Paediatric Orthopaedics",
            image: "/dr_roshan_kumar_jaiswal_v2_clean.png",
            website: "https://www.kimshospitals.com/doctor-profile/dr-roshan-kumar-jaiswal/",
            location: "KIMS Hospital",
            experience: "8+ Years",
            about: "Dr. Roshan Kumar Jaiswal is a Consultant Paediatric Orthopaedic Surgeon & Complex Trauma Surgeon Specialist. His expertise lies in Paediatric Orthopaedics and Deformity Surgery.\n\nHis areas of interest cover a wide spectrum of paediatric orthopaedics, including Paediatric Orthopaedic Surgeries, Deformity Correction, Gait Correction, and the comprehensive management of Cerebral Palsy. He is a member of POSI (Paediatric Orthopaedic Society of India).",
            education: [
                "MBBS",
                "DNB ORTHOPAEDICS"
            ],
            experience_list: [
                "Consultant Paediatric Orthopaedic Surgeon",
                "Complex Trauma Surgeon Specialist"
            ],
            expertise: [
                "PAEDIATRIC ORTHOPAEDICS AND DEFORMITY SURGEON",
                "PAEDIATRIC ORTHOPAEDIC SURGERIES",
                "DEFORMITY CORRECTION",
                "GAIT CORRECTION",
                "CEREBRAL PALSY"
            ],
            memberships: [
                "POSI (Paediatric Orthopaedic Society of India)"
            ],
            availability_text: "Monday to Saturday: 10:00 AM - 04:00 PM"
        },
        {
            ...doctors[3],
            full_name: "Dr. D. Hari Prakash",
            image: "/dr_hariprakash_v2_clean.png",
            specialization: "Orthopaedics, Knee and Shoulder Arthroscopic surgeries",
            department: "Orthopaedics",
            website: "https://drhariprakash.com/",
            location: "Kompally, Hyderabad",
            experience: "8+ Years",
            about: "Dr.Hariprakash is one of the best Orthopaedic Surgeons in Hyderabad, located at Kompally. He has performed over 4500+ surgeries including 250+ Knee & Hip Replacement 150+ Knee and Shoulder Arthroscopic surgeries.\n\nDr.Hariprakash has performed thousands of procedures and surgeries, his areas of expertise are Arthroplasty (joint replacement surgery) of knee, hip, shoulder, elbow, small joints, Arthroscopy of knee, shoulder and hip.\n\nDr.Hariprakash clinically evaluates the condition before deciding on the appropriate and suitable treatment. He made thousands of patients happy with his passionate and expert treatments. He has 8+ years' of experience in treating various Fractures, Arthritis, Rheumatoid arthritis, Sciatica, Osteoporosis, Tendon ruptures, Ligament tears, Vascular injuries, Sports injuries etc.\n\nDr.Hariprakash completed his MBBS, from Kurnool Medical college. He did his D Ortho from Kamineni Medical College, Narketpally, Hyderabad (stood 2nd in the AP State). He completed his secondary DNB from Kamineni Hospitals Hyderabad.\n\nDr.Hariprakash successfully finished his Fellowship in in Arthroscopy and Arthroplasty (Joint Replacement Surgery) from Sancheti Hospital Pune. He clinical internship at Harvard medical school, Boston, USA under the expert guidance of Dr Edward K. Rodriguez. He gained experience from his mentor Dr Robert Robichaux, when he was a Research Assistant at University of Alabama Birmingham USA.\n\nDr.Hariprakash was associated with Aditya hospitals Hyderabad. Worked as Orthopaedic Joint replacement Surgeon at Apex hospital Boduppal Hyderabad and at Jeevan Hospital kharmanghat Hyderabad. Presently working as Consultant Orhtopedic Arthroscpic and Joint replacement Surgeon at Renova Hospital Kompally, Hyderabad.\n\nDr.Hariprakash actively participated and presented many research papers at various national and international CMEs and medical conferences. And has published multiple research papers successfully in popular medical journals.\n\nDr.Hariprakash has successfully completed various workshops, Internships, Research Programs and fellowships to master his surgical skills and advanced treatment procedures. He is one of the best Orthopaedic Surgeons in the city.",
            education: [
                "MBBS: Kurnool Medical College",
                "D Ortho: Kamineni Medical College, Narketpally, Hyderabad (stood 2nd in the AP State)",
                "Secondary DNB: Kamineni Hospitals Hyderabad",
                "Fellowship in Arthroscopy and Arthroplasty (Joint Replacement Surgery): Sancheti Hospital Pune",
                "Clinical Internship: Harvard Medical School, Boston, USA under Dr. Edward K. Rodriguez",
                "Research Assistant: University of Alabama Birmingham, USA under Dr. Robert Robichaux"
            ],
            experience_list: [
                "Consultant Orthopaedic Arthroscopic and Joint Replacement Surgeon: Renova Hospital Kompally, Hyderabad (Current)",
                "Orthopaedic Joint Replacement Surgeon: Jeevan Hospital Kharmanghat, Hyderabad",
                "Orthopaedic Joint Replacement Surgeon: Apex Hospital Boduppal, Hyderabad",
                "Associated with Aditya Hospitals, Hyderabad"
            ],
            expertise: [
                "Performed over 4500+ surgeries",
                "250+ Knee & Hip Replacement surgeries",
                "150+ Knee and Shoulder Arthroscopic surgeries",
                "Arthroplasty (joint replacement surgery) of knee, hip, shoulder, elbow, small joints",
                "Arthroscopy of knee, shoulder and hip",
                "Treatment of Fractures, Arthritis, Rheumatoid arthritis, Sciatica, Osteoporosis",
                "Tendon ruptures, Ligament tears, Vascular injuries, Sports injuries",
                "Orthopaedic Surgeon",
                "Expert in Complex Trauma",
                "Arthroscopy",
                "Joint Replacement Surgeries"
            ],
            papers: [
                "Actively participated and presented many research papers at various national and international CMEs and medical conferences",
                "Published multiple research papers successfully in popular medical journals",
                "Completed various workshops, Internships, Research Programs and fellowships"
            ],
            availability_text: "Monday to Saturday: 10:00 AM - 04:00 PM"
        },
        {
            id: 'dr-ravikanti-nagaraju',
            user_id: 'doc-user-ravikanti',
            full_name: "Dr. Ravikanti Nagaraju",
            email: "ravikanti.nagaraju@hospital.com",
            phone: "+91-99999-99999",
            specialization: "General Physician / Internist",
            department: "General Medicine",
            image: "/dr_ravikanti_nagaraju.jpg",
            website: "#",
            license_number: "TSMC-XXXXX",
            experience_years: 10,
            consultation_fee: 150,
            location: "Medicover Hospital, Karimnagar",
            experience: "10+ Years",
            status: 'active' as const,
            availability: [],
            about: "Dr. Ravikanti Nagaraju is a Consultant General Physician / Internist with over 10 years of clinical experience.\n\nHe has worked as a Senior Resident at Apollo Hospitals, Bangalore and as a Consultant at Renee Hospital, Karimnagar for 3 years. He is currently a Consultant at Medicover Hospital, Karimnagar for over 4 years.\n\nHis areas of expertise include Tropical & Infectious Diseases, Respiratory Tract Infections, Sepsis & Medical Emergencies, Diabetes, Hypertension & Cardiac Diseases, Poisoning, Snake Bite, and DKA.\n\nHe is a member of the Association of Physicians of India (API) and presented a paper on Tropical Diseases in 2015.",
            education: [
                "MBBS",
                "DNB (Internal Medicine)"
            ],
            experience_list: [
                "Senior Resident – Apollo Hospitals, Bangalore",
                "Consultant – Renee Hospital, Karimnagar (3 Years)",
                "Present Consultant – Medicover Hospital, Karimnagar (4+ Years)"
            ],
            expertise: [
                "Tropical & Infectious Diseases",
                "Respiratory Tract Infections",
                "Sepsis & Medical Emergencies",
                "Diabetes, Hypertension & Cardiac Diseases",
                "Poisoning, Snake Bite, DKA"
            ],
            papers: [
                "Paper Presented on Tropical Diseases (2015)"
            ],
            memberships: [
                "Member – Association of Physicians of India (API)"
            ],
            availability_text: "Monday to Saturday: 05:00 PM - 09:00 PM"
        },
        {
            id: 'dr-mahesh-gudelli',
            user_id: 'doc-user-mahesh',
            full_name: "Dr. Mahesh Gudelli",
            email: "mahesh.gudelli@hospital.com",
            phone: "+91-91542-89324",
            specialization: "Pulmonology",
            department: "Pulmonology",
            image: "/dr_mahesh_gudelli.jpg",
            website: "https://www.kimshospitals.com/doctor-profile/dr-mahesh-gudelli/",
            license_number: "TSMC-XXXXX",
            experience_years: 6,
            consultation_fee: 150,
            location: "KIMS Hospitals, Secunderabad & Swetha Saiphani Clinic, Karimnagar",
            experience: "6+ Years",
            status: 'active' as const,
            availability: [],
            about: "Dr. Mahesh Gudelli is a passionate Consultant Clinical & Interventional Pulmonologist with over 6 years of experience. He is currently working at KIMS Hospitals, Minister Road, Secunderabad and Swetha Saiphani Clinic, Karimnagar.\n\nHe has expertise in Airway & Parenchymal diseases, Pleural diseases, Lung Malignancies, and Sleep medicine. He has received training in State-of-the-Art facilities for Interventions such as Intercostal Drainage, Medical Thoracoscopy & Pleural Biopsy, Diagnostic & Therapeutic Bronchoscopy, EBUS, and Cryo-Lung Biopsy.\n\nHe is also the Course Director and Faculty for the Interventional Pulmonology Fellowship Programme at KIMS Hospitals in association with the Indian Association for Bronchology (IAB).",
            education: [
                "MBBS: Kakatiya Medical College, Warangal (2013)",
                "DNB Pulmonary Medicine: Yashoda Hospital, Hyderabad (2018)",
                "EDARM, Pulmonary Medicine: European Respiratory Society (ERS), Switzerland (2023)",
                "Certificate Course in Health Care Management: ISB, Hyderabad (2023)",
                "Comprehensive Sleep Medicine Course: APCCSM, India (2022)"
            ],
            experience_list: [
                "Consultant Clinical & Interventional Pulmonologist: KIMS Hospitals, Secunderabad (2023 - Current)",
                "Consultant Pulmonologist: Swetha Saiphani Clinic, Karimnagar (Current)",
                "Associate Consultant & Interventional Pulmonologist: Yashoda Hospital, Secunderabad (2020 - 2023)",
                "Senior Resident/Registrar: Yashoda Hospital (2018 - 2020)",
                "Resident, Pulmonary Medicine: Yashoda Hospital (2015 - 2018)"
            ],
            expertise: [
                "Diagnostic & Therapeutic Bronchoscopy",
                "Endobronchial & Transbronchial Lung Biopsy",
                "Cryo Lung Biopsy",
                "EBUS (Convex & Radial)",
                "Medical Thoracoscopy & Pleural Biopsy",
                "Airway Foreign Body Removal",
                "Rigid Bronchoscopy",
                "Interventional Pulmonology",
                "Airway Diseases (Asthma & COPD)",
                "Sleep Medicine",
                "Lung Malignancies",
                "Interstitial Lung Diseases"
            ],
            papers: [
                "Effectiveness and outcomes of noninvasive positive pressure ventilation... (Cureus, 2024)",
                "An incidentally detected Partial Anomalous Pulmonary Venous Connection... (2022)",
                "A Rare Case of Adenocarcinoma of the Lung in a Young Non-Smoker Male (2023)"
            ],
            memberships: [
                "Indian Chest Society (ICS)",
                "European Respiratory Society (ERS)",
                "American College of Chest Physicians (ACCP)",
                "Asian Pacific Society of Respirology (APSR)",
                "Indian Association for Bronchology (IAB)",
                "World Association for Bronchology & Interventional Pulmonology (WABIP)"
            ],
            availability_text: "Monday - Saturday: 10:00 AM - 09:00 PM"
        },
        {
            id: 'dr-navya-sri',
            user_id: 'doc-user-navya',
            full_name: "Dr. Navya Sri Yenigalla",
            email: "navyasri.yenigalla@hospital.com",
            phone: "+91-91542-89324",
            specialization: "Pediatric Hemato-Oncology & BMT",
            department: "Haematology",
            image: "/dr_navya_sri.jpg",
            website: "#",
            license_number: "TSMC-XXXXX",
            experience_years: 20,
            consultation_fee: 150,
            location: "Omega Multispeciality Hospital, Gachibowli & Swetha Saiphani Clinic, Karimnagar",
            experience: "20+ Years",
            status: 'active' as const,
            availability: [],
            about: "Dr Navyasri Yenigalla is a well-known Haematologist associated with Omega Multispeciality Hospital, Gachibowli and Swetha Saiphani Clinic, Karimnagar. She has 20 years of experience in Haematology and worked as an expert in different cities in India.\n\nDoctor Yenigalla has contributed to handling numerous complex medical cases in several hospitals. She is known for her attention to accurate diagnosis and for treating patients empathetically.\n\nThe speciality interests of Dr Navyasri are Paediatric and adult Hemato Oncology and Stem Cell Transplantation.\n\nDr Navyasri did her MBBS and MD Paediatrics and Hemato Oncology. She has also participated in research work and various workshops under the Haematology department and published many papers.",
            education: [
                "MBBS",
                "MD – Pediatrics",
                "Fellowship in Pediatric Hemato-Oncology & BMT"
            ],
            experience_list: [
                "Consultant Pediatric Hemato-Oncologist & Transplant Physician: Omega Multispeciality Hospital, Gachibowli",
                "Consultant Pediatric Hemato-Oncologist: Swetha Saiphani Clinic, Karimnagar",
                "Expert in Haematology in different cities in India",
                "Former Consultant at various prestigious hospitals"
            ],
            expertise: [
                "Bone Marrow Transplant Services",
                "Autologous Transplant",
                "Allogeneic Transplant",
                "Haplo (HAPLO) Transplant",
                "Matched Unrelated Donor (MUD) Transplant",
                "CAR-T Cell Therapy",
                "Paediatric and adult Hemato Oncology",
                "Stem Cell Transplantation",
                "Acute Leukemias",
                "Aplastic Anemia",
                "Thalassemia",
                "Sickle Cell Disease",
                "Hodgkin & Non-Hodgkin Lymphomas",
                "Amyloidosis",
                "Myelodysplasia",
                "Young Sarcoma",
                "Rhabdomyosarcoma",
                "Immunodeficiency Syndromes",
                "Various Metabolic Disorders",
                "Congenital / Genetic Disorders"
            ],
            availability_text: "Monday - Saturday: 10:00 AM - 09:00 PM"
        },
        {
            id: 'dr-sneha-sagar',
            user_id: 'doc-user-sneha',
            full_name: "Dr. Sneha Sagar",
            email: "sneha.sagar@hospital.com",
            phone: "+91-91542-89324",
            specialization: "Medical Oncology",
            department: "Oncology",
            image: "/dr_sneha_sagar.jpg",
            website: "#",
            license_number: "TSMC-XXXXX",
            experience_years: 5,
            consultation_fee: 150,
            location: "KIMS Hospitals, Secunderabad & Swetha Saiphani Clinic, Karimnagar",
            experience: "5 Years",
            status: 'active' as const,
            availability: [],
            about: "Dr. Sneha Sagar is a Renowned Medical Oncologist, Currently Working as a Consultant Medical Oncologist, in KIMS Hospitals, Secunderabad and Swetha Saiphani Clinic, Karimnagar.\n\nShe is a budding Oncologist with an Experience of close to 5 years including her training period.\n\nHer passion strives for early detection of cancers, by conducting various screening camps and giving awareness talks. Her core interest and expertise is treating women cancers, including breast and gynaecological malignancies. Her experience so far includes curing early breast cancers and ovarian cancers, managing stage 4 lung cancer with cutting edge novel therapies like targeted therapy and immunotherapy, treatment of lymphomas and leukemias.\n\nDr. Sneha emphasises on believing in that most of the early cancers, are curable and hence the diagnosis should not be delayed. Everyone should have awareness about the signs and symptoms, of all the common cancers & should not neglect early diagnosis. This is Dr. Sneha’s mission to bridge the gap in the society about awareness, and increase the rate of early detection to save lives. She has represented the city in various national and international conferences conducted in India and Europe, presenting her work on various cancer related issues. She has also done research on lung cancer during her training period and published papers on, adverse effects of chemotherapy. Her passion and motto is to, conduct screening sessions and awareness talks to, combat mortality in cancer.",
            education: [
                "Diplomate of National Board (Medical Oncology), Omega Hospitals - Hyderabad (2018 - 2021)",
                "Doctor of Medicine (General Medicine), Mediciti Institute of Medical Sciences - Hyderabad (2013 - 2016)",
                "Bachelor of Medicine & Bachelor of Surgery (MBBS), Sri Ramachandra University - Chennai (2005 - 2009)"
            ],
            experience_list: [
                "Consultant Medical Oncologist: KIMS Hospitals, Secunderabad (2023 - Current)",
                "Consultant Medical Oncologist: Swetha Saiphani Clinic, Karimnagar (Current)",
                "Senior Resident, Basavatarakam Indo-American Cancer Hospital (2021 – 2022)",
                "Senior Resident, Department of Medical Oncology, Omega Hospitals (2018 – 2021)",
                "Senior Resident (Rural Service), Government Fever Hospital (2016 – 2017)",
                "Jr. Resident, General Medicine, Mediciti Institute Medical Sciences (2013 – 2016)"
            ],
            expertise: [
                "Women Cancers (Breast and Gynaecological Malignancies)",
                "Stage 4 Lung Cancer (Targeted Therapy and Immunotherapy)",
                "Lymphomas and Leukemias",
                "Early Detection and Screening"
            ],
            papers: [
                "Utility of Mucositis Predictive Tools in Patients Receiving Chemo Radiotherapy... (2021)",
                "Chronic Budd Chiari Syndrome With Probable Etiology Of Obstruction... (2014)"
            ],
            presentations: [
                "Oral presentation on Utility of Mucositis Predictive Tools... (ISOCON, 2020)",
                "Poster presentation on Impact of Education for Breast Self Examination... (ESMO, 2019)",
                "Poster presentation on Budd-Chiari Syndrome... (APICON, 2013)"
            ],
            availability_text: "Monday - Saturday: 10:00 AM - 09:00 PM"
        },
        {
            id: 'dr-t-dheeraj',
            user_id: 'doc-user-dheeraj',
            full_name: "Dr. T Dheeraj",
            email: "dheeraj@hospital.com",
            phone: "+91-91542-89324",
            specialization: "Surgical Oncology",
            department: "Oncology",
            image: "/dr_t_dheeraj.jpg",
            website: "#",
            license_number: "TSMC-XXXXX",
            experience_years: 1,
            consultation_fee: 150,
            location: "Swetha Saiphani Clinic, Karimnagar",
            experience: "Junior Consultant",
            status: 'active' as const,
            availability: [],
            about: "Dr. T Dheeraj is a Junior Consultant in Surgical Oncology, specializing in cancer surgeries at Swetha Saiphani Clinic, Karimnagar. He is dedicated to providing comprehensive cancer care with a focus on surgical interventions.",
            education: [
                "MBBS",
                "MS General Surgery",
                "DrNB Surgical Oncology"
            ],
            experience_list: [
                "Junior Consultant Surgical Oncology: Swetha Saiphani Clinic, Karimnagar (Current)"
            ],
            expertise: [
                "Cancer Surgery",
                "Tumor Resection",
                "Surgical Oncology"
            ],
            availability_text: "Monday - Saturday: 10:00 AM - 09:00 PM"
        },
    ];

    return (
        <section className="py-20 lg:py-28 bg-white dark:bg-slate-900">
            <div className="container">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Our Team</span>
                    <h2 className="mt-3 text-slate-900 dark:text-white">
                        Meet Our Expert Doctors
                    </h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                        Our team of highly trained medical professionals is dedicated to providing specialized care tailored to your needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {doctorsList.map((doctor) => (
                        <div key={doctor.id} className="group bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-[2/3] overflow-hidden bg-slate-200">
                                <OptimizedImage
                                    src={doctor.image}
                                    alt={doctor.full_name}
                                    width={600}
                                    height={900}
                                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                                    loading="lazy"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                                {/* Social Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                                    <div className="flex gap-3 text-white">
                                        <a href="https://www.facebook.com/profile.php?id=61586434084791" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-blue-600 backdrop-blur-sm rounded-full transition-colors"><Facebook className="w-4 h-4" /></a>
                                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-sky-500 backdrop-blur-sm rounded-full transition-colors"><Twitter className="w-4 h-4" /></a>
                                        <a href="https://www.instagram.com/swethasaiphani_clinics?igsh=bWN1YXNlaWdzcXg=" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-pink-600 backdrop-blur-sm rounded-full transition-colors"><Instagram className="w-4 h-4" /></a>
                                        <a href={doctor.website || "#"} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 hover:bg-indigo-600 backdrop-blur-sm rounded-full transition-colors"><Globe className="w-4 h-4" /></a>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 text-center">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{doctor.full_name}</h3>
                                <p className="text-blue-600 text-sm font-medium mb-4 line-clamp-1">{doctor.specialization}</p>

                                <div className="space-y-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => navigate('/book-appointment', { state: { doctorId: doctor.id } })}
                                    >
                                        Book Appointment
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                        onClick={() => setSelectedDoctor(doctor)}
                                    >
                                        Read More
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
                <DialogContent className="sm:max-w-[900px] h-[90vh] overflow-hidden flex flex-col p-0">
                    {selectedDoctor && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg shrink-0 mx-auto md:mx-0">
                                    <OptimizedImage
                                        src={selectedDoctor.image}
                                        alt={selectedDoctor.full_name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover"
                                        loading="eager"
                                    />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <DialogTitle className="text-2xl font-bold mb-2">{selectedDoctor.full_name}</DialogTitle>
                                    <p className="text-blue-600 font-medium text-lg leading-tight mb-3">{selectedDoctor.specialization}</p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Award className="w-4 h-4 text-blue-500" />
                                            <span>{selectedDoctor.experience_years} Years Exp.</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Building className="w-4 h-4 text-blue-500" />
                                            <span>{selectedDoctor.department}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <span>Secunderabad</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <Button
                                        className="rounded-full px-6"
                                        onClick={() => {
                                            navigate('/book-appointment', { state: { doctorId: selectedDoctor.id } });
                                            setSelectedDoctor(null);
                                        }}
                                    >
                                        Book Appointment
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-8 max-w-4xl mx-auto">
                                    {/* About Section */}
                                    {selectedDoctor.about && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <Award className="w-5 h-5 text-blue-600" />
                                                About Doctor
                                            </h4>
                                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                {selectedDoctor.about}
                                            </div>
                                        </section>
                                    )}

                                    {/* Availability */}
                                    <section>
                                        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            Op Timing
                                        </h4>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                            {selectedDoctor.availability_text ? (
                                                <pre className="font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedDoctor.availability_text}</pre>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedDoctor.availability?.map((slot: any, index: number) => (
                                                        <span key={index} className="px-3 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium shadow-sm">
                                                            {slot.day.slice(0, 3)}: {slot.start_time} - {slot.end_time}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Surgical Expertise */}
                                    {selectedDoctor.expertise && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <Stethoscope className="w-5 h-5 text-blue-600" />
                                                Surgical Expertise
                                            </h4>
                                            <ul className="grid md:grid-cols-2 gap-3">
                                                {selectedDoctor.expertise.map((item: string, index: number) => (
                                                    <li key={index} className="flex gap-2 text-slate-600 dark:text-slate-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {/* Education */}
                                    {selectedDoctor.education && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                                Education and Training
                                            </h4>
                                            <div className="grid md:grid-cols-1 gap-2">
                                                {selectedDoctor.education.map((item: string, index: number) => (
                                                    <div key={index} className="flex gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Professional Experience */}
                                    {selectedDoctor.experience_list && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <Building className="w-5 h-5 text-blue-600" />
                                                Professional Experience
                                            </h4>
                                            <ul className="space-y-2">
                                                {selectedDoctor.experience_list.map((item: string, index: number) => (
                                                    <li key={index} className="flex gap-2 text-slate-600 dark:text-slate-300 border-l-2 border-blue-200 dark:border-blue-800 pl-3 py-1">
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {/* Research and Publications */}
                                    {selectedDoctor.papers && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                                Research and Publications
                                            </h4>
                                            <ul className="space-y-3">
                                                {selectedDoctor.papers.map((item: string, index: number) => (
                                                    <li key={index} className="text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 italic text-sm">
                                                        "{item}"
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}

                                    {/* Memberships */}
                                    {selectedDoctor.memberships && (
                                        <section>
                                            <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white mb-3">
                                                <Award className="w-5 h-5 text-blue-600" />
                                                Memberships
                                            </h4>
                                            <ul className="space-y-3">
                                                {selectedDoctor.memberships.map((item: string, index: number) => (
                                                    <li key={index} className="text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 font-medium text-sm">
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </div>
                            </ScrollArea>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 md:hidden bg-white dark:bg-slate-900">
                                <Button
                                    className="w-full rounded-full"
                                    onClick={() => {
                                        navigate('/book-appointment', { state: { doctorId: selectedDoctor.id } });
                                        setSelectedDoctor(null);
                                    }}
                                >
                                    Book Appointment
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
};
