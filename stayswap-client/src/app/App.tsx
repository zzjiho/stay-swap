import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './providers/AppProvider';
import { AppRoutes } from './routes';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
