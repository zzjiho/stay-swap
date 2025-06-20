document.addEventListener('DOMContentLoaded', function() {
    // 현재 URL에서 숙소 ID 추출
    const pathParts = window.location.pathname.split('/');
    const houseId = pathParts[pathParts.length - 1];
    
    // 사용자 정보 가져오기
    const userId = getUserIdFromCookie();
    
    // 폼 요소
    const form = document.getElementById('listing-form');
    const progressFill = document.getElementById('progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const formSteps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const submitButton = document.getElementById('submit-listing');
    
    // 이미지 관련 요소
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageInput = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const currentImagesContainer = document.getElementById('current-images');
    
    // 삭제할 이미지 ID 목록
    let deleteImageIds = [];
    
    // 새로 업로드할 이미지 파일 목록
    let newImageFiles = [];
    
    // 현재 단계
    let currentStep = 1;
    
    // 기존 숙소 정보 로드
    loadHouseData();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    /**
     * 기존 숙소 정보를 API에서 가져와 폼에 채우는 함수
     */
    function loadHouseData() {
        fetch(`/api/houses/${houseId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('숙소 정보를 불러오는 데 실패했습니다.');
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 'SUCCESS') {
                    fillFormWithData(data.data);
                    loadHouseImages();
                } else {
                    showError('숙소 정보를 불러오는 데 실패했습니다.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('숙소 정보를 불러오는 데 실패했습니다.');
            });
    }
    
    /**
     * 숙소 이미지를 API에서 가져와 표시하는 함수
     */
    function loadHouseImages() {
        fetch(`/api/houses/${houseId}/images`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('숙소 이미지를 불러오는 데 실패했습니다.');
                }
                return response.json();
            })
            .then(data => {
                if (data.code === 'SUCCESS') {
                    displayCurrentImages(data.data);
                } else {
                    showError('숙소 이미지를 불러오는 데 실패했습니다.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('숙소 이미지를 불러오는 데 실패했습니다.');
            });
    }
    
    /**
     * API에서 가져온 데이터로 폼을 채우는 함수
     */
    function fillFormWithData(house) {
        // 기본 정보 채우기
        document.getElementById('listing-title').value = house.title || '';
        
        // 숙소 유형 선택
        const propertyTypeRadios = document.querySelectorAll('input[name="property-type"]');
        propertyTypeRadios.forEach(radio => {
            if (mapHouseTypeToRadioValue(house.houseType) === radio.value) {
                radio.checked = true;
            }
        });
        
        document.getElementById('listing-size').value = house.size || '';
        document.getElementById('listing-bedrooms').value = house.bedrooms || '';
        document.getElementById('listing-beds').value = house.bed || '';
        document.getElementById('listing-bathrooms').value = house.bathrooms || '';
        document.getElementById('listing-guests').value = house.maxGuests || '';
        
        // 위치 정보 채우기
        document.getElementById('listing-address').value = house.address || '';
        document.getElementById('listing-city').value = house.city || '';
        document.getElementById('listing-district').value = house.district || '';
        
        // 편의시설 체크
        if (house.options) {
            const options = house.options;
            
            // 편의시설
            document.getElementById('amenity-wifi').checked = options.hasFreeWifi || false;
            document.getElementById('amenity-aircon').checked = options.hasAirConditioner || false;
            document.getElementById('amenity-tv').checked = options.hasTV || false;
            document.getElementById('amenity-washer').checked = options.hasWashingMachine || false;
            document.getElementById('amenity-kitchen').checked = options.hasKitchen || false;
            document.getElementById('amenity-hairdryer').checked = options.hasDryer || false;
            document.getElementById('amenity-iron').checked = options.hasIron || false;
            document.getElementById('amenity-fridge').checked = options.hasRefrigerator || false;
            document.getElementById('amenity-microwave').checked = options.hasMicrowave || false;
            
            // 특징
            document.getElementById('feature-parking').checked = options.hasFreeParking || false;
            document.getElementById('feature-balcony').checked = options.hasBalconyTerrace || false;
            document.getElementById('feature-pets').checked = options.hasPetsAllowed || false;
            document.getElementById('feature-smoking').checked = options.hasSmokingAllowed || false;
            document.getElementById('feature-elevator').checked = options.hasElevator || false;
        }
        
        // 설명 및 규칙 채우기
        document.getElementById('listing-description').value = house.description || '';
        document.getElementById('listing-rules').value = house.rule || '';
        
        // 검토 단계 정보 업데이트
        updateReviewSection();
    }
    
    /**
     * 현재 등록된 이미지를 화면에 표시하는 함수
     */
    function displayCurrentImages(images) {
        currentImagesContainer.innerHTML = '';
        
        if (!images || images.length === 0) {
            const noImagesMessage = document.createElement('p');
            noImagesMessage.textContent = '등록된 이미지가 없습니다.';
            currentImagesContainer.appendChild(noImagesMessage);
            return;
        }
        
        images.forEach(image => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-item';
            imageContainer.dataset.imageId = image.imageId;
            
            const img = document.createElement('img');
            img.src = image.imageUrl;
            img.alt = '숙소 이미지';
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-image';
            deleteButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteButton.addEventListener('click', function() {
                // 삭제할 이미지 ID 목록에 추가
                deleteImageIds.push(image.imageId);
                imageContainer.remove();
            });
            
            imageContainer.appendChild(img);
            imageContainer.appendChild(deleteButton);
            currentImagesContainer.appendChild(imageContainer);
        });
    }
    
    /**
     * 이벤트 리스너 설정 함수
     */
    function setupEventListeners() {
        // 다음 단계 버튼
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    goToNextStep();
                }
            });
        });
        
        // 이전 단계 버튼
        prevButtons.forEach(button => {
            button.addEventListener('click', goToPrevStep);
        });
        
        // 진행 단계 클릭
        progressSteps.forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                if (stepNumber < currentStep || validateCurrentStep()) {
                    goToStep(stepNumber);
                }
            });
        });
        
        // 이미지 업로드 영역 클릭
        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        // 이미지 드래그 앤 드롭
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        });
        
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('dragover');
        });
        
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            handleImageFiles(e.dataTransfer.files);
        });
        
        // 이미지 파일 선택
        imageInput.addEventListener('change', () => {
            handleImageFiles(imageInput.files);
        });
        
        // 폼 제출
        form.addEventListener('submit', handleFormSubmit);
    }
    
    /**
     * 현재 단계 유효성 검증
     */
    function validateCurrentStep() {
        switch (currentStep) {
            case 1: // 기본 정보
                return validateBasicInfo();
            case 2: // 위치 및 특징
                return validateLocationFeatures();
            case 3: // 사진 및 설명
                return validatePhotosDescription();
            case 4: // 검토 및 제출
                return validateFinalStep();
            default:
                return true;
        }
    }
    
    /**
     * 기본 정보 유효성 검증
     */
    function validateBasicInfo() {
        const title = document.getElementById('listing-title').value;
        const size = document.getElementById('listing-size').value;
        const bedrooms = document.getElementById('listing-bedrooms').value;
        const beds = document.getElementById('listing-beds').value;
        const bathrooms = document.getElementById('listing-bathrooms').value;
        const guests = document.getElementById('listing-guests').value;
        
        if (!title || !size || bedrooms === '' || !beds || !bathrooms || !guests) {
            showError('모든 필수 정보를 입력해주세요.');
            return false;
        }
        
        return true;
    }
    
    /**
     * 위치 및 특징 유효성 검증
     */
    function validateLocationFeatures() {
        const address = document.getElementById('listing-address').value;
        const city = document.getElementById('listing-city').value;
        const district = document.getElementById('listing-district').value;
        
        if (!address || !city || !district) {
            showError('주소 정보를 모두 입력해주세요.');
            return false;
        }
        
        return true;
    }
    
    /**
     * 사진 및 설명 유효성 검증
     */
    function validatePhotosDescription() {
        const description = document.getElementById('listing-description').value;
        
        if (!description || description.length < 100) {
            showError('숙소 설명은 최소 100자 이상 작성해주세요.');
            return false;
        }
        
        return true;
    }
    
    /**
     * 최종 단계 유효성 검증
     */
    function validateFinalStep() {
        const termsAgree = document.getElementById('terms-agree').checked;
        
        if (!termsAgree) {
            showError('이용약관 및 개인정보 처리방침에 동의해주세요.');
            return false;
        }
        
        return true;
    }
    
    /**
     * 다음 단계로 이동
     */
    function goToNextStep() {
        if (currentStep < 4) {
            goToStep(currentStep + 1);
        }
    }
    
    /**
     * 이전 단계로 이동
     */
    function goToPrevStep() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }
    
    /**
     * 특정 단계로 이동
     */
    function goToStep(step) {
        // 현재 단계 비활성화
        formSteps.forEach(formStep => {
            formStep.classList.remove('active');
        });
        progressSteps.forEach(progressStep => {
            progressStep.classList.remove('active');
        });
        
        // 새 단계 활성화
        formSteps[step - 1].classList.add('active');
        for (let i = 0; i < step; i++) {
            progressSteps[i].classList.add('active');
        }
        
        // 진행 바 업데이트
        progressFill.style.width = ((step - 1) / 3 * 100) + '%';
        
        // 현재 단계 업데이트
        currentStep = step;
        
        // 검토 단계인 경우 정보 업데이트
        if (step === 4) {
            updateReviewSection();
        }
    }
    
    /**
     * 검토 단계 정보 업데이트
     */
    function updateReviewSection() {
        // 기본 정보
        const basicInfoSection = document.getElementById('review-basic-info');
        basicInfoSection.innerHTML = `
            <p><strong>숙소 이름:</strong> ${document.getElementById('listing-title').value}</p>
            <p><strong>숙소 유형:</strong> ${getSelectedPropertyType()}</p>
            <p><strong>숙소 크기:</strong> ${document.getElementById('listing-size').value}평</p>
            <p><strong>침실 수:</strong> ${document.getElementById('listing-bedrooms').value}</p>
            <p><strong>침대 수:</strong> ${document.getElementById('listing-beds').value}</p>
            <p><strong>욕실 수:</strong> ${document.getElementById('listing-bathrooms').value}</p>
            <p><strong>최대 수용 인원:</strong> ${document.getElementById('listing-guests').value}명</p>
        `;
        
        // 위치 및 특징
        const locationFeaturesSection = document.getElementById('review-location-features');
        locationFeaturesSection.innerHTML = `
            <p><strong>주소:</strong> ${document.getElementById('listing-address').value}</p>
            <p><strong>도시:</strong> ${document.getElementById('listing-city').value}</p>
            <p><strong>지역구:</strong> ${document.getElementById('listing-district').value}</p>
            <p><strong>편의시설:</strong> ${getSelectedAmenities()}</p>
            <p><strong>특징:</strong> ${getSelectedFeatures()}</p>
        `;
        
        // 사진 및 설명
        const photosDescriptionSection = document.getElementById('review-photos-description');
        photosDescriptionSection.innerHTML = `
            <p><strong>설명:</strong> ${document.getElementById('listing-description').value}</p>
            <p><strong>이용 규칙:</strong> ${document.getElementById('listing-rules').value || '없음'}</p>
            <p><strong>이미지:</strong> 현재 ${document.querySelectorAll('#current-images .image-item').length}장, 
                                    새로 추가 ${newImageFiles.length}장, 
                                    삭제 예정 ${deleteImageIds.length}장</p>
        `;
    }
    
    /**
     * 선택된 숙소 유형 텍스트 반환
     */
    function getSelectedPropertyType() {
        const selectedRadio = document.querySelector('input[name="property-type"]:checked');
        if (selectedRadio) {
            const label = document.querySelector(`label[for="${selectedRadio.id}"]`);
            return label ? label.textContent : '선택 안됨';
        }
        return '선택 안됨';
    }
    
    /**
     * 선택된 편의시설 텍스트 반환
     */
    function getSelectedAmenities() {
        const selectedAmenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                selectedAmenities.push(label.textContent);
            }
        });
        
        return selectedAmenities.length > 0 ? selectedAmenities.join(', ') : '없음';
    }
    
    /**
     * 선택된 특징 텍스트 반환
     */
    function getSelectedFeatures() {
        const selectedFeatures = [];
        document.querySelectorAll('input[name="features"]:checked').forEach(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            if (label) {
                selectedFeatures.push(label.textContent);
            }
        });
        
        return selectedFeatures.length > 0 ? selectedFeatures.join(', ') : '없음';
    }
    
    /**
     * 이미지 파일 처리
     */
    function handleImageFiles(files) {
        if (!files || files.length === 0) return;
        
        // 최대 10개 이미지 제한 확인 (현재 이미지 + 새 이미지 - 삭제 예정 이미지)
        const currentImagesCount = document.querySelectorAll('#current-images .image-item').length;
        const totalImagesAfterUpdate = currentImagesCount + newImageFiles.length + files.length - deleteImageIds.length;
        
        if (totalImagesAfterUpdate > 10) {
            showError('이미지는 최대 10개까지만 업로드할 수 있습니다.');
            return;
        }
        
        // 파일 유효성 검사 및 미리보기 추가
        Array.from(files).forEach(file => {
            if (!file.type.match('image.*')) {
                showError('이미지 파일만 업로드할 수 있습니다.');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB 제한
                showError('이미지 크기는 5MB를 초과할 수 없습니다.');
                return;
            }
            
            // 새 이미지 파일 목록에 추가
            newImageFiles.push(file);
            
            // 미리보기 생성
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-item new-image';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '새 이미지';
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-image';
                deleteButton.innerHTML = '<i class="fas fa-times"></i>';
                deleteButton.addEventListener('click', function() {
                    // 새 이미지 파일 목록에서 제거
                    const index = newImageFiles.indexOf(file);
                    if (index !== -1) {
                        newImageFiles.splice(index, 1);
                    }
                    imageContainer.remove();
                });
                
                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteButton);
                imagePreviewContainer.appendChild(imageContainer);
            };
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 폼 제출 처리
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!validateFinalStep()) {
            return;
        }
        
        // 폼 데이터 생성
        const formData = new FormData();
        
        // 요청 객체 생성
        const requestData = {
            title: document.getElementById('listing-title').value,
            description: document.getElementById('listing-description').value,
            rule: document.getElementById('listing-rules').value,
            houseType: mapRadioValueToHouseType(document.querySelector('input[name="property-type"]:checked').value),
            size: parseFloat(document.getElementById('listing-size').value),
            bedrooms: parseInt(document.getElementById('listing-bedrooms').value),
            bed: parseInt(document.getElementById('listing-beds').value),
            bathrooms: parseFloat(document.getElementById('listing-bathrooms').value),
            maxGuests: parseInt(document.getElementById('listing-guests').value),
            address: document.getElementById('listing-address').value,
            city: document.getElementById('listing-city').value,
            district: document.getElementById('listing-district').value,
            petsAllowed: document.getElementById('feature-pets').checked,
            deleteImageIds: deleteImageIds.length > 0 ? deleteImageIds : null,
            options: {
                hasFreeWifi: document.getElementById('amenity-wifi').checked,
                hasAirConditioner: document.getElementById('amenity-aircon').checked,
                hasTV: document.getElementById('amenity-tv').checked,
                hasWashingMachine: document.getElementById('amenity-washer').checked,
                hasKitchen: document.getElementById('amenity-kitchen').checked,
                hasDryer: document.getElementById('amenity-hairdryer').checked,
                hasIron: document.getElementById('amenity-iron').checked,
                hasRefrigerator: document.getElementById('amenity-fridge').checked,
                hasMicrowave: document.getElementById('amenity-microwave').checked,
                hasFreeParking: document.getElementById('feature-parking').checked,
                hasBalconyTerrace: document.getElementById('feature-balcony').checked,
                hasPetsAllowed: document.getElementById('feature-pets').checked,
                hasSmokingAllowed: document.getElementById('feature-smoking').checked,
                hasElevator: document.getElementById('feature-elevator').checked
            }
        };
        
        // 요청 데이터를 JSON 문자열로 변환하여 FormData에 추가
        formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
        
        // 새 이미지 파일 추가
        if (newImageFiles.length > 0) {
            newImageFiles.forEach(file => {
                formData.append('images', file);
            });
        }
        
        // API 호출
        submitButton.disabled = true;
        submitButton.textContent = '처리 중...';
        
        fetch(`/api/houses/${houseId}?userId=${userId}`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('숙소 수정에 실패했습니다.');
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 'SUCCESS') {
                showSuccess('숙소가 성공적으로 수정되었습니다.');
                // 내 숙소 목록 페이지로 리다이렉트
                setTimeout(() => {
                    window.location.href = '/my/houses';
                }, 1500);
            } else {
                showError(data.message || '숙소 수정에 실패했습니다.');
                submitButton.disabled = false;
                submitButton.textContent = '숙소 수정하기';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('숙소 수정에 실패했습니다.');
            submitButton.disabled = false;
            submitButton.textContent = '숙소 수정하기';
        });
    }
    
    /**
     * 에러 메시지 표시
     */
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        
        // 이전 알림 제거
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // 새 알림 추가
        form.parentNode.insertBefore(errorDiv, form);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
    
    /**
     * 성공 메시지 표시
     */
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.textContent = message;
        
        // 이전 알림 제거
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // 새 알림 추가
        form.parentNode.insertBefore(successDiv, form);
    }
    
    /**
     * 쿠키에서 사용자 ID 가져오기
     */
    function getUserIdFromCookie() {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith('userId=')) {
                return cookie.substring('userId='.length, cookie.length);
            }
        }
        return null;
    }
    
    /**
     * 라디오 값을 HouseType으로 변환
     */
    function mapRadioValueToHouseType(radioValue) {
        const mapping = {
            'apartment': 'APT',
            'house': 'HOUSE',
            'villa': 'VILLA',
            'op': 'OFFICETEL',
            'other': 'OTHER'
        };
        return mapping[radioValue] || 'OTHER';
    }
    
    /**
     * HouseType을 라디오 값으로 변환
     */
    function mapHouseTypeToRadioValue(houseType) {
        const mapping = {
            'APT': 'apartment',
            'HOUSE': 'house',
            'VILLA': 'villa',
            'OFFICETEL': 'op',
            'OTHER': 'other'
        };
        return mapping[houseType] || 'other';
    }
});
