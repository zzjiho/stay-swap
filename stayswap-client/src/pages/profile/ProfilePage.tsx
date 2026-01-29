import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/stores/auth.store';

import User from 'lucide-react/dist/esm/icons/user';
import Home from 'lucide-react/dist/esm/icons/home';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Star from 'lucide-react/dist/esm/icons/star';
import Settings from 'lucide-react/dist/esm/icons/settings';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Bell from 'lucide-react/dist/esm/icons/bell';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Pencil from 'lucide-react/dist/esm/icons/pencil';

// 탭 타입
type TabType = 'intro' | 'listings' | 'favorites' | 'reviews' | 'settings';

// 사용자 프로필 타입
interface UserProfile {
  userId: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  introduction: string | null;
  createdAt: string;
  pushEnabled: boolean;
}

// 숙소 타입
interface House {
  houseId: number;
  title: string;
  cityKo: string;
  districtKo: string;
  mainImageUrl: string;
  avgRating: number;
  reviewCount: number;
  active?: boolean;
}

// 리뷰 타입
interface Review {
  reviewId: number;
  houseId: number;
  houseTitle: string;
  rating: number;
  content: string;
  writerName: string;
  writerProfileImage: string | null;
  createdAt: string;
  isWrittenByMe: boolean;
}

// 탭 설정
const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'intro', label: '소개', icon: User },
  { id: 'listings', label: '내 숙소', icon: Home },
  { id: 'favorites', label: '찜', icon: Heart },
  { id: 'reviews', label: '후기', icon: Star },
  { id: 'settings', label: '설정', icon: Settings },
];

// 공통 API 응답 파서 - 배열 데이터 안전 추출
const parseArrayResponse = async <T>(response: Response): Promise<T[]> => {
  try {
    const json = await response.json();
    const data = json.data;
    // 배열 직접 반환: { data: [...] }
    if (Array.isArray(data)) return data;
    // Page/Slice 구조: { data: { content: [...] } }
    if (data?.content && Array.isArray(data.content)) return data.content;
    return [];
  } catch {
    return [];
  }
};

// API 함수들
const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('/api/user/me', { credentials: 'include' });
  if (!response.ok) throw new Error('프로필을 불러오는데 실패했습니다.');
  const json = await response.json();
  if (!json.data) throw new Error('프로필을 불러오는데 실패했습니다.');
  return json.data;
};

const fetchMyListings = async (): Promise<House[]> => {
  const response = await fetch('/api/house/my', { credentials: 'include' });
  if (!response.ok) throw new Error('내 숙소 목록을 불러오는데 실패했습니다.');
  return parseArrayResponse<House>(response);
};

const fetchFavorites = async (): Promise<House[]> => {
  const response = await fetch('/api/house/liked', { credentials: 'include' });
  if (!response.ok) throw new Error('찜 목록을 불러오는데 실패했습니다.');
  return parseArrayResponse<House>(response);
};

const fetchReceivedReviews = async (): Promise<Review[]> => {
  const response = await fetch('/api/review/received', { credentials: 'include' });
  if (!response.ok) throw new Error('받은 후기를 불러오는데 실패했습니다.');
  return parseArrayResponse<Review>(response);
};

