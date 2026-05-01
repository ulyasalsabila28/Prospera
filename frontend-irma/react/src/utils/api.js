const BASE_URL = 'http://localhost:5000/api';

export const apiFetch = async (endpoint) => {
    const token = localStorage.getItem('token'); // Mengambil token jika ada
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
    }

    return response.json();
};
