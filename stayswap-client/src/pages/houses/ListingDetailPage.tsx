// Force rebuild
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ROUTES } from '@/constants/routes';
import { useJsApiLoader } from '@react-google-maps/api';

import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Star from 'lucide-react/dist/esm/icons/star';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Heart from 'lucide-react/dist/esm/icons/heart';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Check from 'lucide-react/dist/esm/icons/check';
import Award from 'lucide-react/dist/esm/icons/award';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import X from 'lucide-react/dist/esm/icons/x';

// Google Maps API 설정
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

interface HouseDetail {
  houseId: number;
  title: string;
  description: string;
  cityKo: string;
  districtKo: string;
  detailAddress: string;
  latitude: number;
  longitude: number;
  viewportNortheastLat?: number;
  viewportNortheastLng?: number;
  viewportSouthwestLat?: number;
  viewportSouthwestLng?: number;
  mainImageUrl: string;
  imageUrls: string[];
  avgRating: number;
  reviewCount: number;
  houseType: string;
  amenities: {
    hasFreeWifi?: boolean;
    hasAirConditioner?: boolean;
    hasTV?: boolean;
    hasWashingMachine?: boolean;
    hasKitchen?: boolean;
    hasDryer?: boolean;
    hasIron?: boolean;
    hasRefrigerator?: boolean;
    hasMicrowave?: boolean;
    hasFreeParking?: boolean;
    hasBalconyTerrace?: boolean;
    hasPetsAllowed?: boolean;
    hasSmokingAllowed?: boolean;
    hasElevator?: boolean;
    otherAmenities?: string;
    otherFeatures?: string;
  };
  host?: {
    userId: number;
    name: string;
    profileImage: string;
    joinedYear: number;
    reviewCount: number;
    averageRating: number;
    isSuperhost: boolean;
  };
  // 호스트 정보가 별도 필드로 올 수도 있음
  hostId?: number;
  hostName?: string;
  hostProfileImage?: string;
}

