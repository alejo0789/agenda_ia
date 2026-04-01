import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

console.log('🔧 API Client configurado con base URL:', API_URL);

// Crear instancia de axios
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar token a las peticiones
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📤 Request:', config.method?.toUpperCase(), (config.baseURL ?? '') + config.url);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
    (response) => {
        console.log('✅ Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('❌ Error Response:', error.response?.status, error.config?.url, error.response?.data);
        if (error.response?.status === 401) {
            // Token expirado o inválido o sesión eliminada del backend
            // Limpiar localStorage manualmente para evitar ciclos de importación con el store
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage');

            // Redirigir al login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
