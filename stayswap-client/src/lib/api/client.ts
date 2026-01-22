import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // HttpOnly 쿠키를 위해 필수
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // HttpOnly 쿠키는 자동으로 포함됨
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - 401 에러는 그냥 reject (refresh 로직 비활성화)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 에러는 그냥 통과시킴 (무한 루프 방지)
    return Promise.reject(error);
  }
);