const fetchWrittenReviews = async (): Promise<Review[]> => {
  const response = await fetch('/api/review/written', { credentials: 'include' });
  if (!response.ok) throw new Error('작성한 후기를 불러오는데 실패했습니다.');
  return parseArrayResponse<Review>(response);
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('intro');
  const [reviewTab, setReviewTab] = useState<'received' | 'written'>('received');

  // 소개 수정 모달
  const [introModal, setIntroModal] = useState<{ isOpen: boolean; introduction: string }>({
    isOpen: false,
    introduction: '',
  });

  // 프로필 쿼리
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  });

  // 내 숙소 쿼리
  const { data: myListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: fetchMyListings,
    enabled: activeTab === 'listings',
  });

  // 찜 목록 쿼리
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: activeTab === 'favorites',
  });

  // 받은 후기 쿼리
  const { data: receivedReviews = [], isLoading: receivedReviewsLoading } = useQuery({
    queryKey: ['receivedReviews'],
    queryFn: fetchReceivedReviews,
    enabled: activeTab === 'reviews' && reviewTab === 'received',
  });

  // 작성한 후기 쿼리
  const { data: writtenReviews = [], isLoading: writtenReviewsLoading } = useQuery({
    queryKey: ['writtenReviews'],
    queryFn: fetchWrittenReviews,
    enabled: activeTab === 'reviews' && reviewTab === 'written',
  });

  // 소개 수정 뮤테이션
  const updateIntroMutation = useMutation({
    mutationFn: async (introduction: string) => {
      const response = await fetch('/api/user/introduction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ introduction }),
      });
      if (!response.ok) throw new Error('소개 수정에 실패했습니다.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIntroModal({ isOpen: false, introduction: '' });
      alert('소개가 수정되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 푸시 알림 토글 뮤테이션
  const togglePushMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/user/push', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pushEnabled: enabled }),
      });
      if (!response.ok) throw new Error('설정 변경에 실패했습니다.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 찜 삭제 뮤테이션
  const unlikeMutation = useMutation({
    mutationFn: async (houseId: number) => {
      const response = await fetch(`/api/house/${houseId}/like`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('찜 삭제에 실패했습니다.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // 숙소 활성화/비활성화 뮤테이션
  const toggleHouseStatusMutation = useMutation({
    mutationFn: async ({ houseId, active }: { houseId: number; active: boolean }) => {
      const response = await fetch(`/api/house/${houseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ active }),
      });
      if (!response.ok) throw new Error('상태 변경에 실패했습니다.');
      const json = await response.json();
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      alert(`숙소가 ${data.active ? '활성화' : '비활성화'}되었습니다.`);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 소개 수정 모달 열기
  const handleOpenIntroModal = useCallback(() => {
    setIntroModal({
      isOpen: true,
      introduction: profile?.introduction || '',
    });
  }, [profile]);

  // 소개 수정 제출
  const handleSubmitIntro = useCallback(() => {
    updateIntroMutation.mutate(introModal.introduction);
  }, [introModal.introduction, updateIntroMutation]);

  // 로그아웃
  const handleLogout = useCallback(() => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      window.location.href = '/';
    }
  }, [logout]);

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[1000px]">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-6">
            <img
              src={profile?.profileImageUrl || '/images/default-avatar.png'}
              alt={profile?.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-gray-500">{profile?.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                가입일: {profile?.createdAt ? formatDate(profile.createdAt) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* 소개 탭 */}
          {activeTab === 'intro' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">자기소개</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenIntroModal}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  수정
                </Button>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">
                {profile?.introduction || '아직 자기소개가 없습니다. 자기소개를 작성해보세요!'}
              </p>
            </div>
          )}

          {/* 내 숙소 탭 */}
          {activeTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">내 숙소</h2>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <Link to={ROUTES.NEW_LISTING}>
                    <Plus className="w-4 h-4 mr-1" />
                    숙소 등록
                  </Link>
                </Button>
              </div>

              {listingsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </div>
              ) : myListings.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">등록한 숙소가 없습니다.</p>
                  <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    <Link to={ROUTES.NEW_LISTING}>첫 숙소 등록하기</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map(house => {
                    const isActive = house.active !== false;
                    return (
                      <div
                        key={house.houseId}
                        className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <Link to={`/listings/${house.houseId}`} className="block relative">
                          <img
                            src={house.mainImageUrl || '/images/default-house.jpg'}
                            alt={house.title}
                            className={`w-full h-40 object-cover ${!isActive ? 'opacity-50' : ''}`}
                          />
                          <span
                            className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded ${
                              isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {isActive ? '활성화' : '비활성화'}
                          </span>
                        </Link>
                        <div className="p-4">
                          <Link to={`/listings/${house.houseId}`}>
                            <h3 className="font-semibold text-gray-900 mb-1 hover:text-indigo-600">
                              {house.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {house.cityKo} {house.districtKo}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>{house.avgRating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-400">({house.reviewCount || 0})</span>
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex gap-2 mt-4 pt-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="flex-1"
                            >
                              <Link to={`/listings/${house.houseId}/edit`}>
                                <Pencil className="w-4 h-4 mr-1" />
                                수정
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`숙소를 ${isActive ? '비활성화' : '활성화'}하시겠습니까?`)) {
                                  toggleHouseStatusMutation.mutate({
                                    houseId: house.houseId,
                                    active: !isActive,
                                  });
                                }
                              }}
                              disabled={toggleHouseStatusMutation.isPending}
                              className={`flex-1 ${
                                isActive
                                  ? 'text-gray-600 hover:text-gray-800'
                                  : 'text-green-600 hover:text-green-700'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-1" />
                                  비활성화
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  활성화
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 찜 탭 */}
          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-semibold mb-6">찜한 숙소</h2>

              {favoritesLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">찜한 숙소가 없습니다.</p>
                  <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    <Link to={ROUTES.LISTINGS}>숙소 찾아보기</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map(house => (
                    <div
                      key={house.houseId}
                      className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow relative group"
                    >
                      <Link to={`/listings/${house.houseId}`}>
                        <img
                          src={house.mainImageUrl || '/images/default-house.jpg'}
                          alt={house.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1">{house.title}</h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {house.cityKo} {house.districtKo}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>{house.avgRating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-400">({house.reviewCount || 0})</span>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() => unlikeMutation.mutate(house.houseId)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        title="찜 삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 후기 탭 */}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold">후기</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewTab('received')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      reviewTab === 'received'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    받은 후기
                  </button>
                  <button
                    onClick={() => setReviewTab('written')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      reviewTab === 'written'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    작성한 후기
                  </button>
                </div>
              </div>

              {(reviewTab === 'received' ? receivedReviewsLoading : writtenReviewsLoading) ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                </div>
              ) : (reviewTab === 'received' ? receivedReviews : writtenReviews).length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {reviewTab === 'received' ? '받은 후기가 없습니다.' : '작성한 후기가 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(reviewTab === 'received' ? receivedReviews : writtenReviews).map(review => (
                    <div key={review.reviewId} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.writerProfileImage || '/images/default-avatar.png'}
                            alt={review.writerName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{review.writerName}</p>
                            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <Link
                        to={`/listings/${review.houseId}`}
                        className="text-sm text-indigo-600 hover:underline mb-2 inline-block"
                      >
                        {review.houseTitle}
                      </Link>
                      <p className="text-gray-600">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">설정</h2>

              {/* 알림 설정 */}
              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">푸시 알림</p>
                    <p className="text-sm text-gray-500">교환 요청, 메시지 등의 알림을 받습니다.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile?.pushEnabled || false}
                    onChange={(e) => togglePushMutation.mutate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* 구독 관리 */}
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <p className="font-medium text-gray-900">구독 플랜 관리</p>
                  <p className="text-sm text-gray-500">현재 구독 상태를 확인하고 관리합니다.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.SUBSCRIPTION}>관리하기</Link>
                </Button>
              </div>

              {/* 로그아웃 */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 소개 수정 모달 */}
      {introModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">자기소개 수정</h3>
            <div className="mb-4">
              <Label htmlFor="introduction">자기소개</Label>
              <textarea
                id="introduction"
                value={introModal.introduction}
                onChange={(e) => setIntroModal(prev => ({ ...prev, introduction: e.target.value }))}
                placeholder="자신을 소개해주세요."
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIntroModal({ isOpen: false, introduction: '' })}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitIntro}
                disabled={updateIntroMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {updateIntroMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
