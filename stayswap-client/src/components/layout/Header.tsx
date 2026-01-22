import { Link } from 'react-router-dom';
import { Home, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ROUTES } from '@/constants/routes';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 text-gray-900">
            <Home className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">StaySwap</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to={ROUTES.LISTINGS}
              className="px-4 py-2 rounded text-gray-900 font-medium transition-all hover:text-indigo-600 hover:bg-gray-50"
            >
              숙소 찾기
            </Link>
            <Link
              to={ROUTES.NEW_LISTING}
              className="px-4 py-2 rounded text-gray-900 font-medium transition-all hover:text-indigo-600 hover:bg-gray-50"
            >
              숙소 등록
            </Link>
            <Link
              to={ROUTES.EXCHANGES}
              className="px-4 py-2 rounded text-gray-900 font-medium transition-all hover:text-indigo-600 hover:bg-gray-50"
            >
              교환 관리
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Notification Button */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.PROFILE}>마이페이지</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.SETTINGS}>설정</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={ROUTES.MESSAGES}>메시지</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link to={ROUTES.AUTH}>로그인</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
