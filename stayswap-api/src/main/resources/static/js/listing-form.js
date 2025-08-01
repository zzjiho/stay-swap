document.addEventListener('DOMContentLoaded', function() {
    // Google Maps 관련 변수
    let map = null;
    let marker = null;
    let rectangle = null;
    let selectedLocation = null;

    // 단계 이동 관련 변수
    const form = document.getElementById('listing-form');
    const steps = document.querySelectorAll('.form-step');
    const progressFill = document.getElementById('progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const submitButton = document.getElementById('submit-listing');

    let currentStep = 1;
    const totalSteps = steps.length;

    // 업로드된 이미지 파일들을 저장할 배열
    let uploadedImages = [];

    // Google Maps 초기화 함수 (전역으로 설정)
    window.initMap = function() {
        
        // 강제 한국어 설정 (다국어 지원은 향후 구현)
        const currentLanguage = 'ko'; // 한국어 강제 설정
        
        // Google Maps API 언어 설정 확인
        
        // 강제로 기본 지도 표시 (테스트용)
        try {
            const testMap = new google.maps.Map(document.getElementById('map'), {
                center: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
                zoom: 12,
                mapTypeControl: false,
                streetViewControl: false,
                // 한국어 지도 표시
                language: 'ko'
            });
        } catch (error) {
            console.error('❌ 지도 생성 실패:', error);
        }
        
                // 주소 입력 필드에 자동완성 기능 추가 (기존 Places API 사용 - 더 안정적)
        const addressInput = document.getElementById('listing-address');
        
        // 기존 Places API 사용 (경고 무시하고 사용)
        try {
            const autocompleteOptions = {
                types: ['address'], // 구체적인 주소만 검색 (비용 절약)
                // 전세계 검색을 위해 country 제한 제거
                fields: ['formatted_address', 'geometry', 'address_components'], // 필요한 필드만 요청
                strictBounds: false, // 전세계 검색 허용
                language: 'ko' // 한국어 결과 우선
            };
            
            const autocomplete = new google.maps.places.Autocomplete(addressInput, autocompleteOptions);
            
            // 자동완성 선택 시 이벤트
            autocomplete.addListener('place_changed', function() {
                
                const place = autocomplete.getPlace();
                
                if (!place.geometry || !place.geometry.location) {
                    alert('선택한 장소의 위치 정보를 찾을 수 없습니다.');
                    return;
                }

                // Geocoding API를 먼저 호출하여 한국어 주소를 가져오기
                
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    location: place.geometry.location,
                    language: 'ko' // 한국어 결과 요청 (전세계 주소에 대해서도 한국어 변환 시도)
                    // region 제거: 전세계 주소에 대해서도 한국어 변환 가능하도록
                }, (results, status) => {
                
                if (status === 'OK' && results[0]) {
                    // 한국어 주소로 업데이트 (Geocoding API 결과 사용)
                    addressInput.value = results[0].formatted_address;

                    // 한국어 Geocoding API 결과에서 도시, 지역구, 국가 추출
                    let city = '';
                    let district = '';
                    let country = '';

                    if (results[0].address_components) {
                        results[0].address_components.forEach(component => {
                            const types = component.types;
                            
                            // 도시 추출 (administrative_area_level_1 = 시/도)
                            if (types.includes('administrative_area_level_1')) {
                                let rawCity = component.long_name;
                                // 한국어 결과에서 시/도 표기 정리
                                city = rawCity.replace('특별시', '').replace('광역시', '').replace('시', '').replace('도', '');
                            }
                            
                            // 지역구 추출 (sublocality_level_1 = 구/군)
                            if (types.includes('sublocality_level_1')) {
                                district = component.long_name;
                            } else if (types.includes('locality') && !district) {
                                district = component.long_name;
                            }
                            
                            // 국가 추출 (country)
                            if (types.includes('country')) {
                                country = component.long_name;
                            }
                        });

                        // 한국어로 추출된 값으로 업데이트
                        if (city) {
                            document.getElementById('listing-city').value = city;
                        }
                        if (district) {
                            document.getElementById('listing-district').value = district;
                        }
                        if (country) {
                            document.getElementById('listing-country').value = country;
                        }
                        
                    }
                    // 지도가 없으면 생성
                    if (!map) {
                        
                        const mapContainer = document.getElementById('map-container');
                        const mapHint = document.getElementById('map-hint');
                        mapContainer.style.display = 'block';
                        mapHint.style.display = 'none';

                                                    map = new google.maps.Map(document.getElementById('map'), {
                                center: place.geometry.location,
                                zoom: 14,
                                mapTypeControl: false,
                                streetViewControl: false,
                                language: 'ko' // 한국어 지도 표시
                            });
                        
                    }

                    // 기존 마커 제거
                    if (marker) {
                        marker.setMap(null);
                        marker = null;
                    }

                    // 지도에 영역 표시
                    if (results[0].geometry && results[0].geometry.viewport) {
                        
                        // 기존 영역 제거
                        if (rectangle) {
                            rectangle.setMap(null);
                        }
                        
                        // 영역을 사각형으로 표시 (빨간색 반투명)
                        rectangle = new google.maps.Rectangle({
                            bounds: results[0].geometry.viewport,
                            fillColor: '#FF4444',
                            fillOpacity: 0.25,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            map: map
                        });
                        
                        // 지도 뷰를 viewport에 맞춤
                        map.fitBounds(results[0].geometry.viewport);
                        
                    } else {
                        
                        // viewport가 없으면 기존처럼 마커 표시
                        map.setCenter(place.geometry.location);
                        map.setZoom(16);
                        
                        marker = new google.maps.Marker({
                            position: place.geometry.location,
                            map: map,
                            draggable: false,
                            animation: google.maps.Animation.DROP
                        });
                        
                        // viewport 정보 초기화
                        window.currentViewport = null;
                    }
                } else {
                    console.error('❌ 한국어 Geocoding API 실패:', status);
                    
                    // Geocoding API 실패 시 주소 컴포넌트에서 한국어 주소 조합 및 도시/지역구/국가 추출 시도
                    let koreanAddress = '';
                    let fallbackCity = '';
                    let fallbackDistrict = '';
                    let fallbackCountry = '';
                    
                    if (place.address_components) {
                        const addressParts = [];
                        place.address_components.forEach(component => {
                            const types = component.types;
                            
                            // 한국어 주소 구성 요소들을 순서대로 조합
                            if (types.includes('country')) {
                                // 국가 정보 추출 (주소에는 포함하지 않음)
                                fallbackCountry = component.long_name;
                            } else if (types.includes('administrative_area_level_1')) {
                                addressParts.unshift(component.long_name); // 시/도를 앞에 추가
                                // 도시 정보 추출
                                let rawCity = component.long_name;
                                fallbackCity = rawCity.replace('특별시', '').replace('광역시', '').replace('시', '').replace('도', '');
                            } else if (types.includes('sublocality_level_1')) {
                                addressParts.push(component.long_name); // 구를 뒤에 추가
                                // 지역구 정보 추출
                                fallbackDistrict = component.long_name;
                            } else if (types.includes('sublocality_level_2')) {
                                addressParts.push(component.long_name); // 동을 뒤에 추가
                            } else if (types.includes('street_number') || types.includes('premise')) {
                                addressParts.push(component.long_name); // 번지를 뒤에 추가
                            } else if (types.includes('locality') && !fallbackDistrict) {
                                // 지역구가 없으면 locality 사용
                                fallbackDistrict = component.long_name;
                            }
                        });
                        koreanAddress = addressParts.join(' ');
                    }
                    
                    // 조합된 한국어 주소가 있으면 사용, 없으면 원본 사용
                    addressInput.value = koreanAddress || place.formatted_address || place.name;

                    // 폴백으로 추출된 도시/지역구/국가 업데이트
                    if (fallbackCity) {
                        document.getElementById('listing-city').value = fallbackCity;
                    }
                    if (fallbackDistrict) {
                        document.getElementById('listing-district').value = fallbackDistrict;
                    }
                    if (fallbackCountry) {
                        document.getElementById('listing-country').value = fallbackCountry;
                    }
                    
                    // 지도 표시 (기존 로직)
                    if (!map) {
                        const mapContainer = document.getElementById('map-container');
                        const mapHint = document.getElementById('map-hint');
                        mapContainer.style.display = 'block';
                        mapHint.style.display = 'none';

                        map = new google.maps.Map(document.getElementById('map'), {
                            center: place.geometry.location,
                            zoom: 16,
                            mapTypeControl: false,
                            streetViewControl: false,
                            language: 'ko' // 한국어 지도 표시
                        });
                    }
                    
                    map.setCenter(place.geometry.location);
                    map.setZoom(16);
                    
                    if (marker) {
                        marker.setPosition(place.geometry.location);
                    } else {
                        marker = new google.maps.Marker({
                            position: place.geometry.location,
                            map: map,
                            draggable: false,
                            animation: google.maps.Animation.DROP
                        });
                    }
                }
            });

                            // 선택된 위치 저장
                selectedLocation = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };

                // 영어 주소도 가져오기 (다국어 지원을 위해)
                
                const geocoderEn = new google.maps.Geocoder();
                geocoderEn.geocode({
                    location: place.geometry.location,
                    language: 'en', // 영어 결과 요청
                    region: 'KR' // 한국 지역 설정
                }, (resultsEn, statusEn) => {
                    
                    if (statusEn === 'OK' && resultsEn[0]) {
                        // 영어 주소 정보를 전역 변수에 저장
                        window.currentEnglishAddress = {
                            address: resultsEn[0].formatted_address,
                            city: '',
                            district: '',
                            country: ''
                        };

                        // 영어 주소 컴포넌트에서 도시, 지역구, 국가 추출
                        if (resultsEn[0].address_components) {
                            resultsEn[0].address_components.forEach(component => {
                        const types = component.types;
                                
                                // 영어 도시 추출
                        if (types.includes('administrative_area_level_1')) {
                                    window.currentEnglishAddress.city = component.long_name;
                        }
                        
                                // 영어 지역구 추출
                                if (types.includes('sublocality_level_1')) {
                                    window.currentEnglishAddress.district = component.long_name;
                                } else if (types.includes('locality') && !window.currentEnglishAddress.district) {
                                    window.currentEnglishAddress.district = component.long_name;
                                }

                                // 영어 국가 추출
                                if (types.includes('country')) {
                                    window.currentEnglishAddress.country = component.long_name;
                }
                            });
                        }

                    } else {
                        console.error('❌ 영어 Geocoding API 실패:', statusEn);
                        window.currentEnglishAddress = null;
                }
                });

                // 기존의 place.address_components 사용 로직은 제거됨
                // 이제 한국어 Geocoding API 결과 또는 폴백 로직에서 도시/지역구를 추출함
        });
        
        } catch (error) {
            console.error('❌ Places API 초기화 실패:', error);
        }
    };

    // 단계 이동 함수
    function goToStep(step) {
        // 현재 단계 숨기기
        steps.forEach(s => s.classList.remove('active'));

        // 새 단계 표시
        steps[step - 1].classList.add('active');

        // 진행 상태 업데이트
        progressFill.style.width = ((step - 1) / (totalSteps - 1) * 100) + '%';

        // 단계 표시기 업데이트
        progressSteps.forEach((s, i) => {
            if (i + 1 < step) {
                s.classList.add('completed');
                s.classList.remove('active');
            } else if (i + 1 === step) {
                s.classList.add('active');
                s.classList.remove('completed');
            } else {
                s.classList.remove('active', 'completed');
            }
        });

        // 현재 단계 업데이트
        currentStep = step;

        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 다음 단계 버튼 이벤트 리스너
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 현재 단계 유효성 검사
            if (validateStep(currentStep)) {
                // 다음 단계로 이동
                if (currentStep < totalSteps) {
                    // 마지막 단계 전이면 다음 단계로 이동
                    goToStep(currentStep + 1);

                    // 마지막 단계로 이동하는 경우 검토 내용 업데이트
                    if (currentStep === totalSteps) {
                        updateReviewContent();
                    }
                }
            }
        });
    });

    // 이전 단계 버튼 이벤트 리스너
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });
    });

    // 단계별 유효성 검사
    function validateStep(step) {
        let isValid = true;

        switch(step) {
            case 1:
                // 1단계: 기본 정보 검사
                const title = document.getElementById('listing-title').value;
                const size = document.getElementById('listing-size').value;
                const bedrooms = document.getElementById('listing-bedrooms').value;
                const beds = document.getElementById('listing-beds').value;
                const bathrooms = document.getElementById('listing-bathrooms').value;
                const guests = document.getElementById('listing-guests').value;

                if (!title || !size || !bedrooms || !beds || !bathrooms || !guests) {
                    alert('모든 필수 항목을 입력해주세요.');
                    isValid = false;
                }
                break;

            case 2:
                // 2단계: 위치 및 특징 검사
                const address = document.getElementById('listing-address').value;
                const city = document.getElementById('listing-city').value;
                const district = document.getElementById('listing-district').value;

                if (!address || !city || !district) {
                    alert('주소 정보를 모두 입력해주세요.');
                    isValid = false;
                }
                break;

            case 3:
                // 3단계: 사진 및 설명 검사
                const description = document.getElementById('listing-description').value;

                if (!description || description.length < 100) {
                    alert('숙소 설명은 최소 100자 이상 작성해주세요.');
                    isValid = false;
                } else if (uploadedImages.length === 0) {
                    alert('최소 1장 이상의 숙소 사진을 업로드해주세요.');
                    isValid = false;
                }
                break;

            case 4:
                // 4단계: 약관 동의 검사
                const termsAgree = document.getElementById('terms-agree').checked;

                if (!termsAgree) {
                    alert('이용약관 및 개인정보 처리방침에 동의해주세요.');
                    isValid = false;
                }
                break;
        }

        return isValid;
    }

    // 검토 내용 업데이트
    function updateReviewContent() {
        // 기본 정보 검토
        const reviewBasicInfo = document.getElementById('review-basic-info');
        const propertyTypeValue = document.querySelector('input[name="property-type"]:checked').value;
        const propertyTypeText = getPropertyTypeText(propertyTypeValue);

        reviewBasicInfo.innerHTML = `
            <div class="review-item">
                <span class="review-label">숙소 이름:</span>
                <span class="review-value">${document.getElementById('listing-title').value}</span>
            </div>
            <div class="review-item">
                <span class="review-label">숙소 유형:</span>
                <span class="review-value">${propertyTypeText}</span>
            </div>
            <div class="review-item">
                <span class="review-label">숙소 크기:</span>
                <span class="review-value">${document.getElementById('listing-size').value} 평</span>
            </div>
            <div class="review-item">
                <span class="review-label">침실 수:</span>
                <span class="review-value">${document.getElementById('listing-bedrooms').value}개</span>
            </div>
            <div class="review-item">
                <span class="review-label">침대 수:</span>
                <span class="review-value">${document.getElementById('listing-beds').value}개</span>
            </div>
            <div class="review-item">
                <span class="review-label">욕실 수:</span>
                <span class="review-value">${document.getElementById('listing-bathrooms').value}개</span>
            </div>
            <div class="review-item">
                <span class="review-label">최대 수용 인원:</span>
                <span class="review-value">${document.getElementById('listing-guests').value}명</span>
            </div>
        `;

        // 위치 및 특징 검토
        const reviewLocationFeatures = document.getElementById('review-location-features');
        reviewLocationFeatures.innerHTML = `
            <div class="review-item">
                <span class="review-label">주소:</span>
                <span class="review-value">${document.getElementById('listing-address').value}</span>
            </div>
            <div class="review-item">
                <span class="review-label">도시:</span>
                <span class="review-value">${document.getElementById('listing-city').value}</span>
            </div>
            <div class="review-item">
                <span class="review-label">지역구:</span>
                <span class="review-value">${document.getElementById('listing-district').value}</span>
            </div>
        `;

        // 편의시설 추가
        const amenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(input => {
            amenities.push(input.nextElementSibling.textContent.trim());
        });

        if (amenities.length > 0) {
            reviewLocationFeatures.innerHTML += `
                <div class="review-item">
                    <span class="review-label">편의시설:</span>
                    <span class="review-value">${amenities.join(', ')}</span>
                </div>
            `;
        }

        // 특징 추가
        const features = [];
        document.querySelectorAll('input[name="features"]:checked').forEach(input => {
            features.push(input.nextElementSibling.textContent.trim());
        });

        if (features.length > 0) {
            reviewLocationFeatures.innerHTML += `
                <div class="review-item">
                    <span class="review-label">특징:</span>
                    <span class="review-value">${features.join(', ')}</span>
                </div>
            `;
        }

        // 사진 및 설명 검토
        const reviewPhotosDescription = document.getElementById('review-photos-description');
        reviewPhotosDescription.innerHTML = `
            <div class="review-item">
                <span class="review-label">숙소 설명:</span>
                <span class="review-value">${document.getElementById('listing-description').value}</span>
            </div>
        `;

        // 이용 규칙 추가
        const rules = document.getElementById('listing-rules').value;
        if (rules) {
            reviewPhotosDescription.innerHTML += `
                <div class="review-item">
                    <span class="review-label">숙소 이용 규칙:</span>
                    <span class="review-value">${rules}</span>
                </div>
            `;
        }

        // 이미지 미리보기 추가
        const imagePreviewContainer = document.getElementById('image-preview-container');
        if (imagePreviewContainer.children.length > 0) {
            let imagesHTML = '<div class="review-item"><span class="review-label">숙소 사진:</span></div><div class="review-images">';

            for (let i = 0; i < imagePreviewContainer.children.length; i++) {
                const img = imagePreviewContainer.children[i].querySelector('img');
                imagesHTML += `<img src="${img.src}" alt="숙소 이미지 ${i+1}" class="review-image">`;
            }

            imagesHTML += '</div>';
            reviewPhotosDescription.innerHTML += imagesHTML;
        }

        // 교환 옵션 검토 섹션 숨기기 (4단계 제거됨)
        const reviewExchangeOptions = document.getElementById('review-exchange-options');
        reviewExchangeOptions.style.display = 'none';
    }

    // 숙소 유형 텍스트 변환 함수
    function getPropertyTypeText(value) {
        const typeMap = {
            'apartment': '아파트',
            'house': '주택',
            'villa': '빌라',
            'op': '오피스텔',
            'other': '기타'
        };
        return typeMap[value] || value;
    }

    // 숙소 유형을 API 형식으로 변환
    function getHouseTypeForAPI(value) {
        const typeMap = {
            'apartment': 'APT',
            'house': 'HOUSE',
            'villa': 'VILLA',
            'op': 'OP',
            'other': 'OTHER'
        };
        return typeMap[value] || 'OTHER';
    }

    // 이미지 업로드 관련 기능
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageUploadInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');

    // 이미지 업로드 영역 클릭 시 파일 선택 창 열기
    imageUploadArea.addEventListener('click', function() {
        imageUploadInput.click();
    });

    // 드래그 앤 드롭 이벤트
    imageUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        imageUploadArea.classList.add('dragover');
    });

    imageUploadArea.addEventListener('dragleave', function() {
        imageUploadArea.classList.remove('dragover');
    });

    imageUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        imageUploadArea.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // 파일 선택 시 이벤트
    imageUploadInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });

    // 파일 처리 함수
    function handleFiles(files) {
        // 최대 10개 파일 제한
        if (uploadedImages.length + files.length > 10) {
            alert('최대 10장까지만 업로드할 수 있습니다.');
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 이미지 파일 확인
            if (!file.type.match('image.*')) {
                alert('이미지 파일만 업로드할 수 있습니다.');
                continue;
            }

            // 파일 크기 확인 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                continue;
            }

            // 파일을 업로드 배열에 추가
            uploadedImages.push(file);

            // 이미지 미리보기 생성
            const reader = new FileReader();

            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview';
                previewDiv.setAttribute('data-file-index', uploadedImages.length - 1);

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '숙소 이미지';

                const removeButton = document.createElement('div');
                removeButton.className = 'image-preview-remove';
                removeButton.innerHTML = '<i class="fas fa-times"></i>';

                // 이미지 삭제 버튼 이벤트
                removeButton.addEventListener('click', function() {
                    const fileIndex = parseInt(previewDiv.getAttribute('data-file-index'));
                    // 업로드 배열에서 파일 제거
                    uploadedImages.splice(fileIndex, 1);
                    // 미리보기 제거
                    previewDiv.remove();
                    // 인덱스 재정렬
                    updateFileIndices();
                });

                previewDiv.appendChild(img);
                previewDiv.appendChild(removeButton);
                imagePreviewContainer.appendChild(previewDiv);
            };

            reader.readAsDataURL(file);
        }
    }

    // 파일 인덱스 업데이트 함수
    function updateFileIndices() {
        const previews = imagePreviewContainer.querySelectorAll('.image-preview');
        previews.forEach((preview, index) => {
            preview.setAttribute('data-file-index', index);
        });
    }

    // 폼 데이터 생성 함수
    function createFormData() {
        const formData = new FormData();

        // 숙소 정보 객체 생성
        const houseRequest = {
            title: document.getElementById('listing-title').value,
            description: document.getElementById('listing-description').value,
            rule: document.getElementById('listing-rules').value || null,
            houseType: getHouseTypeForAPI(document.querySelector('input[name="property-type"]:checked').value),
            size: parseFloat(document.getElementById('listing-size').value),
            bedrooms: parseInt(document.getElementById('listing-bedrooms').value),
            bed: parseInt(document.getElementById('listing-beds').value),
            bathrooms: parseInt(document.getElementById('listing-bathrooms').value),
            maxGuests: parseInt(document.getElementById('listing-guests').value),
            addressKo: document.getElementById('listing-address').value, // 한국어 주소
            cityKo: document.getElementById('listing-city').value, // 한국어 도시
            districtKo: document.getElementById('listing-district').value, // 한국어 지역구
            countryKo: document.getElementById('listing-country').value, // 한국어 국가
            addressEn: window.currentEnglishAddress ? window.currentEnglishAddress.address : null, // 영어 주소
            cityEn: window.currentEnglishAddress ? window.currentEnglishAddress.city : null, // 영어 도시  
            districtEn: window.currentEnglishAddress ? window.currentEnglishAddress.district : null, // 영어 지역구
            countryEn: window.currentEnglishAddress ? window.currentEnglishAddress.country : null, // 영어 국가
            latitude: selectedLocation ? selectedLocation.lat : null,
            longitude: selectedLocation ? selectedLocation.lng : null,
            viewportNortheastLat: window.currentViewport ? window.currentViewport.getNorthEast().lat() : null,
            viewportNortheastLng: window.currentViewport ? window.currentViewport.getNorthEast().lng() : null,
            viewportSouthwestLat: window.currentViewport ? window.currentViewport.getSouthWest().lat() : null,
            viewportSouthwestLng: window.currentViewport ? window.currentViewport.getSouthWest().lng() : null,
            petsAllowed: document.querySelector('input[name="features"][value="pets"]')?.checked || false,
            options: {
                hasFreeWifi: document.querySelector('input[name="amenities"][value="wifi"]')?.checked || false,
                hasAirConditioner: document.querySelector('input[name="amenities"][value="aircon"]')?.checked || false,
                hasTV: document.querySelector('input[name="amenities"][value="tv"]')?.checked || false,
                hasWashingMachine: document.querySelector('input[name="amenities"][value="washer"]')?.checked || false,
                hasKitchen: document.querySelector('input[name="amenities"][value="kitchen"]')?.checked || false,
                hasDryer: document.querySelector('input[name="amenities"][value="hairdryer"]')?.checked || false,
                hasIron: document.querySelector('input[name="amenities"][value="iron"]')?.checked || false,
                hasRefrigerator: document.querySelector('input[name="amenities"][value="fridge"]')?.checked || false,
                hasMicrowave: document.querySelector('input[name="amenities"][value="microwave"]')?.checked || false,
                otherAmenities: null,
                hasFreeParking: document.querySelector('input[name="features"][value="parking"]')?.checked || false,
                hasBalconyTerrace: document.querySelector('input[name="features"][value="balcony"]')?.checked || false,
                hasPetsAllowed: document.querySelector('input[name="features"][value="pets"]')?.checked || false,
                hasSmokingAllowed: document.querySelector('input[name="features"][value="smoking"]')?.checked || false,
                hasElevator: document.querySelector('input[name="features"][value="elevator"]')?.checked || false,
                otherFeatures: null
            }
        };

        // JSON 데이터를 Blob으로 변환하여 추가
        const requestBlob = new Blob([JSON.stringify(houseRequest)], {
            type: 'application/json'
        });
        formData.append('request', requestBlob);

        // 이미지 파일들 추가
        uploadedImages.forEach((file, index) => {
            formData.append('images', file);
        });

        return formData;
    }

    // 로딩 상태 관리 함수
    function setLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 등록 중...';
        } else {
            submitButton.disabled = false;
            submitButton.innerHTML = '숙소 등록하기';
        }
    }

    // 폼 제출 이벤트
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 인증 토큰 체크
        if (!window.isLoggedIn()) {
            alert('로그인이 필요한 서비스입니다.');
            window.location.href = '/page/auth?redirect=' + encodeURIComponent(window.location.href);
            return;
        }

        // 마지막 단계 유효성 검사
        if (!validateStep(totalSteps)) {
            return;
        }

        // 로딩 상태 시작
        setLoading(true);

        // 폼 데이터 생성
        const formData = createFormData();

        // jQuery AJAX 요청 (사용자 정보는 서버에서 자동 처리)
        $.ajax({
            url: `/api/house`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                alert('숙소가 성공적으로 등록되었습니다.');

                // 성공 시 리다이렉트
                window.location.href = '/page/listings';
            },
            error: function(xhr, status, error) {
                console.error('숙소 등록 실패:', xhr.responseText);

                let errorMessage = '숙소 등록 중 오류가 발생했습니다.';

                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse.message) {
                        errorMessage = errorResponse.message;
                    } else if (errorResponse.errors && errorResponse.errors.length > 0) {
                        errorMessage = errorResponse.errors[0].message;
                    }
                } catch (e) {
                    console.error('Error parsing response:', e);
                }

                alert(errorMessage);
            },
            complete: function() {
                // 로딩 상태 종료
                setLoading(false);
            }
        });
    });

    // 디버깅을 위한 콘솔 로그 함수
    function debugFormData() {
        const formData = createFormData();
        // Form Data 내용은 개발자 도구에서 확인 가능
    }

    // 개발자 도구에서 디버깅할 수 있도록 전역 함수로 노출
    window.debugFormData = debugFormData;
});