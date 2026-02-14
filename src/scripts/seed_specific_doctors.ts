
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const doctorsToSeed = [
    {
        firstName: 'Ravikanti',
        lastName: 'Nagaraju',
        email: 'ravikanti.nagaraju@example.com',
        department: 'General Physician',
        specialization: 'General Physician',
        role: 'DOCTOR',
        status: 'ACTIVE'
    },
    {
        firstName: 'Roshan',
        lastName: 'Kumar Jaiswal',
        email: 'roshan.jaiswal@example.com',
        department: 'Paediatric Orthopaedics',
        specialization: 'Paediatric Orthopaedics',
        role: 'DOCTOR',
        status: 'ACTIVE'
    },
    {
        firstName: 'Swetha',
        lastName: 'Pendyala',
        email: 'swetha.pendyala@example.com',
        department: 'Neurology',
        specialization: 'Neurology',
        role: 'DOCTOR',
        status: 'ACTIVE'
    },
    {
        firstName: 'B. Sai Phani',
        lastName: 'Chandra',
        email: 'saiphani.chandra@example.com',
        department: 'Orthopaedics',
        specialization: 'Orthopaedics',
        role: 'DOCTOR',
        status: 'ACTIVE'
    },
    {
        firstName: 'Hariprakash',
        lastName: '',
        email: 'hariprakash@example.com',
        department: 'Orthopaedics',
        specialization: 'Orthopaedics',
        role: 'DOCTOR',
        status: 'ACTIVE'
    }
];

async function seedSpecificDoctors() {
    try {
        console.log('Fetching existing users...');
        const response = await axios.get(`${API_URL}/users`);
        const users = response.data.items || response.data;

        for (const doc of doctorsToSeed) {
            const existingUser = users.find((u: any) => u.email === doc.email);

            if (existingUser) {
                console.log(`Updating doctor: ${doc.firstName} ${doc.lastName}...`);
                // Update user
                await axios.patch(`${API_URL}/users/${existingUser.id}`, {
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    department: doc.department,
                    status: doc.status,
                    role: doc.role
                });

                // Also try to update profile specifically if endpoints exist, 
                // but typically users endpoint handles basic info.
                // Some backends separate profile updates.
                // Assuming patch /users/:id handles this as per my previous exploration.

            } else {
                console.log(`Creating doctor: ${doc.firstName} ${doc.lastName}...`);
                await axios.post(`${API_URL}/auth/register`, {
                    email: doc.email,
                    password: 'Password123!',
                    firstName: doc.firstName,
                    lastName: doc.lastName,
                    role: doc.role,
                    department: doc.department,
                    phone: "1234567890" // Dummy phone
                });
            }
        }

        console.log('Doctors updated successfully!');
    } catch (error) {
        console.error('Error seeding doctors:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
        }
    }
}

seedSpecificDoctors();
