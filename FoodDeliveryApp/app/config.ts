import { Platform } from 'react-native';

// UPDATE THIS URL AFTER DEPLOYING YOUR BACKEND
// For development (local):
const LOCAL_IP = '10.123.40.193'; // Your updated LAN IP
const LOCAL_URL = `http://${LOCAL_IP}:3000`;

// For production (e.g., Render, Vercel, AWS):
const PROD_URL = 'https://foodstorage.onrender.com';

export const API_BASE_URL = PROD_URL;

export const getApiUrl = (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/api/${cleanPath}`;
};

export const getPublicImageUrl = (imageUrl: string) => {
    if (!imageUrl) return 'https://via.placeholder.com/300';

    // If it's a localhost URL, replace it with production URL
    if (imageUrl.includes('localhost:3000')) {
        return imageUrl.replace('http://localhost:3000', PROD_URL).replace('localhost:3000', 'foodstorage.onrender.com');
    }

    return imageUrl;
};
