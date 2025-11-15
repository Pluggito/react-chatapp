// hooks/useAxiosAuth.js

import { useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export const useAxiosAuth = () => {
  const { authToken, refreshAccessToken } = useContext(AuthContext);

  const axiosAuth = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      withCredentials: true,
    });

    // Request interceptor - attach token to every request
    instance.interceptors.request.use(
      (config) => {
        console.log('🔹 Axios Interceptor - Request');
        console.log('Token from context:', authToken?.substring(0, 30) + '...');
        console.log('Token length:', authToken?.length);
        
        if (authToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${authToken}`;
          console.log('✅ Token attached to request');
        } else {
          console.log('⚠️ No token to attach');
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle 401 and refresh token
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            console.log('🔄 Token expired, refreshing...');
            const newToken = await refreshAccessToken();
            
            // Update the failed request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return instance(originalRequest);
          } catch (refreshError) {
            console.error('❌ Refresh token failed:', refreshError);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [authToken, refreshAccessToken]);

  return axiosAuth;
};

// Alternative: Create a simple axios instance with token
export const createAuthAxios = (token) => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return instance;
};