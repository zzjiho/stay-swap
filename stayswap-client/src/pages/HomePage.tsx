import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

import Home from 'lucide-react/dist/esm/icons/home';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Shield from 'lucide-react/dist/esm/icons/shield';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Users from 'lucide-react/dist/esm/icons/users';
import Star from 'lucide-react/dist/esm/icons/star';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

// 인기 숙소 타입 정의
interface PopularHouse {
  houseId: number;
  title: string;
  city: string;
  district: string;
  thumbnailUrl: string;
  averageRating: number;
  reviewCount: number;
}

const LoadingMessage = (
  <div className="text-center py-12 text-gray-500">숙소를 불러오는 중...</div>
);
const EmptyMessage = (
  <div className="text-center py-12 text-gray-500">등록된 숙소가 없습니다.</div>
);

const fetchPopularHouses = async (): Promise<PopularHouse[]> => {
  const response = await fetch('/api/v1/house/popular');
  if (!response.ok) {
    throw new Error('인기 숙소 로딩 실패');
  }
  const data = await response.json();
  return data.data || [];
};

export function HomePage() {
  const { data: popularHouses = [], isLoading } = useQuery({
    queryKey: ['popularHouses'],
    queryFn: fetchPopularHouses,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  });

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[800px] flex items-center justify-center text-center text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero2.png')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-[800px] mx-auto text-center">
            <h1 className="text-[2.5rem] font-bold mb-6 leading-[1.2]">
              숙소를 교환하고 새로운 경험을 만들어보세요
            </h1>
            <p className="text-xl mb-8 opacity-90">
              StaySwap과 함께 전 세계 다양한 숙소를 교환하며 특별한 여행을 경험하세요
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-lg"
                asChild
              >
                <Link to={ROUTES.LISTINGS}>숙소 찾기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How To Use */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <h2 className="text-[2rem] font-bold text-center mb-12">이용 방법</h2>

          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-[1000px] mx-auto">
            <div className="flex-1 flex flex-col items-center text-center max-w-[300px]">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Home className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 w-full">1. 숙소 등록</h3>
              <p className="text-gray-500 leading-relaxed w-full">
                당신의 숙소를 등록하고 교환 가능한 날짜와 조건을 설정하세요.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center text-center max-w-[300px]">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <RefreshCw className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 w-full">2. 교환 요청</h3>
              <p className="text-gray-500 leading-relaxed w-full">
                마음에 드는 숙소를 찾아 교환 요청을 보내고 호스트와 조건을 협의하세요.
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center text-center max-w-[300px]">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4 w-full">3. 안전한 교환</h3>
              <p className="text-gray-500 leading-relaxed w-full">
                StaySwap의 안전 보장 시스템으로 안전하게 숙소를 교환하고 특별한 여행을 즐기세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Houses Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[2rem] font-bold">인기 숙소</h2>
            <Link
              to={ROUTES.LISTINGS}
              className="flex items-center text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              더 보기
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {isLoading
            ? LoadingMessage
            : popularHouses.length > 0
              ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {popularHouses.slice(0, 6).map((house) => (
                      <Link
                        key={house.houseId}
                        to={`/listings/${house.houseId}`}
                        className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="relative h-[200px] overflow-hidden">
                          <img
                            src={house.thumbnailUrl || '/images/default-house.jpg'}
                            alt={house.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-sm font-semibold flex items-center shadow">
                            <Star className="w-4 h-4 text-amber-500 mr-1 fill-amber-500" />
                            {house.averageRating?.toFixed(1) || '0.0'} ({house.reviewCount || 0})
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 text-gray-900">{house.title}</h3>
                          <p className="text-gray-500 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {house.city} {house.district}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              : EmptyMessage}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-[1200px]">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded text-sm font-medium mb-2">
              서비스 특징
            </div>
            <h2 className="text-[2rem] font-bold mb-3">왜 StaySwap인가요?</h2>
            <p className="text-lg text-gray-500">
              단순한 숙소 교환을 넘어 현지인의 경험과 시간까지 교환할 수 있는 특별한 서비스
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">LiveLocal 경험</h3>
              <p className="text-gray-500 leading-relaxed">
                호스트가 추천하는 현지 맛집, 명소, 액티비티를 경험해보세요.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">TimeBank 서비스</h3>
              <p className="text-gray-500 leading-relaxed">
                서로의 시간과 재능을 교환하여 더 풍부한 여행을 만들어보세요.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                <Star className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">구독제 혜택</h3>
              <p className="text-gray-500 leading-relaxed">
                다양한 구독 플랜으로 더 많은 교환 기회와 프리미엄 혜택을 누리세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
