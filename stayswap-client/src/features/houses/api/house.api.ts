import type {
  HouseListResponse,
  HouseDetail,
  Review,
  MyHouse,
  Country,
  ListingFormData,
  FetchHousesParams,
} from '../types/house.types';

// Listings Page APIs
export const fetchHouses = async (params: FetchHousesParams): Promise<HouseListResponse> => {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('size', String(params.size));
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.country) searchParams.set('country', params.country);
  if (params.houseType) searchParams.set('houseType', params.houseType);
  if (params.amenities?.length) searchParams.set('amenities', params.amenities.join(','));
  if (params.sort) searchParams.set('sortBy', params.sort);

  const response = await fetch(`/api/house?${searchParams.toString()}`);
  if (!response.ok) throw new Error('숙소 목록 조회 실패');
  return response.json();
};

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch('/api/house/countries');
  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
};

// Listing Detail Page APIs
export const fetchHouseDetail = async (id: string): Promise<HouseDetail> => {
  const response = await fetch(`/api/house/${id}`);
  if (!response.ok) throw new Error('숙소 정보를 불러올 수 없습니다');
  const data = await response.json();
  return data.data;
};

export const fetchReviews = async (houseId: string): Promise<Review[]> => {
  const response = await fetch(`/api/review/house/${houseId}?size=5`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.data?.content || data.data || [];
};

export const fetchMyHouses = async (): Promise<MyHouse[]> => {
  const response = await fetch('/api/house/my', { credentials: 'include' });
  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
};

// New Listing Page APIs
export const createListing = async (formData: ListingFormData): Promise<{ houseId: number }> => {
  const data = new FormData();

  const houseData = {
    title: formData.title,
    houseType: formData.houseType,
    size: formData.size,
    bedroomCount: formData.bedroomCount,
    bedCount: formData.bedCount,
    bathroomCount: formData.bathroomCount,
    maxGuests: formData.maxGuests,
    address: formData.address,
    country: formData.country,
    city: formData.city,
    district: formData.district,
    latitude: formData.latitude,
    longitude: formData.longitude,
    amenities: formData.amenities,
    features: formData.features,
    description: formData.description,
    rules: formData.rules,
  };

  data.append('house', new Blob([JSON.stringify(houseData)], { type: 'application/json' }));

  formData.images.forEach((file) => {
    data.append('images', file);
  });

  const response = await fetch('/api/house', {
    method: 'POST',
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '숙소 등록에 실패했습니다.');
  }

  return response.json();
};

// Exchange Request API
export interface ExchangeRequestData {
  requesterHouseId: number;
  targetHouseId: number;
  checkinDate: string;
  checkoutDate: string;
  guestCount: number;
  message: string;
}

export const requestExchange = async (data: ExchangeRequestData): Promise<unknown> => {
  const response = await fetch('/api/exchange/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('교환 요청에 실패했습니다');
  return response.json();
};
