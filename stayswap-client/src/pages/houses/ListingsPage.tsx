import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function ListingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">숙소 찾기</h1>

      {/* Search and Filter Box */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {/* Search Row */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="지역, 숙소명으로 검색"
              className="pl-10 h-12 text-base border-gray-300 focus:border-indigo-600 focus:ring-indigo-600"
            />
          </div>
          <Button size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700">
            검색
          </Button>
        </div>

        {/* Filter Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              국가
            </label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
              <option value="">모든 국가</option>
              <option value="KR">대한민국</option>
              <option value="US">미국</option>
              <option value="JP">일본</option>
              <option value="FR">프랑스</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              숙소 유형
            </label>
            <select className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent">
              <option value="">전체</option>
              <option value="1">아파트</option>
              <option value="2">주택</option>
              <option value="3">빌라</option>
              <option value="4">오피스텔</option>
            </select>
          </div>
        </div>

        {/* Amenities Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">편의시설</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['와이파이', '에어컨', '주방', '세탁기', '주차', '수영장', '헬스장', '엘리베이터'].map((amenity) => (
              <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-600"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid - Placeholder */}
      <EmptyState
        icon="home"
        title="전 세계 다양한 숙소를 탐색해보세요"
        description="검색 및 필터 기능으로 원하는 숙소를 찾아보세요"
      />
    </div>
  );
}