interface Review {
  reviewId: number;
  authorName: string;
  authorImage: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface MyHouse {
  houseId: number;
  title: string;
  mainImageUrl: string;
  cityKo: string;
  districtKo: string;
}

const fetchHouseDetail = async (id: string): Promise<HouseDetail> => {
  const response = await fetch(`/api/house/${id}`);
  if (!response.ok) throw new Error('숙소 정보를 불러올 수 없습니다');
  const data = await response.json();
  return data.data;
};

const fetchReviews = async (houseId: string): Promise<Review[]> => {
  // 리뷰 API 엔드포인트 - 404일 경우 빈 배열 반환
  const response = await fetch(`/api/review/house/${houseId}?size=5`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.data?.content || data.data || [];
};

const fetchMyHouses = async (): Promise<MyHouse[]> => {
  const response = await fetch('/api/house/my', { credentials: 'include' });
  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
};

const AMENITY_MAP: Record<string, string> = {
  hasFreeWifi: '무선 인터넷',
  hasAirConditioner: '에어컨',
  hasTV: 'TV',
  hasWashingMachine: '세탁기',
  hasKitchen: '주방',
  hasDryer: '건조기',
  hasIron: '다리미',
  hasRefrigerator: '냉장고',
  hasMicrowave: '전자레인지',
  hasFreeParking: '무료 주차',
  hasBalconyTerrace: '발코니/테라스',
  hasPetsAllowed: '반려동물 동반 가능',
  hasSmokingAllowed: '흡연 가능',
  hasElevator: '엘리베이터',
};

const LoadingState = (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
      <p className="mt-4 text-gray-500">숙소 정보를 불러오는 중...</p>
    </div>
  </div>
);

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showStayModal, setShowStayModal] = useState(false);
  const [selectedMyHouse, setSelectedMyHouse] = useState<number | null>(null);
  const [exchangeMessage, setExchangeMessage] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Google Maps 로드 (한 번만 로드되도록 useJsApiLoader 사용)
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'ko',
  });

  const { data: house, isLoading, error } = useQuery({
    queryKey: ['house', id],
    queryFn: () => fetchHouseDetail(id!),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchReviews(id!),
    enabled: !!id,
  });

  const { data: myHouses = [] } = useQuery({
    queryKey: ['myHouses'],
    queryFn: fetchMyHouses,
    enabled: isAuthenticated && showExchangeModal,
  });

  const exchangeMutation = useMutation({
    mutationFn: async (data: {
      requesterHouseId: number;
      targetHouseId: number;
      checkinDate: string;
      checkoutDate: string;
      guestCount: number;
      message: string;
    }) => {
      const response = await fetch('/api/exchange/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('교환 요청에 실패했습니다');
      return response.json();
    },
    onSuccess: () => {
      setShowExchangeModal(false);
      alert('교환 요청이 전송되었습니다.');
      navigate(ROUTES.EXCHANGES);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  // house 데이터와 Google Maps API가 준비되면 지도와 Rectangle 생성
  useEffect(() => {
    if (!isMapLoaded || !house || !mapContainerRef.current) return;
    if (!house.latitude || !house.longitude) return;

    // 지도 생성
    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: house.latitude, lng: house.longitude },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Rectangle bounds 설정
    const bounds = {
      north: house.viewportNortheastLat || house.latitude + 0.002,
      south: house.viewportSouthwestLat || house.latitude - 0.002,
      east: house.viewportNortheastLng || house.longitude + 0.003,
      west: house.viewportSouthwestLng || house.longitude - 0.003,
    };

    // 빨간색 Rectangle 생성
    const rectangle = new google.maps.Rectangle({
      bounds: bounds,
      fillColor: '#FF4444',
      fillOpacity: 0.25,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      map: map,
    });

    return () => {
      rectangle.setMap(null);
    };
  }, [isMapLoaded, house]);

  const images = house?.imageUrls?.length ? house.imageUrls : [house?.mainImageUrl || '/images/default-house.jpg'];

  // 호스트 정보 (host 객체 또는 별도 필드에서)
  const hostName = house?.host?.name || house?.hostName || '호스트';
  const hostId = house?.host?.userId || house?.hostId;
  const hostProfileImage = house?.host?.profileImage || house?.hostProfileImage || '/images/profile.png';

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleExchangeRequest = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate(ROUTES.AUTH);
      return;
    }
    if (!checkinDate || !checkoutDate) {
      alert('체크인/체크아웃 날짜를 선택해주세요.');
      return;
    }
    setShowExchangeModal(true);
  };

  const handleStayRequest = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate(ROUTES.AUTH);
      return;
    }
    if (!checkinDate || !checkoutDate) {
      alert('체크인/체크아웃 날짜를 선택해주세요.');
      return;
    }
    setShowStayModal(true);
  };

  const handleExchangeConfirm = () => {
    if (!selectedMyHouse) {
      alert('교환할 숙소를 선택해주세요.');
      return;
    }
    exchangeMutation.mutate({
      requesterHouseId: selectedMyHouse,
      targetHouseId: house!.houseId,
      checkinDate,
      checkoutDate,
      guestCount,
      message: exchangeMessage,
    });
  };

  const handleMessageHost = () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      navigate(ROUTES.AUTH);
      return;
    }
    navigate(`${ROUTES.MESSAGES}?hostId=${hostId}`);
  };

  useEffect(() => {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const checkinInput = document.getElementById('checkin-date') as HTMLInputElement;
    const checkoutInput = document.getElementById('checkout-date') as HTMLInputElement;
    if (checkinInput) checkinInput.min = minDate;
    if (checkoutInput) checkoutInput.min = minDate;
  }, []);

  if (isLoading) return LoadingState;

  if (error || !house) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">숙소를 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-4">요청하신 숙소 정보가 존재하지 않습니다.</p>
          <Button onClick={() => navigate(ROUTES.LISTINGS)}>목록으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-[1200px]">
        {/* Back Link */}
        <Link
          to={ROUTES.LISTINGS}
          className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Link>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{house.title}</h1>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
              <span className="font-semibold">{house.avgRating?.toFixed(1) || '0.0'}</span>
              <span className="text-gray-500 ml-1">({house.reviewCount || 0})</span>
            </div>
            <span className="text-gray-300">·</span>
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              {house.cityKo} {house.districtKo}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Share2 className="w-4 h-4 mr-2" />
              공유
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Heart className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        </div>

        {/* Gallery */}
        <div className="relative rounded-xl overflow-hidden mb-10 bg-gray-100">
          <div className="aspect-[16/9] md:aspect-[21/9]">
            <img
              src={images[currentImageIndex]}
              alt={`${house.title} - 이미지 ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* Host Section */}
            <div className="pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">
                {hostName}님이 호스팅하는 숙소
              </h2>
              <div className="flex items-center gap-4">
                <img
                  src={hostProfileImage}
                  alt={hostName}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{hostName}</h3>
                  {house.host && (
                    <>
                      <div className="text-sm text-gray-500 space-x-2">
                        {house.host.joinedYear && <span>{house.host.joinedYear}년에 가입</span>}
                        {house.host.reviewCount !== undefined && (
                          <>
                            <span>·</span>
                            <span>후기 {house.host.reviewCount}개</span>
                          </>
                        )}
                        {house.host.averageRating !== undefined && (
                          <>
                            <span>·</span>
                            <span>총 평점: {house.host.averageRating?.toFixed(1) || '0.0'}</span>
                          </>
                        )}
                      </div>
                      {house.host.isSuperhost && (
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                          <Award className="w-3 h-3" />
                          슈퍼호스트
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">숙소 정보</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{house.description}</p>
            </div>

            {/* Amenities */}
            <div className="pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">편의시설</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {house.amenities && Object.entries(house.amenities)
                  .filter(([key, value]) => value === true && AMENITY_MAP[key])
                  .map(([key]) => (
                    <div key={key} className="flex items-center gap-3 text-gray-600">
                      <Check className="w-5 h-5 text-indigo-600" />
                      <span>{AMENITY_MAP[key]}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Location Map */}
            <div className="pb-8 border-b">
              <h2 className="text-xl font-semibold mb-4">위치</h2>
              <p className="text-gray-600 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {house.cityKo} {house.districtKo}
              </p>
              {house.latitude && house.longitude && GOOGLE_MAPS_API_KEY && isMapLoaded ? (
                <div className="rounded-xl overflow-hidden h-[300px] border border-gray-200">
                  <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
                </div>
              ) : (
                <div className="rounded-xl bg-gray-100 h-[300px] flex items-center justify-center border border-gray-200">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>지도를 표시할 수 없습니다.</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-3">
                정확한 주소는 예약 확정 후 제공됩니다.
              </p>
            </div>

            {/* Reviews */}
            <div className="pb-8 border-b">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                {house.avgRating?.toFixed(1) || '0.0'} · 후기 {house.reviewCount || 0}개
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.reviewId} className="flex gap-4">
                      <img
                        src={review.authorImage || '/images/profile.png'}
                        alt={review.authorName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{review.authorName}</span>
                          <div className="flex items-center gap-1 text-amber-500 text-sm">
                            <Star className="w-4 h-4 fill-current" />
                            {review.rating.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-gray-600">{review.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">아직 후기가 없습니다.</p>
              )}

              {house.reviewCount > 5 && (
                <Button variant="outline" className="mt-6">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  모든 후기 보기
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg border p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">체크인</label>
                  <input
                    type="date"
                    id="checkin-date"
                    value={checkinDate}
                    onChange={(e) => setCheckinDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">체크아웃</label>
                  <input
                    type="date"
                    id="checkout-date"
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">게스트</label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}명
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleExchangeRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                >
                  교환 요청
                </Button>
                <Button
                  onClick={handleStayRequest}
                  variant="outline"
                  className="w-full h-12 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  숙박 요청
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleMessageHost}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-indigo-600"
                >
                  💬 호스트에게 메시지 보내기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">교환 요청</h3>
              <button onClick={() => setShowExchangeModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600">교환할 내 숙소를 선택해주세요.</p>

              {myHouses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {myHouses.map((myHouse) => (
                    <label
                      key={myHouse.houseId}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMyHouse === myHouse.houseId
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="myHouse"
                        value={myHouse.houseId}
                        checked={selectedMyHouse === myHouse.houseId}
                        onChange={() => setSelectedMyHouse(myHouse.houseId)}
                        className="hidden"
                      />
                      <img
                        src={myHouse.mainImageUrl || '/images/default-house.jpg'}
                        alt={myHouse.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{myHouse.title}</h4>
                        <p className="text-sm text-gray-500">{myHouse.cityKo} {myHouse.districtKo}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 mb-4">
                  <p>등록된 숙소가 없습니다.</p>
                  <Link to={ROUTES.NEW_LISTING} className="text-indigo-600 hover:underline mt-2 inline-block">
                    숙소 등록하기
                  </Link>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><strong>체크인:</strong> {checkinDate}</p>
                <p><strong>체크아웃:</strong> {checkoutDate}</p>
                <p><strong>게스트:</strong> {guestCount}명</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  호스트에게 메시지 (선택사항)
                </label>
                <textarea
                  value={exchangeMessage}
                  onChange={(e) => setExchangeMessage(e.target.value)}
                  rows={3}
                  placeholder="호스트에게 전달할 메시지를 입력하세요."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <Button variant="outline" onClick={() => setShowExchangeModal(false)} className="flex-1">
                취소
              </Button>
              <Button
                onClick={handleExchangeConfirm}
                disabled={!selectedMyHouse || exchangeMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {exchangeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '교환 요청 보내기'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stay Request Modal */}
      {showStayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">숙박 요청 확인</h3>
              <button onClick={() => setShowStayModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="mb-4 text-gray-600">다음 정보로 숙박을 요청하시겠습니까?</p>
              <div className="space-y-2 text-sm text-gray-600 mb-4 bg-gray-50 p-4 rounded-lg">
                <p><strong>숙소:</strong> {house.title}</p>
                <p><strong>체크인:</strong> {checkinDate}</p>
                <p><strong>체크아웃:</strong> {checkoutDate}</p>
                <p><strong>게스트:</strong> {guestCount}명</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <Button variant="outline" onClick={() => setShowStayModal(false)} className="flex-1">
                취소
              </Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                숙박 요청 보내기
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
