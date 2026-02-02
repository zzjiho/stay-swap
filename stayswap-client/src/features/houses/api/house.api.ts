import type {
  HouseListResponse,
  HouseDetail,
  Review,
  MyHouse,
  Country,
  ListingFormData,
  FetchHousesParams,
  HouseImage,
  HouseHost,
} from '../types/house.types';

// API 응답 타입 (백엔드 RestApiResponse 구조)
interface ApiResponse<T> {
  httpStatus: string;
  message: string;
  data: T;
}

// 공통 API 응답 파서 - 안전하게 data 추출
const parseApiResponse = async <T>(response: Response, fallback: T): Promise<T> => {
  try {
    const json = await response.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
};

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

  // API 응답: { data: { content: [...], totalElements, ... } }
  const json: ApiResponse<HouseListResponse['data']> = await response.json();
  return { data: json.data };
};

export const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch('/api/house/countries');
  if (!response.ok) return [];
  return parseApiResponse<Country[]>(response, []);
};

// Listing Detail Page APIs
export const fetchHouseDetail = async (id: string): Promise<HouseDetail> => {
  const response = await fetch(`/api/house/${id}`);
  if (!response.ok) throw new Error('숙소 정보를 불러올 수 없습니다');

  const json: ApiResponse<HouseDetail> = await response.json();
  if (!json.data) throw new Error('숙소 정보를 불러올 수 없습니다');
  return json.data;
};

export const fetchReviews = async (houseId: string): Promise<Review[]> => {
  const response = await fetch(`/api/review/house/${houseId}?size=5`);
  if (!response.ok) return [];

  try {
    const json = await response.json();
    // Page 구조: { data: { content: [...] } } 또는 배열 직접: { data: [...] }
    const data = json.data;
    if (Array.isArray(data)) return data;
    if (data?.content && Array.isArray(data.content)) return data.content;
    return [];
  } catch {
    return [];
  }
};

export const fetchHouseImages = async (houseId: string): Promise<HouseImage[]> => {
  const response = await fetch(`/api/house/${houseId}/images`);
  if (!response.ok) return [];
  return parseApiResponse<HouseImage[]>(response, []);
};

// 호스트 상세 정보 API 응답 타입 (백엔드 HostDetailResponse와 매핑)
interface HostDetailApiResponse {
  hostId: number;
  hostName: string;
  profile: string;
  joinedAt: number;
  reviewCount: number;
  avgRating: number;
}

export const fetchHostDetail = async (houseId: string): Promise<HouseHost | null> => {
  const response = await fetch(`/api/house/${houseId}/host`);
  if (!response.ok) return null;

  try {
    const json: ApiResponse<HostDetailApiResponse> = await response.json();
    if (!json.data) return null;

    // 백엔드 응답을 프론트엔드 타입으로 변환
    return {
      userId: json.data.hostId,
      name: json.data.hostName,
      profileImage: json.data.profile,
      joinedYear: json.data.joinedAt,
      reviewCount: json.data.reviewCount,
      averageRating: json.data.avgRating,
      isSuperhost: false, // 백엔드에서 아직 미제공
    };
  } catch {
    return null;
  }
};

// 백엔드 MyHouseResponse 타입
interface MyHouseApiResponse {
  id: number;
  title: string;
  thumbnailUrl: string;
  cityKo: string;
  districtKo: string;
  averageRating: number;
  reviewCount: number;
  active: boolean;
  houseType: string;
}

export const fetchMyHouses = async (): Promise<MyHouse[]> => {
  const response = await fetch('/api/house/my', { credentials: 'include' });
  if (!response.ok) return [];

  try {
    const json = await response.json();
    // Slice 구조: { data: { content: [...], hasNext: ... } }
    const data = json.data;
    let items: MyHouseApiResponse[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data?.content && Array.isArray(data.content)) {
      items = data.content;
    }

    // 백엔드 응답을 프론트엔드 타입으로 변환
    return items.map((item) => ({
      houseId: item.id,
      title: item.title,
      mainImageUrl: item.thumbnailUrl,
      cityKo: item.cityKo,
      districtKo: item.districtKo,
    }));
  } catch {
    return [];
  }
};

// amenities 배열을 options 객체로 변환 (모든 필드에 기본값 false 설정)
const buildOptionsFromAmenities = (amenities: string[], features: string[]) => {
  // 모든 옵션 필드를 false로 초기화 (백엔드 NPE 방지)
  const options: Record<string, boolean> = {
    hasFreeWifi: false,
    hasAirConditioner: false,
    hasTV: false,
    hasWashingMachine: false,
    hasKitchen: false,
    hasDryer: false,
    hasIron: false,
    hasRefrigerator: false,
    hasMicrowave: false,
    hasFreeParking: false,
    hasBalconyTerrace: false,
    hasPetsAllowed: false,
    hasSmokingAllowed: false,
    hasElevator: false,
  };

  // FORM_AMENITIES의 value와 매핑
  const amenityMap: Record<string, string> = {
    WIFI: 'hasFreeWifi',
    AIR_CONDITIONING: 'hasAirConditioner',
    TV: 'hasTV',
    WASHER: 'hasWashingMachine',
    KITCHEN: 'hasKitchen',
    DRYER: 'hasDryer',
    IRON: 'hasIron',
    REFRIGERATOR: 'hasRefrigerator',
    MICROWAVE: 'hasMicrowave',
  };

  // FORM_FEATURES의 value와 매핑
  const featureMap: Record<string, string> = {
    FREE_PARKING: 'hasFreeParking',
    BALCONY: 'hasBalconyTerrace',
    PET_FRIENDLY: 'hasPetsAllowed',
    SMOKING: 'hasSmokingAllowed',
    ELEVATOR: 'hasElevator',
  };

  amenities.forEach((amenity) => {
    const key = amenityMap[amenity];
    if (key) options[key] = true;
  });

  features.forEach((feature) => {
    const key = featureMap[feature];
    if (key) options[key] = true;
  });

  return options;
};

