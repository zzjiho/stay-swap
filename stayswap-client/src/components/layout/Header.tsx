import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ROUTES } from '@/constants/routes';

import Home from 'lucide-react/dist/esm/icons/home';
import Bell from 'lucide-react/dist/esm/icons/bell';

interface Notification {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderProfile: string | null;
  referenceId: number | null;
  type: string;
  read: boolean;  // API 응답 필드명과 일치
  occurredAt: string;
  createdAt: string;
}

// 알림 타입별 이동 URL 반환
function getNotificationUrl(type: string, referenceId: number | null): string {
  switch (type) {
    case 'SWAP_REQUEST':
    case 'SWAP_ACCEPTED':
    case 'SWAP_REJECTED':
    case 'SWAP_EXPIRED':
    case 'BOOKING_REQUEST':
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_REJECTED':
    case 'BOOKING_EXPIRED':
    case 'CHECK_IN':
    case 'CHECK_OUT':
      return ROUTES.EXCHANGES;
    case 'LIKE_ADDED':
    case 'LIKE_REMOVED':
      return referenceId ? `/listings/${referenceId}` : ROUTES.LISTINGS;
    case 'CHAT_MESSAGE':
      return ROUTES.MESSAGES;
    default:
      return ROUTES.HOME;
  }
}

// 알림 읽음 처리 API
async function markNotificationAsRead(notificationId: string): Promise<void> {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
  });
}

interface NotificationListResponse {
  notifications: Notification[];
  hasNext: boolean;
  pivot: string | null;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch('/api/notifications', {
    credentials: 'include',
  });
  if (!response.ok) return [];
  const data = await response.json();
  const listResponse: NotificationListResponse = data.data;
  return listResponse?.notifications || [];
};

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // 알림 클릭 핸들러
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // 읽음 처리
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }

    // 드롭다운 닫기
    setIsNotificationOpen(false);

    // 해당 페이지로 이동
    const url = getNotificationUrl(notification.type, notification.referenceId);
    navigate(url);
  }, [navigate, queryClient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link
              to={ROUTES.SUBSCRIPTION}
              className="px-4 py-2 rounded text-gray-900 font-medium transition-all hover:text-violet-600 hover:bg-gray-50"
            >
              구독 플랜
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-300 transition-colors"
                  >
                    <img
                      src={user.profile || '/images/profile.png'}
                      alt="프로필"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/profile.png';
                      }}
                    />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                      <Link
                        to={ROUTES.PROFILE}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        마이페이지
                      </Link>
                      <Link
                        to={ROUTES.MY_SUBSCRIPTION}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        구독관리
                      </Link>
                      <Link
                        to={ROUTES.MESSAGES}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        메시지
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>

                {/* Notification Dropdown */}
                <div ref={notificationRef} className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                      <div className="px-4 py-3 border-b font-semibold text-gray-900">알림</div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.occurredAt).toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            알림이 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button asChild className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                <Link to={ROUTES.AUTH}>로그인</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
