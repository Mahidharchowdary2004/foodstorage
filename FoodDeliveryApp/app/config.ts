import { Platform } from 'react-native';

// UPDATE THIS URL AFTER DEPLOYING YOUR BACKEND
// For development (local):
const LOCAL_IP = '10.123.40.193'; // Your updated LAN IP
const LOCAL_URL = `http://${LOCAL_IP}:3000`;

// For production (e.g., Render, Vercel, AWS):
const PROD_URL = 'https://your-food-delivery-backend.onrender.com'; // Replace this later

export const API_BASE_URL = Platform.select({
    web: 'http://localhost:3000',
    android: LOCAL_URL, // Use PROD_URL when building for release
    ios: LOCAL_URL,     // Use PROD_URL when building for release
    default: LOCAL_URL,
});

export const getApiUrl = (path: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/api/${cleanPath}`;
};
