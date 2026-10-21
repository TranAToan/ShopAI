import axios from 'axios';
import { logoutSafely, useAuthStore } from '@store/useAuthStore';
import { API_BASE_URL } from '@constants/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  response => response,
  error => {
    const sentToken = error.config?.headers?.Authorization;
    if (error.response?.status === 401 &&
        !/\/auth\/(login|register)$/.test(error.config?.url || '') &&
        sentToken === `Bearer ${useAuthStore.getState().token}`) {
      void logoutSafely();
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
