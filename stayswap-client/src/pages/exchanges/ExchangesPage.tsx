import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Star from 'lucide-react/dist/esm/icons/star';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Home from 'lucide-react/dist/esm/icons/home';

// 교환 상태 타입
type ExchangeStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';

// 탭 타입
type TabType = 'requester' | 'host';

// 교환 아이템 타입
interface Exchange {
  swapId: number;
  houseId: number;
  houseTitle: string;
  houseImageUrl: string;
  houseCityKo: string;
  houseDistrictKo: string;
  otherUserId: number;
  otherUserName: string;
  otherUserProfileImage: string | null;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  hasReview: boolean;
}

// 상태 라벨 맵핑
const STATUS_LABELS: Record<Exchange['status'], string> = {
  PENDING: '대기중',
  ACCEPTED: '확정됨',
  COMPLETED: '완료됨',
  REJECTED: '거절됨',
};

// 상태 스타일 맵핑
const STATUS_STYLES: Record<Exchange['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
};

// 상태 필터 옵션
const STATUS_FILTERS: { value: ExchangeStatus; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'ACCEPTED', label: '확정' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'REJECTED', label: '거절' },
];

// API 함수들
const fetchExchanges = async (tab: TabType, status: ExchangeStatus): Promise<Exchange[]> => {
  const endpoint = tab === 'requester'
    ? '/api/house/swap/list/requester'
    : '/api/house/swap/list/host';

  const params = new URLSearchParams();
  if (status !== 'ALL') {
    params.set('status', status);
  }

  const url = params.toString() ? `${endpoint}?${params}` : endpoint;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('교환 목록을 불러오는데 실패했습니다.');
  }

  const data = await response.json();
  return data.data || [];
};

const updateExchangeStatus = async ({
  swapId,
  action,
}: {
  swapId: number;
  action: 'accept' | 'reject' | 'cancel';
}): Promise<void> => {
  const endpoint = `/api/house/swap/${swapId}/${action}`;
  const response = await fetch(endpoint, { method: 'POST' });

  if (!response.ok) {
    throw new Error('요청 처리에 실패했습니다.');
  }
};

