/**
 * Geographic Data for Country, State, District Selection
 * This file contains comprehensive country data with ISO codes, phone codes,
 * states/provinces, and districts/regions for dynamic dropdown support.
 */

export interface Country {
    code: string;        // ISO 3166-1 alpha-2 code
    name: string;
    phoneCode: string;   // Country calling code
    flag: string;        // Emoji flag
}

export interface State {
    code: string;
    name: string;
    countryCode: string;
}

export interface District {
    code: string;
    name: string;
    stateCode: string;
}

// Comprehensive list of countries with ISO codes and phone codes
export const countries: Country[] = [
    { code: 'IN', name: 'India', phoneCode: '+91', flag: '🇮🇳' },
    { code: 'US', name: 'United States', phoneCode: '+1', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', phoneCode: '+44', flag: '🇬🇧' },
    { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', phoneCode: '+966', flag: '🇸🇦' },
    { code: 'CA', name: 'Canada', phoneCode: '+1', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', phoneCode: '+61', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', phoneCode: '+49', flag: '🇩🇪' },
    { code: 'FR', name: 'France', phoneCode: '+33', flag: '🇫🇷' },
    { code: 'SG', name: 'Singapore', phoneCode: '+65', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', phoneCode: '+60', flag: '🇲🇾' },
    { code: 'BD', name: 'Bangladesh', phoneCode: '+880', flag: '🇧🇩' },
    { code: 'PK', name: 'Pakistan', phoneCode: '+92', flag: '🇵🇰' },
    { code: 'NP', name: 'Nepal', phoneCode: '+977', flag: '🇳🇵' },
    { code: 'LK', name: 'Sri Lanka', phoneCode: '+94', flag: '🇱🇰' },
    { code: 'AF', name: 'Afghanistan', phoneCode: '+93', flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', phoneCode: '+355', flag: '🇦🇱' },
    { code: 'DZ', name: 'Algeria', phoneCode: '+213', flag: '🇩🇿' },
    { code: 'AR', name: 'Argentina', phoneCode: '+54', flag: '🇦🇷' },
    { code: 'AT', name: 'Austria', phoneCode: '+43', flag: '🇦🇹' },
    { code: 'BH', name: 'Bahrain', phoneCode: '+973', flag: '🇧🇭' },
    { code: 'BE', name: 'Belgium', phoneCode: '+32', flag: '🇧🇪' },
    { code: 'BT', name: 'Bhutan', phoneCode: '+975', flag: '🇧🇹' },
    { code: 'BR', name: 'Brazil', phoneCode: '+55', flag: '🇧🇷' },
    { code: 'BN', name: 'Brunei', phoneCode: '+673', flag: '🇧🇳' },
    { code: 'KH', name: 'Cambodia', phoneCode: '+855', flag: '🇰🇭' },
    { code: 'CN', name: 'China', phoneCode: '+86', flag: '🇨🇳' },
    { code: 'CY', name: 'Cyprus', phoneCode: '+357', flag: '🇨🇾' },
    { code: 'DK', name: 'Denmark', phoneCode: '+45', flag: '🇩🇰' },
    { code: 'EG', name: 'Egypt', phoneCode: '+20', flag: '🇪🇬' },
    { code: 'FI', name: 'Finland', phoneCode: '+358', flag: '🇫🇮' },
    { code: 'GR', name: 'Greece', phoneCode: '+30', flag: '🇬🇷' },
    { code: 'HK', name: 'Hong Kong', phoneCode: '+852', flag: '🇭🇰' },
    { code: 'ID', name: 'Indonesia', phoneCode: '+62', flag: '🇮🇩' },
    { code: 'IR', name: 'Iran', phoneCode: '+98', flag: '🇮🇷' },
    { code: 'IQ', name: 'Iraq', phoneCode: '+964', flag: '🇮🇶' },
    { code: 'IE', name: 'Ireland', phoneCode: '+353', flag: '🇮🇪' },
    { code: 'IL', name: 'Israel', phoneCode: '+972', flag: '🇮🇱' },
    { code: 'IT', name: 'Italy', phoneCode: '+39', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', phoneCode: '+81', flag: '🇯🇵' },
    { code: 'JO', name: 'Jordan', phoneCode: '+962', flag: '🇯🇴' },
    { code: 'KE', name: 'Kenya', phoneCode: '+254', flag: '🇰🇪' },
    { code: 'KW', name: 'Kuwait', phoneCode: '+965', flag: '🇰🇼' },
    { code: 'LA', name: 'Laos', phoneCode: '+856', flag: '🇱🇦' },
    { code: 'LB', name: 'Lebanon', phoneCode: '+961', flag: '🇱🇧' },
    { code: 'MV', name: 'Maldives', phoneCode: '+960', flag: '🇲🇻' },
    { code: 'MX', name: 'Mexico', phoneCode: '+52', flag: '🇲🇽' },
    { code: 'MM', name: 'Myanmar', phoneCode: '+95', flag: '🇲🇲' },
    { code: 'NL', name: 'Netherlands', phoneCode: '+31', flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', phoneCode: '+64', flag: '🇳🇿' },
    { code: 'NG', name: 'Nigeria', phoneCode: '+234', flag: '🇳🇬' },
    { code: 'NO', name: 'Norway', phoneCode: '+47', flag: '🇳🇴' },
    { code: 'OM', name: 'Oman', phoneCode: '+968', flag: '🇴🇲' },
    { code: 'PH', name: 'Philippines', phoneCode: '+63', flag: '🇵🇭' },
    { code: 'PL', name: 'Poland', phoneCode: '+48', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', phoneCode: '+351', flag: '🇵🇹' },
    { code: 'QA', name: 'Qatar', phoneCode: '+974', flag: '🇶🇦' },
    { code: 'RU', name: 'Russia', phoneCode: '+7', flag: '🇷🇺' },
    { code: 'ZA', name: 'South Africa', phoneCode: '+27', flag: '🇿🇦' },
    { code: 'KR', name: 'South Korea', phoneCode: '+82', flag: '🇰🇷' },
    { code: 'ES', name: 'Spain', phoneCode: '+34', flag: '🇪🇸' },
    { code: 'SE', name: 'Sweden', phoneCode: '+46', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', phoneCode: '+41', flag: '🇨🇭' },
    { code: 'TW', name: 'Taiwan', phoneCode: '+886', flag: '🇹🇼' },
    { code: 'TH', name: 'Thailand', phoneCode: '+66', flag: '🇹🇭' },
    { code: 'TR', name: 'Turkey', phoneCode: '+90', flag: '🇹🇷' },
    { code: 'UA', name: 'Ukraine', phoneCode: '+380', flag: '🇺🇦' },
    { code: 'VN', name: 'Vietnam', phoneCode: '+84', flag: '🇻🇳' },
    { code: 'YE', name: 'Yemen', phoneCode: '+967', flag: '🇾🇪' },
];

// States/Provinces by country
export const states: State[] = [
    // India - All States and Union Territories
    { code: 'IN-AP', name: 'Andhra Pradesh', countryCode: 'IN' },
    { code: 'IN-AR', name: 'Arunachal Pradesh', countryCode: 'IN' },
    { code: 'IN-AS', name: 'Assam', countryCode: 'IN' },
    { code: 'IN-BR', name: 'Bihar', countryCode: 'IN' },
    { code: 'IN-CG', name: 'Chhattisgarh', countryCode: 'IN' },
    { code: 'IN-GA', name: 'Goa', countryCode: 'IN' },
    { code: 'IN-GJ', name: 'Gujarat', countryCode: 'IN' },
    { code: 'IN-HR', name: 'Haryana', countryCode: 'IN' },
    { code: 'IN-HP', name: 'Himachal Pradesh', countryCode: 'IN' },
    { code: 'IN-JH', name: 'Jharkhand', countryCode: 'IN' },
    { code: 'IN-KA', name: 'Karnataka', countryCode: 'IN' },
    { code: 'IN-KL', name: 'Kerala', countryCode: 'IN' },
    { code: 'IN-MP', name: 'Madhya Pradesh', countryCode: 'IN' },
    { code: 'IN-MH', name: 'Maharashtra', countryCode: 'IN' },
    { code: 'IN-MN', name: 'Manipur', countryCode: 'IN' },
    { code: 'IN-ML', name: 'Meghalaya', countryCode: 'IN' },
    { code: 'IN-MZ', name: 'Mizoram', countryCode: 'IN' },
    { code: 'IN-NL', name: 'Nagaland', countryCode: 'IN' },
    { code: 'IN-OD', name: 'Odisha', countryCode: 'IN' },
    { code: 'IN-PB', name: 'Punjab', countryCode: 'IN' },
    { code: 'IN-RJ', name: 'Rajasthan', countryCode: 'IN' },
    { code: 'IN-SK', name: 'Sikkim', countryCode: 'IN' },
    { code: 'IN-TN', name: 'Tamil Nadu', countryCode: 'IN' },
    { code: 'IN-TS', name: 'Telangana', countryCode: 'IN' },
    { code: 'IN-TR', name: 'Tripura', countryCode: 'IN' },
    { code: 'IN-UP', name: 'Uttar Pradesh', countryCode: 'IN' },
    { code: 'IN-UK', name: 'Uttarakhand', countryCode: 'IN' },
    { code: 'IN-WB', name: 'West Bengal', countryCode: 'IN' },
    // Union Territories
    { code: 'IN-AN', name: 'Andaman and Nicobar Islands', countryCode: 'IN' },
    { code: 'IN-CH', name: 'Chandigarh', countryCode: 'IN' },
    { code: 'IN-DD', name: 'Dadra and Nagar Haveli and Daman and Diu', countryCode: 'IN' },
    { code: 'IN-DL', name: 'Delhi', countryCode: 'IN' },
    { code: 'IN-JK', name: 'Jammu and Kashmir', countryCode: 'IN' },
    { code: 'IN-LA', name: 'Ladakh', countryCode: 'IN' },
    { code: 'IN-LD', name: 'Lakshadweep', countryCode: 'IN' },
    { code: 'IN-PY', name: 'Puducherry', countryCode: 'IN' },

    // United States - Major States
    { code: 'US-AL', name: 'Alabama', countryCode: 'US' },
    { code: 'US-AK', name: 'Alaska', countryCode: 'US' },
    { code: 'US-AZ', name: 'Arizona', countryCode: 'US' },
    { code: 'US-AR', name: 'Arkansas', countryCode: 'US' },
    { code: 'US-CA', name: 'California', countryCode: 'US' },
    { code: 'US-CO', name: 'Colorado', countryCode: 'US' },
    { code: 'US-CT', name: 'Connecticut', countryCode: 'US' },
    { code: 'US-DE', name: 'Delaware', countryCode: 'US' },
    { code: 'US-FL', name: 'Florida', countryCode: 'US' },
    { code: 'US-GA', name: 'Georgia', countryCode: 'US' },
    { code: 'US-HI', name: 'Hawaii', countryCode: 'US' },
    { code: 'US-ID', name: 'Idaho', countryCode: 'US' },
    { code: 'US-IL', name: 'Illinois', countryCode: 'US' },
    { code: 'US-IN', name: 'Indiana', countryCode: 'US' },
    { code: 'US-IA', name: 'Iowa', countryCode: 'US' },
    { code: 'US-KS', name: 'Kansas', countryCode: 'US' },
    { code: 'US-KY', name: 'Kentucky', countryCode: 'US' },
    { code: 'US-LA', name: 'Louisiana', countryCode: 'US' },
    { code: 'US-ME', name: 'Maine', countryCode: 'US' },
    { code: 'US-MD', name: 'Maryland', countryCode: 'US' },
    { code: 'US-MA', name: 'Massachusetts', countryCode: 'US' },
    { code: 'US-MI', name: 'Michigan', countryCode: 'US' },
    { code: 'US-MN', name: 'Minnesota', countryCode: 'US' },
    { code: 'US-MS', name: 'Mississippi', countryCode: 'US' },
    { code: 'US-MO', name: 'Missouri', countryCode: 'US' },
    { code: 'US-MT', name: 'Montana', countryCode: 'US' },
    { code: 'US-NE', name: 'Nebraska', countryCode: 'US' },
    { code: 'US-NV', name: 'Nevada', countryCode: 'US' },
    { code: 'US-NH', name: 'New Hampshire', countryCode: 'US' },
    { code: 'US-NJ', name: 'New Jersey', countryCode: 'US' },
    { code: 'US-NM', name: 'New Mexico', countryCode: 'US' },
    { code: 'US-NY', name: 'New York', countryCode: 'US' },
    { code: 'US-NC', name: 'North Carolina', countryCode: 'US' },
    { code: 'US-ND', name: 'North Dakota', countryCode: 'US' },
    { code: 'US-OH', name: 'Ohio', countryCode: 'US' },
    { code: 'US-OK', name: 'Oklahoma', countryCode: 'US' },
    { code: 'US-OR', name: 'Oregon', countryCode: 'US' },
    { code: 'US-PA', name: 'Pennsylvania', countryCode: 'US' },
    { code: 'US-RI', name: 'Rhode Island', countryCode: 'US' },
    { code: 'US-SC', name: 'South Carolina', countryCode: 'US' },
    { code: 'US-SD', name: 'South Dakota', countryCode: 'US' },
    { code: 'US-TN', name: 'Tennessee', countryCode: 'US' },
    { code: 'US-TX', name: 'Texas', countryCode: 'US' },
    { code: 'US-UT', name: 'Utah', countryCode: 'US' },
    { code: 'US-VT', name: 'Vermont', countryCode: 'US' },
    { code: 'US-VA', name: 'Virginia', countryCode: 'US' },
    { code: 'US-WA', name: 'Washington', countryCode: 'US' },
    { code: 'US-WV', name: 'West Virginia', countryCode: 'US' },
    { code: 'US-WI', name: 'Wisconsin', countryCode: 'US' },
    { code: 'US-WY', name: 'Wyoming', countryCode: 'US' },
    { code: 'US-DC', name: 'Washington, D.C.', countryCode: 'US' },

    // United Kingdom
    { code: 'GB-ENG', name: 'England', countryCode: 'GB' },
    { code: 'GB-SCT', name: 'Scotland', countryCode: 'GB' },
    { code: 'GB-WLS', name: 'Wales', countryCode: 'GB' },
    { code: 'GB-NIR', name: 'Northern Ireland', countryCode: 'GB' },

    // UAE
    { code: 'AE-AZ', name: 'Abu Dhabi', countryCode: 'AE' },
    { code: 'AE-DU', name: 'Dubai', countryCode: 'AE' },
    { code: 'AE-SH', name: 'Sharjah', countryCode: 'AE' },
    { code: 'AE-AJ', name: 'Ajman', countryCode: 'AE' },
    { code: 'AE-FU', name: 'Fujairah', countryCode: 'AE' },
    { code: 'AE-RK', name: 'Ras Al Khaimah', countryCode: 'AE' },
    { code: 'AE-UQ', name: 'Umm Al Quwain', countryCode: 'AE' },

    // Canada
    { code: 'CA-AB', name: 'Alberta', countryCode: 'CA' },
    { code: 'CA-BC', name: 'British Columbia', countryCode: 'CA' },
    { code: 'CA-MB', name: 'Manitoba', countryCode: 'CA' },
    { code: 'CA-NB', name: 'New Brunswick', countryCode: 'CA' },
    { code: 'CA-NL', name: 'Newfoundland and Labrador', countryCode: 'CA' },
    { code: 'CA-NS', name: 'Nova Scotia', countryCode: 'CA' },
    { code: 'CA-ON', name: 'Ontario', countryCode: 'CA' },
    { code: 'CA-PE', name: 'Prince Edward Island', countryCode: 'CA' },
    { code: 'CA-QC', name: 'Quebec', countryCode: 'CA' },
    { code: 'CA-SK', name: 'Saskatchewan', countryCode: 'CA' },

    // Australia
    { code: 'AU-NSW', name: 'New South Wales', countryCode: 'AU' },
    { code: 'AU-QLD', name: 'Queensland', countryCode: 'AU' },
    { code: 'AU-SA', name: 'South Australia', countryCode: 'AU' },
    { code: 'AU-TAS', name: 'Tasmania', countryCode: 'AU' },
    { code: 'AU-VIC', name: 'Victoria', countryCode: 'AU' },
    { code: 'AU-WA', name: 'Western Australia', countryCode: 'AU' },
    { code: 'AU-ACT', name: 'Australian Capital Territory', countryCode: 'AU' },
    { code: 'AU-NT', name: 'Northern Territory', countryCode: 'AU' },
];

// Districts - Comprehensive list for Telangana and key states
export const districts: District[] = [
    // Telangana Districts
    { code: 'IN-TS-KNR', name: 'Karimnagar', stateCode: 'IN-TS' },
    { code: 'IN-TS-HYD', name: 'Hyderabad', stateCode: 'IN-TS' },
    { code: 'IN-TS-RNG', name: 'Rangareddy', stateCode: 'IN-TS' },
    { code: 'IN-TS-WRG', name: 'Warangal Urban', stateCode: 'IN-TS' },
    { code: 'IN-TS-WRR', name: 'Warangal Rural', stateCode: 'IN-TS' },
    { code: 'IN-TS-KHM', name: 'Khammam', stateCode: 'IN-TS' },
    { code: 'IN-TS-NZB', name: 'Nizamabad', stateCode: 'IN-TS' },
    { code: 'IN-TS-ADB', name: 'Adilabad', stateCode: 'IN-TS' },
    { code: 'IN-TS-MHB', name: 'Mahabubnagar', stateCode: 'IN-TS' },
    { code: 'IN-TS-NAL', name: 'Nalgonda', stateCode: 'IN-TS' },
    { code: 'IN-TS-MED', name: 'Medak', stateCode: 'IN-TS' },
    { code: 'IN-TS-SDD', name: 'Siddipet', stateCode: 'IN-TS' },
    { code: 'IN-TS-JGT', name: 'Jagtial', stateCode: 'IN-TS' },
    { code: 'IN-TS-PDK', name: 'Peddapalli', stateCode: 'IN-TS' },
    { code: 'IN-TS-RJN', name: 'Rajanna Sircilla', stateCode: 'IN-TS' },
    { code: 'IN-TS-SGR', name: 'Sangareddy', stateCode: 'IN-TS' },
    { code: 'IN-TS-MDC', name: 'Medchal-Malkajgiri', stateCode: 'IN-TS' },
    { code: 'IN-TS-VKB', name: 'Vikarabad', stateCode: 'IN-TS' },
    { code: 'IN-TS-KMR', name: 'Kamareddy', stateCode: 'IN-TS' },
    { code: 'IN-TS-WNP', name: 'Wanaparthy', stateCode: 'IN-TS' },
    { code: 'IN-TS-JGL', name: 'Jogulamba Gadwal', stateCode: 'IN-TS' },
    { code: 'IN-TS-NRP', name: 'Narayanpet', stateCode: 'IN-TS' },
    { code: 'IN-TS-BHD', name: 'Bhadradri Kothagudem', stateCode: 'IN-TS' },
    { code: 'IN-TS-SKP', name: 'Suryapet', stateCode: 'IN-TS' },
    { code: 'IN-TS-YDB', name: 'Yadadri Bhuvanagiri', stateCode: 'IN-TS' },
    { code: 'IN-TS-JYS', name: 'Jayashankar Bhupalpally', stateCode: 'IN-TS' },
    { code: 'IN-TS-MUL', name: 'Mulugu', stateCode: 'IN-TS' },
    { code: 'IN-TS-MCH', name: 'Mancherial', stateCode: 'IN-TS' },
    { code: 'IN-TS-KMB', name: 'Kumuram Bheem', stateCode: 'IN-TS' },
    { code: 'IN-TS-NRM', name: 'Nirmal', stateCode: 'IN-TS' },
    { code: 'IN-TS-JNN', name: 'Jangaon', stateCode: 'IN-TS' },
    { code: 'IN-TS-MBN', name: 'Mahabubabad', stateCode: 'IN-TS' },
    { code: 'IN-TS-NBD', name: 'Nagarkurnool', stateCode: 'IN-TS' },

    // Andhra Pradesh Districts
    { code: 'IN-AP-VIS', name: 'Visakhapatnam', stateCode: 'IN-AP' },
    { code: 'IN-AP-VJY', name: 'Vijayawada', stateCode: 'IN-AP' },
    { code: 'IN-AP-GNT', name: 'Guntur', stateCode: 'IN-AP' },
    { code: 'IN-AP-KNL', name: 'Kurnool', stateCode: 'IN-AP' },
    { code: 'IN-AP-NLR', name: 'Nellore', stateCode: 'IN-AP' },
    { code: 'IN-AP-KDP', name: 'Kadapa', stateCode: 'IN-AP' },
    { code: 'IN-AP-ATP', name: 'Anantapur', stateCode: 'IN-AP' },
    { code: 'IN-AP-CHT', name: 'Chittoor', stateCode: 'IN-AP' },
    { code: 'IN-AP-PRK', name: 'Prakasam', stateCode: 'IN-AP' },
    { code: 'IN-AP-EGD', name: 'East Godavari', stateCode: 'IN-AP' },
    { code: 'IN-AP-WGD', name: 'West Godavari', stateCode: 'IN-AP' },
    { code: 'IN-AP-KRS', name: 'Krishna', stateCode: 'IN-AP' },
    { code: 'IN-AP-SPT', name: 'Srikakulam', stateCode: 'IN-AP' },
    { code: 'IN-AP-VZN', name: 'Vizianagaram', stateCode: 'IN-AP' },

    // Karnataka Districts
    { code: 'IN-KA-BLR', name: 'Bengaluru Urban', stateCode: 'IN-KA' },
    { code: 'IN-KA-BLR-R', name: 'Bengaluru Rural', stateCode: 'IN-KA' },
    { code: 'IN-KA-MYS', name: 'Mysuru', stateCode: 'IN-KA' },
    { code: 'IN-KA-MLR', name: 'Mangaluru', stateCode: 'IN-KA' },
    { code: 'IN-KA-HBL', name: 'Hubballi-Dharwad', stateCode: 'IN-KA' },
    { code: 'IN-KA-BEL', name: 'Belgaum', stateCode: 'IN-KA' },
    { code: 'IN-KA-GUL', name: 'Gulbarga', stateCode: 'IN-KA' },

    // Maharashtra Districts
    { code: 'IN-MH-MUM', name: 'Mumbai', stateCode: 'IN-MH' },
    { code: 'IN-MH-PUN', name: 'Pune', stateCode: 'IN-MH' },
    { code: 'IN-MH-NAG', name: 'Nagpur', stateCode: 'IN-MH' },
    { code: 'IN-MH-THN', name: 'Thane', stateCode: 'IN-MH' },
    { code: 'IN-MH-NSK', name: 'Nashik', stateCode: 'IN-MH' },
    { code: 'IN-MH-AUR', name: 'Aurangabad', stateCode: 'IN-MH' },

    // Tamil Nadu Districts
    { code: 'IN-TN-CHN', name: 'Chennai', stateCode: 'IN-TN' },
    { code: 'IN-TN-CBE', name: 'Coimbatore', stateCode: 'IN-TN' },
    { code: 'IN-TN-MDU', name: 'Madurai', stateCode: 'IN-TN' },
    { code: 'IN-TN-TRC', name: 'Tiruchirappalli', stateCode: 'IN-TN' },
    { code: 'IN-TN-SLM', name: 'Salem', stateCode: 'IN-TN' },

    // Delhi Districts
    { code: 'IN-DL-NDL', name: 'New Delhi', stateCode: 'IN-DL' },
    { code: 'IN-DL-NDL-N', name: 'North Delhi', stateCode: 'IN-DL' },
    { code: 'IN-DL-NDL-S', name: 'South Delhi', stateCode: 'IN-DL' },
    { code: 'IN-DL-NDL-E', name: 'East Delhi', stateCode: 'IN-DL' },
    { code: 'IN-DL-NDL-W', name: 'West Delhi', stateCode: 'IN-DL' },
    { code: 'IN-DL-NDL-C', name: 'Central Delhi', stateCode: 'IN-DL' },

    // US Major Counties/Regions (Examples)
    { code: 'US-CA-LA', name: 'Los Angeles County', stateCode: 'US-CA' },
    { code: 'US-CA-SF', name: 'San Francisco County', stateCode: 'US-CA' },
    { code: 'US-CA-SD', name: 'San Diego County', stateCode: 'US-CA' },
    { code: 'US-NY-NYC', name: 'New York City', stateCode: 'US-NY' },
    { code: 'US-TX-HS', name: 'Harris County (Houston)', stateCode: 'US-TX' },
    { code: 'US-TX-DL', name: 'Dallas County', stateCode: 'US-TX' },

    // UK Regions (Examples)
    { code: 'GB-ENG-LDN', name: 'Greater London', stateCode: 'GB-ENG' },
    { code: 'GB-ENG-MAN', name: 'Greater Manchester', stateCode: 'GB-ENG' },
    { code: 'GB-ENG-BRM', name: 'Birmingham', stateCode: 'GB-ENG' },
    { code: 'GB-SCT-EDN', name: 'Edinburgh', stateCode: 'GB-SCT' },
    { code: 'GB-SCT-GLA', name: 'Glasgow', stateCode: 'GB-SCT' },

    // UAE Districts (Examples)
    { code: 'AE-DU-DWN', name: 'Dubai Downtown', stateCode: 'AE-DU' },
    { code: 'AE-DU-MRN', name: 'Dubai Marina', stateCode: 'AE-DU' },
    { code: 'AE-AZ-CTR', name: 'Abu Dhabi Central', stateCode: 'AE-AZ' },
];

// Mandals for Karimnagar district (keeping the existing mandals and adding more)
export interface Mandal {
    code: string;
    name: string;
    districtCode: string;
}

export const mandals: Mandal[] = [
    // Karimnagar District Mandals
    { code: 'IN-TS-KNR-URB', name: 'Karimnagar Urban', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-RUR', name: 'Karimnagar Rural', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-MNK', name: 'Manakondur', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-TMP', name: 'Thimmapur', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-CPD', name: 'Choppadandi', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-GNG', name: 'Gangadhara', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-RMD', name: 'Ramadugu', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-KDY', name: 'Kothapalli', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-HZR', name: 'Huzurabad', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-KMD', name: 'Komuravelli', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-JMK', name: 'Jammikunta', districtCode: 'IN-TS-KNR' },
    { code: 'IN-TS-KNR-VML', name: 'Veenavanka', districtCode: 'IN-TS-KNR' },

    // Hyderabad District Mandals
    { code: 'IN-TS-HYD-SBD', name: 'Secunderabad', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-AMB', name: 'Amberpet', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-KHT', name: 'Khairatabad', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-JBL', name: 'Jubilee Hills', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-BNJ', name: 'Banjara Hills', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-GCB', name: 'Gachibowli', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-MDH', name: 'Madhapur', districtCode: 'IN-TS-HYD' },
    { code: 'IN-TS-HYD-KPL', name: 'Kukatpally', districtCode: 'IN-TS-HYD' },

    // Warangal Urban District Mandals
    { code: 'IN-TS-WRG-URB', name: 'Warangal Urban', districtCode: 'IN-TS-WRG' },
    { code: 'IN-TS-WRG-HNK', name: 'Hanmakonda', districtCode: 'IN-TS-WRG' },
    { code: 'IN-TS-WRG-KZP', name: 'Kazipet', districtCode: 'IN-TS-WRG' },
];

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
};

export const getStatesByCountry = (countryCode: string): State[] => {
    return states.filter(s => s.countryCode === countryCode);
};

export const getDistrictsByState = (stateCode: string): District[] => {
    return districts.filter(d => d.stateCode === stateCode);
};

export const getMandalsByDistrict = (districtCode: string): Mandal[] => {
    return mandals.filter(m => m.districtCode === districtCode);
};

export const getPhoneCodeByCountry = (countryCode: string): string => {
    const country = countries.find(c => c.code === countryCode);
    return country?.phoneCode || '+91';
};

// Sort countries alphabetically but keep India first
export const getSortedCountries = (): Country[] => {
    const india = countries.find(c => c.code === 'IN');
    const others = countries.filter(c => c.code !== 'IN').sort((a, b) => a.name.localeCompare(b.name));
    return india ? [india, ...others] : others;
};
