import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      toast.error('로그인이 필요한 서비스입니다', {
        id: 'auth-required',
        description: '로그인 페이지로 이동합니다',
        icon: <LogIn className="h-5 w-5" />,
        duration: 2000,
      });

      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (shouldRedirect) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // 리다이렉트 전 빈 화면 (토스트만 보임)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Outlet />;
}
