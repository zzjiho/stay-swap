// House List Types (ListingsPage)
export interface House {
  houseId: number;
  title: string;
  cityKo: string;
  districtKo: string;
  mainImageUrl: string;
  avgRating: number;
  reviewCount: number;
  houseType: string;
  bedrooms: number;
  maxGuests: number;
}

export interface HouseListResponse {
  data: {
    content: House[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

export interface Country {
  code: string;
  name: string;
}

// House Detail Types (ListingDetailPage)
export interface HouseDetail {
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
  amenities: HouseAmenities;
  host?: HouseHost;
  hostId?: number;
  hostName?: string;
  hostProfileImage?: string;
}

export interface HouseAmenities {
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
}

export interface HouseHost {
  userId: number;
  name: string;
  profileImage: string;
  joinedYear: number;
  reviewCount: number;
  averageRating: number;
  isSuperhost: boolean;
}

export interface Review {
  reviewId: number;
  authorName: string;
  authorImage: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface MyHouse {
  houseId: number;
  title: string;
  mainImageUrl: string;
  cityKo: string;
  districtKo: string;
}

// House Form Types (NewListingPage)
export interface ListingFormData {
  title: string;
  houseType: string;
  size: number;
  bedroomCount: number;
  bedCount: number;
  bathroomCount: number;
  maxGuests: number;
  address: string;
  country: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  viewportNortheastLat: number | null;
  viewportNortheastLng: number | null;
  viewportSouthwestLat: number | null;
  viewportSouthwestLng: number | null;
  amenities: string[];
  features: string[];
  images: File[];
  imagePreviewUrls: string[];
  description: string;
  rules: string;
  termsAgreed: boolean;
}

// Fetch Parameters
export interface FetchHousesParams {
  page: number;
  size: number;
  keyword?: string;
  country?: string;
  houseType?: string;
  amenities?: string[];
  sort?: string;
}
