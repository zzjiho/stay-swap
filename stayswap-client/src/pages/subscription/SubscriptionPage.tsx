import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

import Crown from 'lucide-react/dist/esm/icons/crown';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

// 구독 플랜 타입
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
  popular?: boolean;
}

// 현재 구독 정보 타입
interface CurrentSubscription {
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

// 구독 플랜 목록
const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'monthly',
    features: [
      { name: '숙소 등록', included: true, limit: '1개' },
      { name: '교환 요청', included: true, limit: '월 3회' },
      { name: '메시지', included: true },
      { name: '기본 검색', included: true },
      { name: '프리미엄 숙소 노출', included: false },
      { name: '우선 고객 지원', included: false },
      { name: 'TimeBank 서비스', included: false },
      { name: 'LiveLocal 경험', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9900,
    period: 'monthly',
    popular: true,
    features: [
      { name: '숙소 등록', included: true, limit: '3개' },
      { name: '교환 요청', included: true, limit: '월 10회' },
      { name: '메시지', included: true },
      { name: '고급 검색 필터', included: true },
      { name: '프리미엄 숙소 노출', included: true },
      { name: '우선 고객 지원', included: false },
      { name: 'TimeBank 서비스', included: true, limit: '월 5시간' },
      { name: 'LiveLocal 경험', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29900,
    period: 'monthly',
    features: [
      { name: '숙소 등록', included: true, limit: '무제한' },
      { name: '교환 요청', included: true, limit: '무제한' },
      { name: '메시지', included: true },
      { name: '고급 검색 필터', included: true },
      { name: '프리미엄 숙소 노출', included: true },
      { name: '우선 고객 지원', included: true },
      { name: 'TimeBank 서비스', included: true, limit: '무제한' },
      { name: 'LiveLocal 경험', included: true },
    ],
  },
];

// Mock API: 현재 구독 정보 조회
const fetchCurrentSubscription = async (): Promise<CurrentSubscription | null> => {
  // TODO: 실제 API 연동
  // const response = await fetch('/api/subscription/current', { credentials: 'include' });
  // if (!response.ok) return null;
  // const json = await response.json();
  // return json.data;

  // Mock 데이터
  return {
    planId: 'free',
    planName: 'Free',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2099-12-31',
    autoRenew: false,
  };
};

export function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // 현재 구독 정보 조회
  const { data: currentSubscription, isLoading } = useQuery({
    queryKey: ['currentSubscription'],
    queryFn: fetchCurrentSubscription,
  });

  // 가격 계산 (연간 결제 시 20% 할인)
  const getPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'yearly') {
      return Math.floor(plan.price * 12 * 0.8);
    }
    return plan.price;
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 플랜 선택 핸들러
  const handleSelectPlan = (planId: string) => {
    if (planId === currentSubscription?.planId) return;
    setSelectedPlan(planId);
  };

  // 구독 변경 핸들러
  const handleSubscribe = () => {
    if (!selectedPlan) return;
    // TODO: 결제 페이지로 이동 또는 결제 모달 표시
    alert(`${PLANS.find(p => p.id === selectedPlan)?.name} 플랜으로 변경합니다.\n(결제 기능은 준비 중입니다)`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-100 rounded-full mb-4">
            <Crown className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 플랜</h1>
          <p className="text-gray-600">나에게 맞는 플랜을 선택하고 더 많은 혜택을 누리세요</p>
        </div>

        {/* 결제 주기 선택 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연간 결제
              <span className="ml-2 text-xs text-violet-600 font-bold">20% 할인</span>
            </button>
          </div>
        </div>

        {/* 플랜 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentSubscription?.planId === plan.id;
            const isSelected = selectedPlan === plan.id;
            const price = getPrice(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-violet-500 shadow-lg shadow-violet-100'
                    : isCurrentPlan
                      ? 'border-violet-200 bg-violet-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                } ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {/* 인기 배지 */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      가장 인기
                    </span>
                  </div>
                )}

                {/* 현재 플랜 배지 */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      현재 플랜
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* 플랜 헤더 */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {price === 0 ? '무료' : `₩${formatPrice(price)}`}
                      </span>
                      {price > 0 && (
                        <span className="text-gray-500">
                          /{billingPeriod === 'monthly' ? '월' : '년'}
                        </span>
                      )}
                    </div>
                    {billingPeriod === 'yearly' && price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        월 ₩{formatPrice(Math.floor(price / 12))} 상당
                      </p>
                    )}
                  </div>

                  {/* 기능 목록 */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.name}
                          {feature.limit && feature.included && (
                            <span className="text-violet-600 font-medium ml-1">
                              ({feature.limit})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* 선택 버튼 */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : isSelected
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : plan.popular
                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                            : 'bg-white border-2 border-violet-600 text-violet-600 hover:bg-violet-50'
                    }`}
                  >
                    {isCurrentPlan ? '현재 플랜' : isSelected ? '선택됨' : '선택하기'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 구독 변경 버튼 */}
        {selectedPlan && selectedPlan !== currentSubscription?.planId && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
            <div className="container mx-auto max-w-6xl flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">선택한 플랜</p>
                <p className="text-lg font-bold text-gray-900">
                  {PLANS.find(p => p.id === selectedPlan)?.name} - ₩{formatPrice(getPrice(PLANS.find(p => p.id === selectedPlan)!))}
                  /{billingPeriod === 'monthly' ? '월' : '년'}
                </p>
              </div>
              <Button
                onClick={handleSubscribe}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8"
              >
                구독 변경하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* FAQ 섹션 */}
        <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">자주 묻는 질문</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">언제든지 플랜을 변경할 수 있나요?</h3>
              <p className="text-gray-600">네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 현재 결제 기간이 끝난 후 적용됩니다.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">구독을 취소하면 어떻게 되나요?</h3>
              <p className="text-gray-600">구독을 취소해도 이미 결제한 기간 동안은 서비스를 계속 이용할 수 있습니다. 기간이 끝나면 Free 플랜으로 자동 전환됩니다.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">환불 정책은 어떻게 되나요?</h3>
              <p className="text-gray-600">결제 후 7일 이내에 요청하시면 전액 환불해 드립니다. 7일 이후에는 남은 기간에 대한 일할 계산으로 환불됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