// New Listing Page APIs
export const createListing = async (formData: ListingFormData): Promise<{ houseId: number }> => {
  const data = new FormData();

  // 백엔드 CreateHouseRequest에 맞게 필드명 매핑
  const houseData = {
    title: formData.title,
    houseType: formData.houseType,
    size: formData.size,
    bedrooms: formData.bedroomCount,
    bed: formData.bedCount,
    bathrooms: formData.bathroomCount,
    maxGuests: formData.maxGuests,
    addressKo: formData.address,
    countryKo: formData.country,
    cityKo: formData.city,
    districtKo: formData.district,
    latitude: formData.latitude,
    longitude: formData.longitude,
    viewportNortheastLat: formData.viewportNortheastLat,
    viewportNortheastLng: formData.viewportNortheastLng,
    viewportSouthwestLat: formData.viewportSouthwestLat,
    viewportSouthwestLng: formData.viewportSouthwestLng,
    description: formData.description,
    rule: formData.rules,
    options: buildOptionsFromAmenities(formData.amenities, formData.features),
  };

  data.append('request', new Blob([JSON.stringify(houseData)], { type: 'application/json' }));

  formData.images.forEach((file) => {
    data.append('images', file);
  });

  const response = await fetch('/api/house', {
    method: 'POST',
    credentials: 'include',
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '숙소 등록에 실패했습니다.');
  }

  // API 응답: { data: { houseId: number } }
  const json: ApiResponse<{ houseId: number }> = await response.json();
  return json.data;
};

// Update Listing API
export interface UpdateListingData {
  title: string;
  houseType: string;
  size: number;
  bedrooms: number;
  bed: number;
  bathrooms: number;
  maxGuests: number;
  addressKo: string;
  countryKo: string;
  cityKo: string;
  districtKo: string;
  latitude: number;
  longitude: number;
  viewportNortheastLat: number | null;
  viewportNortheastLng: number | null;
  viewportSouthwestLat: number | null;
  viewportSouthwestLng: number | null;
  description: string;
  rule: string;
  options: Record<string, boolean>;
  deleteImageIds?: number[];
}

export const updateListing = async (
  houseId: string,
  userId: number,
  formData: UpdateListingData,
  images?: File[]
): Promise<{ houseId: number }> => {
  const data = new FormData();

  data.append('request', new Blob([JSON.stringify(formData)], { type: 'application/json' }));

  if (images && images.length > 0) {
    images.forEach((file) => {
      data.append('images', file);
    });
  }

  const response = await fetch(`/api/house/${houseId}?userId=${userId}`, {
    method: 'POST',
    credentials: 'include',
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '숙소 수정에 실패했습니다.');
  }

  const json: ApiResponse<{ houseId: number }> = await response.json();
  return json.data;
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

export const requestExchange = async (data: ExchangeRequestData): Promise<{ swapId: number }> => {
  // 백엔드 SwapRequest 형식으로 변환
  const swapRequest = {
    requesterHouseId: data.requesterHouseId,
    targetHouseId: data.targetHouseId,
    startDate: data.checkinDate,  // checkinDate → startDate
    endDate: data.checkoutDate,   // checkoutDate → endDate
    guest: data.guestCount,       // guestCount → guest
    message: data.message,
  };

  const response = await fetch('/api/house/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(swapRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errorMessage || '교환 요청에 실패했습니다');
  }

  const json: ApiResponse<{ swapId: number }> = await response.json();
  return json.data;
};

// Stay Request API
export interface StayRequestData {
  targetHouseId: number;
  checkinDate: string;
  checkoutDate: string;
  guestCount: number;
  message?: string;
}

export const requestStay = async (data: StayRequestData): Promise<{ swapId: number }> => {
  // 백엔드 StayRequest 형식으로 변환
  const stayRequest = {
    targetHouseId: data.targetHouseId,
    startDate: data.checkinDate,   // checkinDate → startDate
    endDate: data.checkoutDate,    // checkoutDate → endDate
    guest: data.guestCount,        // guestCount → guest
    message: data.message || '',
  };

  const response = await fetch('/api/house/stay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(stayRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errorMessage || '숙박 요청에 실패했습니다');
  }

  const json: ApiResponse<{ swapId: number }> = await response.json();
  return json.data;
};
