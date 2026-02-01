import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  fetchCountries,
  fetchHouses,
  HOUSE_TYPE_LABEL,
  LISTING_AMENITIES,
  LISTING_HOUSE_TYPES,
  SORT_OPTIONS,
} from '@/features/houses';

import Search from 'lucide-react/dist/esm/icons/search';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Star from 'lucide-react/dist/esm/icons/star';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import BedDouble from 'lucide-react/dist/esm/icons/bed-double';
import Users from 'lucide-react/dist/esm/icons/users';
import Home from 'lucide-react/dist/esm/icons/home';

const LoadingSpinner = (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
    <p className="mt-4 text-gray-500">숙소를 불러오는 중입니다...</p>
  </div>
);

const EmptyResult = (
  <div className="text-center py-16">
    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
      <Search className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
    <p className="text-gray-500">다른 검색어나 필터를 사용해보세요</p>
  </div>
);

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedHouseType, setSelectedHouseType] = useState(searchParams.get('houseType') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'latest');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 0);

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 10 * 60 * 1000,
  });

  const { data: housesData, isLoading } = useQuery({
    queryKey: ['houses', currentPage, searchKeyword, selectedCountry, selectedHouseType, selectedAmenities, sortOption],
    queryFn: () =>
      fetchHouses({
        page: currentPage,
        size: 12,
        keyword: searchKeyword || undefined,
        country: selectedCountry || undefined,
        houseType: selectedHouseType || undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        sort: sortOption,
      }),
    staleTime: 2 * 60 * 1000,
  });

  const houses = housesData?.data?.content || [];
  const totalElements = housesData?.data?.totalElements || 0;
  const totalPages = housesData?.data?.totalPages || 0;

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchKeyword) params.set('keyword', searchKeyword);
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedHouseType) params.set('houseType', selectedHouseType);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    if (sortOption !== 'latest') params.set('sort', sortOption);
    if (currentPage > 0) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [searchKeyword, selectedCountry, selectedHouseType, selectedAmenities, sortOption, currentPage, setSearchParams]);

  const handleSearch = () => {
    setCurrentPage(0);
  };

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">숙소 찾기</h1>

        {/* Search and Filter Box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Search Row */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="지역, 숙소명으로 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-11 h-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="px-8 bg-indigo-600 hover:bg-indigo-700 h-12"
            >
              검색
            </Button>
          </div>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">국가</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">모든 국가</option>
                {[...new Set(countries.filter((c) => c.countryKo).map((c) => c.countryKo))].map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">숙소 유형</label>
              <select
                value={selectedHouseType}
                onChange={(e) => {
                  setSelectedHouseType(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {LISTING_HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amenities Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">편의시설</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {LISTING_AMENITIES.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.id)}
                    onChange={() => handleAmenityToggle(amenity.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600">
            <span className="font-semibold text-indigo-600">{totalElements}</span>개의 숙소
          </div>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(0);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          LoadingSpinner
        ) : houses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {houses.map((house) => (
              <Link
                key={house.houseId}
                to={`/listings/${house.houseId}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img
                    src={house.mainImageUrl || '/images/default-house.jpg'}
                    alt={house.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-sm font-semibold flex items-center shadow">
                    <Star className="w-4 h-4 text-amber-500 mr-1 fill-amber-500" />
                    {house.avgRating?.toFixed(1) || '0.0'} ({house.reviewCount || 0})
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 line-clamp-1">
                    {house.title}
                  </h3>
                  <p className="text-gray-500 flex items-center text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {house.cityKo} {house.districtKo}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <BedDouble className="w-4 h-4 mr-1 fill-current" />
                      침실 {house.bedrooms || 1}개
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1 fill-current" />
                      최대 {house.maxGuests || 1}인
                    </span>
                    <span className="flex items-center">
                      <Home className="w-4 h-4 mr-1 fill-current" />
                      {HOUSE_TYPE_LABEL[house.houseType] || house.houseType}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          EmptyResult
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (currentPage < 3) {
                pageNum = i;
              } else if (currentPage > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
