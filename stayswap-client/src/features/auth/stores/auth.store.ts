import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../api/auth.api';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    immer((set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,

      // Actions
      initialize: async () => {
        try {
          // 사용자 정보 조회로 인증 상태 확인
          const user = await authApi.getMe();
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
          });
        } catch (error) {
          // 인증 실패 (401 등)
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
          });
        } finally {
          set((state) => {
            state.isInitialized = true;
          });
        }
      },

      login: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
        });
        try {
          const { user } = await authApi.login({ email, password });
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      logout: async () => {
        // 상태 초기화
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });

        try {
          // 로그아웃 API 호출 (쿠키 삭제)
          await authApi.logout();
        } catch (error) {
          console.warn('로그아웃 API 호출 실패:', error);
        }

        // 홈으로 이동 (React Router 사용)
        window.location.href = '/';
      },

      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },
    })),
    { name: 'auth-store' }
  )
);
