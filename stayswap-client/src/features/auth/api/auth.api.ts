import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../types/auth.types';

export const authApi = {
  // 로그인 (HttpOnly 쿠키로 토큰 저장)
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data,
      {
        withCredentials: true,
      }
    );
    return response.data.data;
  },

  // 회원가입
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  // 현재 사용자 정보 조회
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/users/me', {
      withCredentials: true,
    });
    return response.data.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    await apiClient.post(
      '/auth/logout',
      {},
      {
        withCredentials: true,
      }
    );
  },

  // 토큰 리프레시 (401 에러 시 자동 호출됨 - client.ts 참고)
  refreshToken: async (): Promise<void> => {
    await apiClient.post(
      '/auth/refresh',
      {},
      {
        withCredentials: true,
      }
    );
  },

  // Access Token 가져오기 (WebSocket 등에서 사용)
  getAccessToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.get<ApiResponse<{ accessToken: string }>>(
      '/auth/token',
      {
        withCredentials: true,
      }
    );
    return response.data.data;
  },
};
