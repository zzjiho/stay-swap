import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Autocomplete, GoogleMap, Marker, Rectangle, useJsApiLoader } from '@react-google-maps/api';
import {
  fetchHouseDetail,
  fetchHouseImages,
  updateListing,
  FORM_AMENITIES,
  FORM_FEATURES,
  FORM_HOUSE_TYPES,
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
} from '@/features/houses';
import type { UpdateListingData } from '@/features/houses';

import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import Upload from 'lucide-react/dist/esm/icons/upload';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Plus from 'lucide-react/dist/esm/icons/plus';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberStepper({ label, value, onChange, min = 0, max = 99 }: NumberStepperProps) {
  return (
    <div>
      <Label className="block mb-2">{label}</Label>
      <div className="flex items-center border border-gray-300 rounded-lg">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          className="p-3 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-lg"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          min={min}
          max={max}
          className="w-full text-center py-2 border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          className="p-3 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Options를 amenities/features 배열로 변환
const optionsToArrays = (options: Record<string, boolean | undefined>) => {
  const amenityMap: Record<string, string> = {
    hasFreeWifi: 'WIFI',
    hasAirConditioner: 'AIR_CONDITIONING',
    hasTV: 'TV',
    hasWashingMachine: 'WASHER',
    hasKitchen: 'KITCHEN',
    hasDryer: 'DRYER',
    hasIron: 'IRON',
    hasRefrigerator: 'REFRIGERATOR',
    hasMicrowave: 'MICROWAVE',
  };

  const featureMap: Record<string, string> = {
    hasFreeParking: 'FREE_PARKING',
    hasBalconyTerrace: 'BALCONY',
    hasPetsAllowed: 'PET_FRIENDLY',
    hasSmokingAllowed: 'SMOKING',
    hasElevator: 'ELEVATOR',
  };

  const amenities: string[] = [];
  const features: string[] = [];

  Object.entries(options).forEach(([key, value]) => {
    if (value) {
      if (amenityMap[key]) amenities.push(amenityMap[key]);
      if (featureMap[key]) features.push(featureMap[key]);
    }
  });

  return { amenities, features };
};

// amenities/features 배열을 options 객체로 변환
const buildOptionsFromAmenities = (amenities: string[], features: string[]) => {
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

  const featureMap: Record<string, string> = {
    FREE_PARKING: 'hasFreeParking',
    BALCONY: 'hasBalconyTerrace',
    PET_FRIENDLY: 'hasPetsAllowed',
    SMOKING: 'hasSmokingAllowed',
    ELEVATOR: 'hasElevator',
  };

  amenities.forEach((a) => {
    const key = amenityMap[a];
    if (key) options[key] = true;
  });

  features.forEach((f) => {
    const key = featureMap[f];
    if (key) options[key] = true;
  });

  return options;
};

interface FormData {
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
  description: string;
  rules: string;
}

interface ExistingImage {
  imageId: number;
  imageUrl: string;
}

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // 기존 이미지 (서버에서 불러온)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([]);

  // 새로 추가할 이미지
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'ko',
  });

  // 숙소 상세 정보 불러오기
  const { data: house, isLoading: houseLoading } = useQuery({
    queryKey: ['houseDetail', id],
    queryFn: () => fetchHouseDetail(id!),
    enabled: !!id,
  });

  // 이미지 불러오기
  const { data: images = [] } = useQuery({
    queryKey: ['houseImages', id],
    queryFn: () => fetchHouseImages(id!),
    enabled: !!id,
  });

  // 폼 데이터 초기화
  useEffect(() => {
    if (house) {
      const { amenities, features } = optionsToArrays(house.options || {});

      setFormData({
        title: house.title || '',
        houseType: house.houseType || '',
        size: house.size || 0,
        bedroomCount: house.bedrooms || 0,
        bedCount: house.bed || 0,
        bathroomCount: house.bathrooms || 0,
        maxGuests: house.maxGuests || 0,
        address: house.addressKo || '',
        country: house.countryKo || '',
        city: house.cityKo || '',
        district: house.districtKo || '',
        latitude: house.latitude || 37.5665,
        longitude: house.longitude || 126.978,
        viewportNortheastLat: house.viewportNortheastLat || null,
        viewportNortheastLng: house.viewportNortheastLng || null,
        viewportSouthwestLat: house.viewportSouthwestLat || null,
        viewportSouthwestLng: house.viewportSouthwestLng || null,
        amenities,
        features,
        description: house.description || '',
        rules: house.rule || '',
      });

      if (house.latitude && house.longitude) {
        setMapCenter({ lat: house.latitude, lng: house.longitude });
        setShowMap(true);
      }
    }
  }, [house]);

  // 기존 이미지 설정
  useEffect(() => {
    if (images.length > 0) {
      setExistingImages(images.map((img) => ({ imageId: img.imageId, imageUrl: img.imageUrl })));
    }
  }, [images]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!formData || !user || !id) throw new Error('데이터가 없습니다.');

      const updateData: UpdateListingData = {
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
        deleteImageIds: deleteImageIds.length > 0 ? deleteImageIds : undefined,
      };

      return updateListing(id, user.userId, updateData, newImages.length > 0 ? newImages : undefined);
    },
    onSuccess: () => {
      alert('숙소가 성공적으로 수정되었습니다!');
      navigate(ROUTES.LISTING_DETAIL(id!));
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateFormData = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const toggleArrayItem = useCallback((field: 'amenities' | 'features', value: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      const arr = prev[field];
      const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [field]: newArr };
    });
  }, []);

  const handleNewImageAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newUrls = newFiles.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...newFiles]);
    setNewImagePreviews((prev) => [...prev, ...newUrls]);
  }, []);

  const handleNewImageRemove = useCallback((index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }, [newImagePreviews]);

  const handleExistingImageRemove = useCallback((imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.imageId !== imageId));
    setDeleteImageIds((prev) => [...prev, imageId]);
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    let country = '';
    let city = '';
    let district = '';

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes('country')) country = component.long_name;
      if (types.includes('administrative_area_level_1')) {
        city = component.long_name
          .replace('특별시', '')
          .replace('광역시', '')
          .replace('특별자치시', '')
          .replace('특별자치도', '')
          .replace('시', '')
          .replace('도', '');
      }
      if (types.includes('sublocality_level_1') || types.includes('locality')) {
        if (!district) district = component.long_name;
      }
    });

    let viewportNE = null;
    let viewportSW = null;
    if (place.geometry.viewport) {
      viewportNE = place.geometry.viewport.getNorthEast();
      viewportSW = place.geometry.viewport.getSouthWest();
    }

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            address: place.formatted_address || '',
            latitude: lat,
            longitude: lng,
            country: country || prev.country,
            city: city || prev.city,
            district: district || prev.district,
            viewportNortheastLat: viewportNE ? viewportNE.lat() : null,
            viewportNortheastLng: viewportNE ? viewportNE.lng() : null,
            viewportSouthwestLat: viewportSW ? viewportSW.lat() : null,
            viewportSouthwestLng: viewportSW ? viewportSW.lng() : null,
          }
        : null
    );

    setMapCenter({ lat, lng });
    setShowMap(true);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = '숙소 이름을 입력해주세요.';
    if (!formData.houseType) newErrors.houseType = '숙소 유형을 선택해주세요.';
    if (formData.size <= 0) newErrors.size = '면적을 입력해주세요.';
    if (formData.maxGuests <= 0) newErrors.maxGuests = '최대 게스트 수를 입력해주세요.';
    if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요.';
    if (!formData.description.trim()) newErrors.description = '숙소 설명을 입력해주세요.';

    // 이미지가 하나도 없으면 에러
    if (existingImages.length === 0 && newImages.length === 0) {
      newErrors.images = '최소 1장의 이미지가 필요합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, existingImages.length, newImages.length]);

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      mutation.mutate();
    }
  }, [validateForm, mutation]);

  if (houseLoading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[900px]">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            뒤로
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">숙소 수정</h1>
            <p className="text-gray-500">숙소 정보를 수정하세요</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* 기본 정보 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">숙소 이름 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label>숙소 유형 *</Label>
                <div className="grid grid-cols-5 gap-3 mt-2">
                  {FORM_HOUSE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.houseType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData('houseType', type.value)}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.houseType && <p className="text-red-500 text-sm mt-1">{errors.houseType}</p>}
              </div>

              <div>
                <Label htmlFor="size">숙소 크기 *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    value={formData.size || ''}
                    onChange={(e) => updateFormData('size', Number(e.target.value))}
                    className={`flex-1 ${errors.size ? 'border-red-500' : ''}`}
                  />
                  <span className="text-gray-500 font-medium">평</span>
                </div>
                {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberStepper label="침실 수" value={formData.bedroomCount} onChange={(v) => updateFormData('bedroomCount', v)} min={0} max={10} />
                <NumberStepper label="침대 수" value={formData.bedCount} onChange={(v) => updateFormData('bedCount', v)} min={0} max={10} />
                <NumberStepper label="욕실 수" value={formData.bathroomCount} onChange={(v) => updateFormData('bathroomCount', v)} min={0} max={10} />
                <div>
                  <NumberStepper label="최대 수용 인원 *" value={formData.maxGuests} onChange={(v) => updateFormData('maxGuests', v)} min={1} max={20} />
                  {errors.maxGuests && <p className="text-red-500 text-sm mt-1">{errors.maxGuests}</p>}
                </div>
              </div>
            </div>
          </section>

          {/* 위치 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">위치</h2>

            {isMapLoaded ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">주소 *</Label>
                  <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={handlePlaceSelect}
                    options={{ types: ['address'], fields: ['formatted_address', 'geometry', 'address_components'] }}
                  >
                    <input
                      id="address"
                      type="text"
                      defaultValue={formData.address}
                      placeholder="주소 검색..."
                      className={`w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </Autocomplete>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div className="rounded-lg h-[250px] overflow-hidden border border-gray-300">
                  {showMap ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={mapCenter}
                      zoom={15}
                      options={{ mapTypeControl: false, streetViewControl: false }}
                    >
                      {formData.viewportNortheastLat && formData.viewportSouthwestLat && (
                        <Rectangle
                          bounds={{
                            north: formData.viewportNortheastLat,
                            south: formData.viewportSouthwestLat,
                            east: formData.viewportNortheastLng!,
                            west: formData.viewportSouthwestLng!,
                          }}
                          options={{ fillColor: '#4F46E5', fillOpacity: 0.1, strokeColor: '#4F46E5', strokeOpacity: 0.8, strokeWeight: 2 }}
                        />
                      )}
                      <Marker position={{ lat: formData.latitude, lng: formData.longitude }} />
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>주소를 검색하면 지도가 표시됩니다.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>국가</Label>
                    <Input value={formData.country} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>도시</Label>
                    <Input value={formData.city} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>지역구</Label>
                    <Input value={formData.district} readOnly className="bg-gray-50" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] bg-gray-100 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            )}
          </section>

          {/* 편의시설 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">편의시설 및 특징</h2>

            <div className="space-y-4">
              <div>
                <Label className="block mb-3">편의시설</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {FORM_AMENITIES.map((amenity) => (
                    <label key={amenity.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.value)}
                        onChange={() => toggleArrayItem('amenities', amenity.value)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block mb-3">특징</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {FORM_FEATURES.map((feature) => (
                    <label key={feature.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.value)}
                        onChange={() => toggleArrayItem('features', feature.value)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 이미지 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">사진</h2>

            {/* 기존 이미지 */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <Label className="block mb-2">기존 사진</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {existingImages.map((img, index) => (
                    <div key={img.imageId} className="relative group">
                      <img src={img.imageUrl} alt={`기존 이미지 ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => handleExistingImageRemove(img.imageId)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && existingImages.length > 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">대표</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 이미지 업로드 */}
            <div>
              <Label className="block mb-2">새 사진 추가</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  errors.images ? 'border-red-500' : 'border-gray-300 hover:border-indigo-500'
                }`}
                onClick={() => document.getElementById('imageInput')?.click()}
              >
                <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600 text-sm">클릭하여 이미지 업로드</p>
                <input id="imageInput" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleNewImageAdd(e.target.files)} />
              </div>
              {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}

              {newImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {newImagePreviews.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`새 이미지 ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => handleNewImageRemove(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 설명 */}
          <section>
            <h2 className="text-xl font-semibold mb-4">설명</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description">숙소 설명 *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={5}
                  className={`w-full px-3 py-2 border rounded-md resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="rules">이용 규칙</Label>
                <textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => updateFormData('rules', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>
          </section>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
