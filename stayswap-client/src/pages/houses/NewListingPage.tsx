import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/routes';

import Home from 'lucide-react/dist/esm/icons/home';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Image from 'lucide-react/dist/esm/icons/image';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Upload from 'lucide-react/dist/esm/icons/upload';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

// 숙소 타입 옵션
const HOUSE_TYPES = [
  { value: 'APARTMENT', label: '아파트' },
  { value: 'HOUSE', label: '주택' },
  { value: 'VILLA', label: '빌라' },
  { value: 'OFFICETEL', label: '오피스텔' },
  { value: 'STUDIO', label: '원룸' },
  { value: 'OTHER', label: '기타' },
];

// 국가 옵션
const COUNTRIES = [
  { value: 'KOREA', label: '대한민국' },
  { value: 'JAPAN', label: '일본' },
  { value: 'USA', label: '미국' },
  { value: 'UK', label: '영국' },
  { value: 'FRANCE', label: '프랑스' },
];

// 편의시설 옵션
const AMENITIES = [
  { value: 'WIFI', label: '와이파이' },
  { value: 'TV', label: 'TV' },
  { value: 'KITCHEN', label: '주방' },
  { value: 'WASHER', label: '세탁기' },
  { value: 'DRYER', label: '건조기' },
  { value: 'AIR_CONDITIONING', label: '에어컨' },
  { value: 'HEATING', label: '난방' },
  { value: 'PARKING', label: '주차장' },
  { value: 'ELEVATOR', label: '엘리베이터' },
  { value: 'POOL', label: '수영장' },
  { value: 'GYM', label: '헬스장' },
  { value: 'PET_FRIENDLY', label: '반려동물 허용' },
];

// 숙소 특징 옵션
const FEATURES = [
  { value: 'OCEAN_VIEW', label: '오션뷰' },
  { value: 'MOUNTAIN_VIEW', label: '마운틴뷰' },
  { value: 'CITY_VIEW', label: '시티뷰' },
  { value: 'GARDEN', label: '정원' },
  { value: 'BALCONY', label: '발코니' },
  { value: 'TERRACE', label: '테라스' },
  { value: 'FIREPLACE', label: '벽난로' },
  { value: 'BBQ', label: '바베큐' },
];

interface ListingFormData {
  // Step 1: 기본 정보
  title: string;
  houseType: string;
  size: number;
  bedroomCount: number;
  bedCount: number;
  bathroomCount: number;
  maxGuests: number;

  // Step 2: 위치 및 특징
  address: string;
  country: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  features: string[];

  // Step 3: 사진 및 설명
  images: File[];
  imagePreviewUrls: string[];
  description: string;
  rules: string;

  // Step 4: 약관 동의
  termsAgreed: boolean;
}

const initialFormData: ListingFormData = {
  title: '',
  houseType: '',
  size: 0,
  bedroomCount: 1,
  bedCount: 1,
  bathroomCount: 1,
  maxGuests: 1,
  address: '',
  country: 'KOREA',
  city: '',
  district: '',
  latitude: 37.5665,
  longitude: 126.978,
  amenities: [],
  features: [],
  images: [],
  imagePreviewUrls: [],
  description: '',
  rules: '',
  termsAgreed: false,
};

const STEPS = [
  { id: 1, title: '기본 정보', icon: Home },
  { id: 2, title: '위치 및 특징', icon: MapPin },
  { id: 3, title: '사진 및 설명', icon: Image },
  { id: 4, title: '검토 및 등록', icon: CheckCircle },
];