export function ExchangesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('requester');
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus>('ALL');
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; exchange: Exchange | null }>({
    isOpen: false,
    exchange: null,
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });

  // 교환 목록 쿼리
  const { data: exchanges = [], isLoading, error } = useQuery({
    queryKey: ['exchanges', activeTab, statusFilter],
    queryFn: () => fetchExchanges(activeTab, statusFilter),
  });

  // 상태 변경 뮤테이션
  const statusMutation = useMutation({
    mutationFn: updateExchangeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      alert('요청이 처리되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 리뷰 작성 뮤테이션
  const reviewMutation = useMutation({
    mutationFn: async ({ swapId, rating, content }: { swapId: number; rating: number; content: string }) => {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapId, rating, content }),
      });
      if (!response.ok) throw new Error('리뷰 작성에 실패했습니다.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      setReviewModal({ isOpen: false, exchange: null });
      setReviewForm({ rating: 5, content: '' });
      alert('리뷰가 작성되었습니다.');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // 탭 변경
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setStatusFilter('ALL');
  }, []);

  // 액션 핸들러들
  const handleAccept = useCallback((swapId: number) => {
    if (confirm('교환 요청을 수락하시겠습니까?')) {
      statusMutation.mutate({ swapId, action: 'accept' });
    }
  }, [statusMutation]);

  const handleReject = useCallback((swapId: number) => {
    if (confirm('교환 요청을 거절하시겠습니까?')) {
      statusMutation.mutate({ swapId, action: 'reject' });
    }
  }, [statusMutation]);

  const handleCancel = useCallback((swapId: number) => {
    if (confirm('교환 요청을 취소하시겠습니까?')) {
      statusMutation.mutate({ swapId, action: 'cancel' });
    }
  }, [statusMutation]);

  const handleOpenReviewModal = useCallback((exchange: Exchange) => {
    setReviewModal({ isOpen: true, exchange });
    setReviewForm({ rating: 5, content: '' });
  }, []);

  const handleSubmitReview = useCallback(() => {
    if (!reviewModal.exchange) return;
    if (!reviewForm.content.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }
    reviewMutation.mutate({
      swapId: reviewModal.exchange.swapId,
      rating: reviewForm.rating,
      content: reviewForm.content,
    });
  }, [reviewModal.exchange, reviewForm, reviewMutation]);

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[1000px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">교환 관리</h1>
          <p className="text-gray-500">숙소 교환 요청을 관리하세요</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('requester')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'requester'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <RefreshCw className="w-5 h-5 inline-block mr-2" />
              내가 요청한 교환/숙박
            </button>
            <button
              onClick={() => handleTabChange('host')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'host'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-5 h-5 inline-block mr-2" />
              내가 받은 교환/숙박 요청
            </button>
          </div>

          {/* Status Filters */}
          <div className="p-4 flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exchange List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="mt-4 text-gray-500">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-red-500">교환 목록을 불러오는데 실패했습니다.</p>
            </div>
          ) : exchanges.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <RefreshCw className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {activeTab === 'requester'
                  ? '요청한 교환/숙박이 없습니다.'
                  : '받은 교환/숙박 요청이 없습니다.'}
              </p>
              <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                <Link to={ROUTES.LISTINGS}>숙소 찾아보기</Link>
              </Button>
            </div>
          ) : (
            exchanges.map(exchange => (
              <div
                key={exchange.swapId}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* 숙소 이미지 */}
                  <Link
                    to={`/listings/${exchange.houseId}`}
                    className="md:w-48 h-36 md:h-auto flex-shrink-0"
                  >
                    <img
                      src={exchange.houseImageUrl || '/images/default-house.jpg'}
                      alt={exchange.houseTitle}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* 내용 */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          to={`/listings/${exchange.houseId}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {exchange.houseTitle}
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {exchange.houseCityKo} {exchange.houseDistrictKo}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          STATUS_STYLES[exchange.status]
                        }`}
                      >
                        {STATUS_LABELS[exchange.status]}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(exchange.startDate)} ~ {formatDate(exchange.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img
                          src={exchange.otherUserProfileImage || '/images/default-avatar.png'}
                          alt={exchange.otherUserName}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{exchange.otherUserName}</span>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex gap-2 flex-wrap">
                      {/* 메시지 보내기 */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-gray-600"
                      >
                        <Link to={`${ROUTES.MESSAGES}?userId=${exchange.otherUserId}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          메시지
                        </Link>
                      </Button>

                      {/* 요청자 탭 - 대기중일 때 취소 가능 */}
                      {activeTab === 'requester' && exchange.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(exchange.swapId)}
                          disabled={statusMutation.isPending}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                      )}

                      {/* 호스트 탭 - 대기중일 때 수락/거절 가능 */}
                      {activeTab === 'host' && exchange.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(exchange.swapId)}
                            disabled={statusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            수락
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(exchange.swapId)}
                            disabled={statusMutation.isPending}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            거절
                          </Button>
                        </>
                      )}

                      {/* 완료된 교환 - 리뷰 작성 가능 */}
                      {exchange.status === 'COMPLETED' && !exchange.hasReview && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenReviewModal(exchange)}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          리뷰 작성
                        </Button>
                      )}

                      {exchange.status === 'COMPLETED' && exchange.hasReview && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <Check className="w-4 h-4 mr-1 text-green-500" />
                          리뷰 작성 완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal.isOpen && reviewModal.exchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">리뷰 작성</h3>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{reviewModal.exchange.houseTitle}</span>에 대한 리뷰를 작성해주세요.
            </p>

            {/* 별점 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= reviewForm.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 리뷰 내용 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
              <textarea
                value={reviewForm.content}
                onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="숙소와 호스트에 대한 솔직한 리뷰를 남겨주세요."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setReviewModal({ isOpen: false, exchange: null })}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    작성 중...
                  </>
                ) : (
                  '리뷰 작성'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
