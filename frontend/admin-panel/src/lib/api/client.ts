import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - добавляет токен
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - обновляет токен при 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error: Unable to connect to server');
      return Promise.reject(new Error('Unable to connect to server. Please check your connection.'));
    }
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        // Use new refresh_token if provided, otherwise keep the old one
        const newRefreshToken = data.refresh_token || refreshToken;
        useAuthStore.getState().setTokens(data.access_token, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.warn('Session expired. Redirecting to login...');
        useAuthStore.getState().logout();
        // Check if we're in browser environment before redirect
        if (typeof window !== 'undefined') {
          // Store the current path for redirect after login
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
