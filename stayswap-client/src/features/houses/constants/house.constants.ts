import Home from 'lucide-react/dist/esm/icons/home';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Image from 'lucide-react/dist/esm/icons/image';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Castle from 'lucide-react/dist/esm/icons/castle';
import Building from 'lucide-react/dist/esm/icons/building';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';

// ListingsPage Constants
export const LISTING_AMENITIES = [
  { id: 'wifi', label: '와이파이' },
  { id: 'aircon', label: '에어컨' },
  { id: 'kitchen', label: '주방' },
  { id: 'washer', label: '세탁기' },
  { id: 'pet', label: '애완동물 가능' },
  { id: 'parking', label: '주차장' },
] as const;

export const LISTING_HOUSE_TYPES = [
  { value: '', label: '전체' },
  { value: '1', label: '아파트' },
  { value: '2', label: '주택' },
  { value: '3', label: '빌라' },
  { value: '4', label: '오피스텔' },
] as const;

export const HOUSE_TYPE_LABEL: Record<string, string> = {
  APT: '아파트',
  HOUSE: '주택',
  VILLA: '빌라',
  OP: '오피스텔',
  OTHER: '기타',
};

export const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'review_count', label: '리뷰순' },
  { value: 'rating', label: '평점순' },
] as const;

// ListingDetailPage Constants
export const AMENITY_MAP: Record<string, string> = {
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

// NewListingPage Constants
export const FORM_HOUSE_TYPES = [
  { value: 'APT', label: '아파트', icon: Building2 },
  { value: 'HOUSE', label: '주택', icon: Home },
  { value: 'VILLA', label: '빌라', icon: Castle },
  { value: 'OP', label: '오피스텔', icon: Building },
  { value: 'OTHER', label: '기타', icon: MoreHorizontal },
] as const;

export const FORM_AMENITIES = [
  { value: 'WIFI', label: '무선 인터넷' },
  { value: 'AIR_CONDITIONING', label: '에어컨' },
  { value: 'WASHER', label: '세탁기' },
  { value: 'KITCHEN', label: '주방' },
  { value: 'DRYER', label: '헤어드라이어' },
  { value: 'IRON', label: '다리미' },
  { value: 'REFRIGERATOR', label: '냉장고' },
  { value: 'MICROWAVE', label: '전자레인지' },
  { value: 'TV', label: 'TV' },
] as const;

export const FORM_FEATURES = [
  { value: 'FREE_PARKING', label: '무료 주차' },
  { value: 'PET_FRIENDLY', label: '반려동물 동반 가능' },
  { value: 'SMOKING', label: '흡연 가능' },
  { value: 'ELEVATOR', label: '엘리베이터' },
  { value: 'BALCONY', label: '발코니/테라스' },
] as const;

export const FORM_STEPS = [
  { id: 1, title: '기본 정보', icon: Home },
  { id: 2, title: '위치 및 특징', icon: MapPin },
  { id: 3, title: '사진 및 설명', icon: Image },
  { id: 4, title: '검토 및 등록', icon: CheckCircle },
] as const;

// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];