// API 호출 함수
const createListing = async (formData: ListingFormData): Promise<{ houseId: number }> => {
  // FormData로 변환 (이미지 포함)
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

export function NewListingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // 폼 데이터 업데이트
  const updateFormData = useCallback(<K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  // 체크박스 토글 (amenities, features)
  const toggleArrayItem = useCallback((field: 'amenities' | 'features', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [field]: newArr };
    });
  }, []);

  // 이미지 추가
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

  // 이미지 제거
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

  // 단계별 유효성 검사
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

  // 다음 단계
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  }, [currentStep, validateStep]);

  // 이전 단계
  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // 제출
  const handleSubmit = useCallback(() => {
    if (validateStep(4)) {
      mutation.mutate(formData);
    }
  }, [formData, mutation, validateStep]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-[900px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">숙소 등록</h1>
          <p className="text-gray-500">숙소를 등록하고 교환을 시작하세요</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {STEPS.map((step, index) => {
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
                  {index < STEPS.length - 1 && (
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

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: 기본 정보 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">기본 정보</h2>

              <div>
                <Label htmlFor="title">숙소 이름 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="예: 강남역 5분, 아늑한 원룸"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="houseType">숙소 유형 *</Label>
                <select
                  id="houseType"
                  value={formData.houseType}
                  onChange={(e) => updateFormData('houseType', e.target.value)}
                  className={`w-full h-10 px-3 border rounded-md ${errors.houseType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">선택하세요</option>
                  {HOUSE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.houseType && <p className="text-red-500 text-sm mt-1">{errors.houseType}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">면적 (㎡) *</Label>
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    value={formData.size || ''}
                    onChange={(e) => updateFormData('size', Number(e.target.value))}
                    className={errors.size ? 'border-red-500' : ''}
                  />
                  {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
                </div>
                <div>
                  <Label htmlFor="maxGuests">최대 게스트 *</Label>
                  <Input
                    id="maxGuests"
                    type="number"
                    min="1"
                    value={formData.maxGuests}
                    onChange={(e) => updateFormData('maxGuests', Number(e.target.value))}
                    className={errors.maxGuests ? 'border-red-500' : ''}
                  />
                  {errors.maxGuests && <p className="text-red-500 text-sm mt-1">{errors.maxGuests}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bedroomCount">침실 수</Label>
                  <Input
                    id="bedroomCount"
                    type="number"
                    min="0"
                    value={formData.bedroomCount}
                    onChange={(e) => updateFormData('bedroomCount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="bedCount">침대 수</Label>
                  <Input
                    id="bedCount"
                    type="number"
                    min="0"
                    value={formData.bedCount}
                    onChange={(e) => updateFormData('bedCount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="bathroomCount">욕실 수</Label>
                  <Input
                    id="bathroomCount"
                    type="number"
                    min="0"
                    value={formData.bathroomCount}
                    onChange={(e) => updateFormData('bathroomCount', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 위치 및 특징 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">위치 및 특징</h2>

              <div>
                <Label htmlFor="country">국가 *</Label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>{country.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">도시 *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="예: 서울"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="district">구/군 *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => updateFormData('district', e.target.value)}
                    placeholder="예: 강남구"
                    className={errors.district ? 'border-red-500' : ''}
                  />
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="address">상세 주소 *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="예: 강남대로 123, 101동 1001호"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label className="block mb-3">편의시설</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMENITIES.map(amenity => (
                    <label
                      key={amenity.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.amenities.includes(amenity.value)
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.value)}
                        onChange={() => toggleArrayItem('amenities', amenity.value)}
                        className="sr-only"
                      />
                      <span className="text-sm">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="block mb-3">숙소 특징</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {FEATURES.map(feature => (
                    <label
                      key={feature.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.features.includes(feature.value)
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.value)}
                        onChange={() => toggleArrayItem('features', feature.value)}
                        className="sr-only"
                      />
                      <span className="text-sm">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 사진 및 설명 */}
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

          {/* Step 4: 검토 및 등록 */}
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
                      {HOUSE_TYPES.find(t => t.value === formData.houseType)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">면적:</span>
                    <span className="ml-2 font-medium">{formData.size}㎡</span>
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
                      {COUNTRIES.find(c => c.value === formData.country)?.label} {formData.city} {formData.district}
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
                      {AMENITIES.find(am => am.value === a)?.label}
                    </span>
                  ))}
                  {formData.features.map(f => (
                    <span key={f} className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                      {FEATURES.find(fe => fe.value === f)?.label}
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

          {/* Navigation Buttons */}
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
