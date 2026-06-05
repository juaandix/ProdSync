import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: '/backend-api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject auth token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: normalize error messages + handle expired session
let sessionExpiredShown = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const method = error.config?.method?.toUpperCase();
      // Solo redirigir en GET — en mutaciones mostrar error sin redirigir
      if (method === 'GET') {
        Cookies.remove('authToken', { path: '/' });
        Cookies.remove('userRole', { path: '/' });
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/signin')) {
          if (!sessionExpiredShown) {
            sessionExpiredShown = true;
            toast.error('Sesión expirada. Inicia sesión de nuevo.');
            setTimeout(() => {
              sessionExpiredShown = false;
              window.location.href = '/signin';
            }, 1500);
          }
        }
      }
    }
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unknown error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
