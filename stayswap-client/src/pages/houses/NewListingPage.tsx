import {useCallback, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {ROUTES} from '@/constants/routes';
import {Autocomplete, GoogleMap, Marker, Rectangle, useJsApiLoader} from '@react-google-maps/api';
import type {ListingFormData} from '@/features/houses';
import {
  createListing,
  FORM_AMENITIES,
  FORM_FEATURES,
  FORM_HOUSE_TYPES,
  FORM_STEPS,
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
} from '@/features/houses';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
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
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    } else if (e.target.value === '') {
      onChange(min);
    }
  };

  return (
    <div>
      <Label className="block mb-2">{label}</Label>
      <div className="flex items-center border border-gray-300 rounded-lg">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="p-3 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-lg"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="w-full text-center py-2 border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="p-3 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const initialFormData: ListingFormData = {
  title: '',
  houseType: '',
  size: 0,
  bedroomCount: 0,
  bedCount: 0,
  bathroomCount: 0,
  maxGuests: 0,
  address: '',
  country: '',
  city: '',
  district: '',
  latitude: 37.5665,
  longitude: 126.978,
  viewportNortheastLat: null,
  viewportNortheastLng: null,
  viewportSouthwestLat: null,
  viewportSouthwestLng: null,
  amenities: [],
  features: [],
  images: [],
  imagePreviewUrls: [],
  description: '',
  rules: '',
  termsAgreed: false,
};

export function NewListingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'ko',
  });

  const mutation = useMutation({
    mutationFn: createListing,
    onSuccess: (data) => {
      alert('숙소가 성공적으로 등록되었습니다!');
      navigate(ROUTES.LISTING_DETAIL(String(data.houseId)));
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateFormData = useCallback(<K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const toggleArrayItem = useCallback((field: 'amenities' | 'features', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [field]: newArr };
    });
  }, []);

  const handleImageAdd = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const newUrls = newFiles.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles],
      imagePreviewUrls: [...prev.imagePreviewUrls, ...newUrls],
    }));
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setFormData(prev => {
      URL.revokeObjectURL(prev.imagePreviewUrls[index]);
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
        imagePreviewUrls: prev.imagePreviewUrls.filter((_, i) => i !== index),
      };
    });
  }, []);

  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      console.log('주소를 자동완성 목록에서 선택해주세요.');
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    let country = '';
    let city = '';
    let district = '';

    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        if (types.includes('country')) {
          country = component.long_name;
        }
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
    }

    let viewportNE = null;
    let viewportSW = null;
    if (place.geometry.viewport) {
      viewportNE = place.geometry.viewport.getNorthEast();
      viewportSW = place.geometry.viewport.getSouthWest();
    }

    setFormData(prev => ({
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
    }));

    setMapCenter({ lat, lng });
    setShowMap(true);

    setErrors(prev => {
      const next = { ...prev };
      delete next.address;
      return next;
    });
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = '숙소 이름을 입력해주세요.';
        if (!formData.houseType) newErrors.houseType = '숙소 유형을 선택해주세요.';
        if (formData.size <= 0) newErrors.size = '면적을 입력해주세요.';
        if (formData.maxGuests <= 0) newErrors.maxGuests = '최대 게스트 수를 입력해주세요.';
        break;
      case 2:
        if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요.';
        if (!formData.city.trim()) newErrors.city = '도시를 입력해주세요.';
        if (!formData.district.trim()) newErrors.district = '구/군을 입력해주세요.';
        break;
      case 3:
        if (formData.images.length === 0) newErrors.images = '최소 1장의 이미지를 업로드해주세요.';
        if (!formData.description.trim()) newErrors.description = '숙소 설명을 입력해주세요.';
        break;
      case 4:
        if (!formData.termsAgreed) newErrors.termsAgreed = '약관에 동의해주세요.';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [currentStep, validateStep]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (validateStep(4)) {
      mutation.mutate(formData);
    }
  }, [formData, mutation, validateStep]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[900px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">숙소 등록</h1>
          <p className="text-gray-500">숙소를 등록하고 교환을 시작하세요</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {FORM_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium hidden sm:inline">{step.title}</span>
                    <span className="font-medium sm:hidden">{step.id}</span>
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">기본 정보</h2>
                <p className="text-gray-500 mt-1">숙소의 기본 정보를 입력해주세요.</p>
              </div>

              <div>
                <Label htmlFor="title">숙소 이름 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="예: 서울 강남 모던 아파트"
                  className={errors.title ? 'border-red-500' : ''}
                />
                <p className="text-gray-500 text-sm mt-1">게스트들이 쉽게 기억할 수 있는 이름을 입력해주세요.</p>
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label>숙소 유형 *</Label>
                <div className="grid grid-cols-5 gap-3 mt-2">
                  {FORM_HOUSE_TYPES.map(type => {
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
                <NumberStepper
                  label="침실 수"
                  value={formData.bedroomCount}
                  onChange={(v) => updateFormData('bedroomCount', v)}
                  min={0}
                  max={10}
                />
                <NumberStepper
                  label="침대 수"
                  value={formData.bedCount}
                  onChange={(v) => updateFormData('bedCount', v)}
                  min={0}
                  max={10}
                />
                <NumberStepper
                  label="욕실 수"
                  value={formData.bathroomCount}
                  onChange={(v) => updateFormData('bathroomCount', v)}
                  min={0}
                  max={10}
                />
                <div>
                  <NumberStepper
                    label="최대 수용 인원 *"
                    value={formData.maxGuests}
                    onChange={(v) => updateFormData('maxGuests', v)}
                    min={1}
                    max={20}
                  />
                  {errors.maxGuests && <p className="text-red-500 text-sm mt-1">{errors.maxGuests}</p>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">위치 및 특징</h2>
                <p className="text-gray-500 mt-1">숙소의 위치와 특징을 입력해주세요.</p>
              </div>

              {isMapLoaded ? (
                <>
                  <div>
                    <Label htmlFor="address">주소 *</Label>
                    <Autocomplete
                      onLoad={onAutocompleteLoad}
                      onPlaceChanged={handlePlaceSelect}
                      options={{
                        types: ['address'],
                        fields: ['formatted_address', 'geometry', 'address_components'],
                      }}
                    >
                      <input
                        id="address"
                        type="text"
                        placeholder="예: 화양동 17, 강남역 2번출구 ('동' 단위로 구체적으로 검색해주세요)"
                        className={`w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </Autocomplete>
                    <p className="text-gray-500 text-sm mt-1">
                      <strong>주소 검색 팁:</strong> '동' 단위나 구체적인 주소로 검색하면 더 정확하고 빠릅니다!
                    </p>
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-700">
                      <strong>개인정보 보호</strong><br />
                      정확한 주소는 게스트에게 체크인 당일 알림으로 보내드려요<br />
                      신중하게 입력해주세요! 등록 후에는 위치를 변경할 수 없답니다
                    </p>
                  </div>

                  <div className="rounded-lg h-[300px] overflow-hidden border border-gray-300">
                    {showMap ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={15}
                        options={{
                          mapTypeControl: false,
                          streetViewControl: false,
                        }}
                      >
                        {formData.viewportNortheastLat && formData.viewportSouthwestLat && (
                          <Rectangle
                            bounds={{
                              north: formData.viewportNortheastLat,
                              south: formData.viewportSouthwestLat,
                              east: formData.viewportNortheastLng!,
                              west: formData.viewportSouthwestLng!,
                            }}
                            options={{
                              fillColor: '#4F46E5',
                              fillOpacity: 0.1,
                              strokeColor: '#4F46E5',
                              strokeOpacity: 0.8,
                              strokeWeight: 2,
                            }}
                          />
                        )}
                        <Marker
                          position={{ lat: formData.latitude, lng: formData.longitude }}
                          animation={google.maps.Animation.DROP}
                        />
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>주소를 선택하면 지도가 표시됩니다.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-500">지도를 로딩중...</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="country">국가</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    placeholder="예: 대한민국"
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="city">도시 *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="예: 서울"
                    readOnly
                    className={`bg-gray-50 ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="district">지역구 *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => updateFormData('district', e.target.value)}
                    placeholder="예: 강남구"
                    readOnly
                    className={`bg-gray-50 ${errors.district ? 'border-red-500' : ''}`}
                  />
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
              </div>

              <div>
                <Label className="block mb-3">편의시설</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {FORM_AMENITIES.map(amenity => (
                    <label
                      key={amenity.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
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
                  {FORM_FEATURES.map(feature => (
                    <label
                      key={feature.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
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
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">사진 및 설명</h2>

              <div>
                <Label className="block mb-3">숙소 사진 * (최대 10장)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    errors.images ? 'border-red-500' : 'border-gray-300 hover:border-indigo-500'
                  }`}
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">클릭하여 이미지를 업로드하세요</p>
                  <p className="text-gray-400 text-sm">JPG, PNG 형식, 최대 5MB</p>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageAdd(e.target.files)}
                  />
                </div>
                {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}

                {formData.imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {formData.imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                            대표
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">숙소 설명 *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="숙소의 매력을 자유롭게 소개해주세요."
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-md resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <Label htmlFor="rules">이용 규칙</Label>
                <textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => updateFormData('rules', e.target.value)}
                  placeholder="체크인/체크아웃 시간, 금연, 반려동물 등 규칙을 입력하세요."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">검토 및 등록</h2>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">숙소 이름:</span>
                    <span className="ml-2 font-medium">{formData.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">숙소 유형:</span>
                    <span className="ml-2 font-medium">
                      {FORM_HOUSE_TYPES.find(t => t.value === formData.houseType)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">면적:</span>
                    <span className="ml-2 font-medium">{formData.size}평</span>
                  </div>
                  <div>
                    <span className="text-gray-500">최대 게스트:</span>
                    <span className="ml-2 font-medium">{formData.maxGuests}명</span>
                  </div>
                  <div>
                    <span className="text-gray-500">침실/침대/욕실:</span>
                    <span className="ml-2 font-medium">
                      {formData.bedroomCount}개 / {formData.bedCount}개 / {formData.bathroomCount}개
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">위치</h3>
                <div className="text-sm">
                  <p>
                    <span className="text-gray-500">주소:</span>
                    <span className="ml-2 font-medium">
                      {formData.country} {formData.city} {formData.district}
                    </span>
                  </p>
                  <p className="mt-1">
                    <span className="text-gray-500">상세 주소:</span>
                    <span className="ml-2 font-medium">{formData.address}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">편의시설 및 특징</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map(a => (
                    <span key={a} className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm">
                      {FORM_AMENITIES.find(am => am.value === a)?.label}
                    </span>
                  ))}
                  {formData.features.map(f => (
                    <span key={f} className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                      {FORM_FEATURES.find(fe => fe.value === f)?.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">사진</h3>
                <div className="flex gap-2 overflow-x-auto">
                  {formData.imagePreviewUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">숙소 설명</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.description}</p>
              </div>

              {formData.rules && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">이용 규칙</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.rules}</p>
                </div>
              )}

              <div className={`p-4 border rounded-lg ${errors.termsAgreed ? 'border-red-500' : 'border-gray-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAgreed}
                    onChange={(e) => updateFormData('termsAgreed', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-600">
                    StaySwap의 <a href="#" className="text-indigo-600 hover:underline">이용약관</a>과{' '}
                    <a href="#" className="text-indigo-600 hover:underline">개인정보처리방침</a>에 동의합니다.
                    숙소 정보가 정확함을 확인하였으며, 허위 정보 등록 시 서비스 이용이 제한될 수 있음을 이해합니다.
                  </span>
                </label>
                {errors.termsAgreed && <p className="text-red-500 text-sm mt-2">{errors.termsAgreed}</p>}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    숙소 등록하기
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
