import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import Crown from 'lucide-react/dist/esm/icons/crown';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Star from 'lucide-react/dist/esm/icons/star';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Check from 'lucide-react/dist/esm/icons/check';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

// 현재 구독 정보 타입
interface CurrentSubscription {
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  nextBillingDate?: string;
  paymentMethod?: string;
}

// 결제 내역 타입
interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'completed' | 'failed' | 'refunded';
}

// Mock API: 현재 구독 정보 조회
const fetchCurrentSubscription = async (): Promise<CurrentSubscription> => {
  // TODO: 실제 API 연동
  return {
    planId: 'free',
    planName: 'Free',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2099-12-31',
    autoRenew: false,
  };
};

// Mock API: 결제 내역 조회
const fetchPaymentHistory = async (): Promise<PaymentHistory[]> => {
  // TODO: 실제 API 연동
  return [];
};

// 플랜 혜택 목록
const PLAN_BENEFITS: Record<string, string[]> = {
  free: [
    '숙소 등록 1개',
    '교환 요청 월 3회',
    '기본 메시지 기능',
    '기본 검색',
  ],
  basic: [
    '숙소 등록 3개',
    '교환 요청 월 10회',
    '고급 검색 필터',
    '프리미엄 숙소 노출',
    'TimeBank 서비스 월 5시간',
  ],
  premium: [
    '숙소 등록 무제한',
    '교환 요청 무제한',
    '우선 고객 지원',
    '프리미엄 숙소 노출',
    'TimeBank 서비스 무제한',
    'LiveLocal 경험',
  ],
};

export function MySubscriptionPage() {
  const [showCancelModal, setShowCancelModal] = useState(false);

  // 현재 구독 정보 조회
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: fetchCurrentSubscription,
  });

  // 결제 내역 조회
  const { data: paymentHistory = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: fetchPaymentHistory,
  });

  // 자동 갱신 토글
  const handleToggleAutoRenew = () => {
    // TODO: API 호출
    alert('자동 갱신 설정이 변경되었습니다. (API 연동 필요)');
  };

  // 구독 취소
  const handleCancelSubscription = () => {
    // TODO: API 호출
    alert('구독이 취소되었습니다. 현재 결제 기간 종료 후 Free 플랜으로 전환됩니다. (API 연동 필요)');
    setShowCancelModal(false);
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const planIcon = subscription?.planId === 'premium'
    ? <Crown className="w-8 h-8 text-amber-600" />
    : subscription?.planId === 'basic'
      ? <Zap className="w-8 h-8 text-violet-600" />
      : <Star className="w-8 h-8 text-gray-600" />;

  const planBgColor = subscription?.planId === 'premium'
    ? 'bg-amber-100'
    : subscription?.planId === 'basic'
      ? 'bg-violet-100'
      : 'bg-gray-100';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">구독 관리</h1>
          <p className="text-gray-600 mt-1">현재 구독 상태를 확인하고 관리하세요</p>
        </div>

        {/* 현재 구독 상태 카드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* 플랜 정보 */}
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${planBgColor}`}>
                {planIcon}
              </div>
              <div>
                <p className="text-sm text-gray-500">현재 플랜</p>
                <p className="text-2xl font-bold text-gray-900">{subscription?.planName}</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                  subscription?.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : subscription?.status === 'cancelled'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {subscription?.status === 'active' ? '활성' :
                   subscription?.status === 'cancelled' ? '취소 예정' : '만료됨'}
                </span>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {subscription?.planId !== 'premium' && (
                <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Link to="/subscription">
                    업그레이드
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
              {subscription?.planId !== 'free' && subscription?.status === 'active' && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="border-gray-300 text-gray-700"
                >
                  구독 취소
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 구독 상세 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 구독 기간 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">구독 기간</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">시작일</span>
                <span className="font-medium">
                  {subscription?.startDate
                    ? new Date(subscription.startDate).toLocaleDateString('ko-KR')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">종료일</span>
                <span className="font-medium">
                  {subscription?.planId === 'free'
                    ? '무기한'
                    : subscription?.endDate
                      ? new Date(subscription.endDate).toLocaleDateString('ko-KR')
                      : '-'}
                </span>
              </div>
              {subscription?.nextBillingDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">다음 결제일</span>
                  <span className="font-medium">
                    {new Date(subscription.nextBillingDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 결제 정보 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">결제 정보</h3>
            </div>
            {subscription?.planId === 'free' ? (
              <p className="text-gray-500">Free 플랜은 결제 정보가 필요하지 않습니다.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 수단</span>
                  <span className="font-medium">{subscription?.paymentMethod || '없음'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">자동 갱신</span>
                  <button
                    onClick={handleToggleAutoRenew}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      subscription?.autoRenew ? 'bg-violet-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        subscription?.autoRenew ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 현재 플랜 혜택 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">현재 플랜 혜택</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLAN_BENEFITS[subscription?.planId || 'free']?.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
          {subscription?.planId !== 'premium' && (
            <div className="mt-4 pt-4 border-t">
              <Link
                to="/subscription"
                className="text-violet-600 hover:text-violet-700 font-medium inline-flex items-center"
              >
                더 많은 혜택 보기
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* 결제 내역 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">결제 내역</h3>
            <button className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {isLoadingPayments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              결제 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{payment.planName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₩{formatPrice(payment.amount)}</p>
                    <span className={`text-xs ${
                      payment.status === 'completed' ? 'text-green-600' :
                      payment.status === 'refunded' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {payment.status === 'completed' ? '완료' :
                       payment.status === 'refunded' ? '환불' : '실패'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구독 취소 모달 */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">구독을 취소하시겠습니까?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                구독을 취소해도 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.
                이후 Free 플랜으로 자동 전환됩니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  구독 취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
