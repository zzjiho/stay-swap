document.addEventListener('DOMContentLoaded', function() {
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
                const imagePreviewContainer = document.getElementById('image-preview-container');

                if (!description || description.length < 100) {
                    alert('숙소 설명은 최소 100자 이상 작성해주세요.');
                    isValid = false;
                } else if (imagePreviewContainer.children.length === 0) {
                    alert('최소 1장 이상의 숙소 사진을 업로드해주세요.');
                    isValid = false;
                }
                break;

            case 4:
                // 4단계: 교환 옵션 검사
                const points = document.getElementById('listing-points').value;

                if (!points || points < 100) {
                    alert('교환 포인트는 최소 100 이상이어야 합니다.');
                    isValid = false;
                }
                break;

            case 5:
                // 5단계: 약관 동의 검사
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
        reviewBasicInfo.innerHTML = `
            <div class="review-item">
                <span class="review-label">숙소 이름:</span>
                <span class="review-value">${document.getElementById('listing-title').value}</span>
            </div>
            <div class="review-item">
                <span class="review-label">숙소 유형:</span>
                <span class="review-value">${document.querySelector('input[name="property-type"]:checked').value}</span>
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

        // 교환 옵션 검토
        const reviewExchangeOptions = document.getElementById('review-exchange-options');
        reviewExchangeOptions.innerHTML = `
            <div class="review-item">
                <span class="review-label">교환 포인트:</span>
                <span class="review-value">${document.getElementById('listing-points').value} P</span>
            </div>
        `;

        // 교환 유형 추가
        const exchangeTypes = [];
        document.querySelectorAll('input[name="exchange-types"]:checked').forEach(input => {
            exchangeTypes.push(input.nextElementSibling.textContent.trim());
        });

        if (exchangeTypes.length > 0) {
            reviewExchangeOptions.innerHTML += `
                <div class="review-item">
                    <span class="review-label">교환 유형:</span>
                    <span class="review-value">${exchangeTypes.join(', ')}</span>
                </div>
            `;
        }
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
        if (imagePreviewContainer.children.length + files.length > 10) {
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

            // 이미지 미리보기 생성
            const reader = new FileReader();

            reader.onload = function(e) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '숙소 이미지';

                const removeButton = document.createElement('div');
                removeButton.className = 'image-preview-remove';
                removeButton.innerHTML = '<i class="fas fa-times"></i>';

                // 이미지 삭제 버튼 이벤트
                removeButton.addEventListener('click', function() {
                    previewDiv.remove();
                });

                previewDiv.appendChild(img);
                previewDiv.appendChild(removeButton);
                imagePreviewContainer.appendChild(previewDiv);
            };

            reader.readAsDataURL(file);
        }
    }

    // LiveLocal 경험 추가 버튼
    const addExperienceBtn = document.getElementById('add-experience-btn');
    const experienceList = document.getElementById('experience-list');

    addExperienceBtn.addEventListener('click', function() {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        experienceItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">경험 제목</label>
                    <input type="text" name="experience-title[]" class="form-control" placeholder="예: 강남 맛집 투어">
                </div>
                <div class="form-group">
                    <label class="form-label">소요 시간</label>
                    <div class="input-group">
                        <input type="number" name="experience-duration[]" class="form-control" min="1" placeholder="0">
                        <span class="input-group-text">시간</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">추가 포인트</label>
                    <div class="input-group">
                        <input type="number" name="experience-points[]" class="form-control" min="0" placeholder="0">
                        <span class="input-group-text">P</span>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">경험 설명</label>
                <textarea name="experience-description[]" class="form-control" rows="2" placeholder="경험에 대한 설명을 입력해주세요."></textarea>
            </div>
            <button type="button" class="btn btn-outline remove-item">
                <i class="fas fa-trash"></i> 삭제
            </button>
        `;

        // 삭제 버튼 이벤트
        const removeButton = experienceItem.querySelector('.remove-item');
        removeButton.addEventListener('click', function() {
            experienceItem.remove();
        });

        experienceList.appendChild(experienceItem);
    });

    // TimeBank 서비스 추가 버튼
    const addServiceBtn = document.getElementById('add-service-btn');
    const serviceList = document.getElementById('service-list');

    addServiceBtn.addEventListener('click', function() {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';
        serviceItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">서비스 제목</label>
                    <input type="text" name="service-title[]" class="form-control" placeholder="예: 한국어 회화 레슨">
                </div>
                <div class="form-group">
                    <label class="form-label">소요 시간</label>
                    <div class="input-group">
                        <input type="number" name="service-duration[]" class="form-control" min="1" placeholder="0">
                        <span class="input-group-text">시간</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">추가 포인트</label>
                    <div class="input-group">
                        <input type="number" name="service-points[]" class="form-control" min="0" placeholder="0">
                        <span class="input-group-text">P</span>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">서비스 설명</label>
                <textarea name="service-description[]" class="form-control" rows="2" placeholder="서비스에 대한 설명을 입력해주세요."></textarea>
            </div>
            <button type="button" class="btn btn-outline remove-item">
                <i class="fas fa-trash"></i> 삭제
            </button>
        `;

        // 삭제 버튼 이벤트
        const removeButton = serviceItem.querySelector('.remove-item');
        removeButton.addEventListener('click', function() {
            serviceItem.remove();
        });

        serviceList.appendChild(serviceItem);
    });

    // 교환 유형에 따른 섹션 표시/숨김
    const liveLocalCheckbox = document.querySelector('input[name="exchange-types"][value="livelocal"]');
    const timeBankCheckbox = document.querySelector('input[name="exchange-types"][value="timebank"]');
    const liveLocalSection = document.getElementById('livelocal-section');
    const timeBankSection = document.getElementById('timebank-section');

    // 초기 상태 설정
    liveLocalSection.style.display = liveLocalCheckbox.checked ? 'block' : 'none';
    timeBankSection.style.display = timeBankCheckbox.checked ? 'block' : 'none';

    // 체크박스 변경 이벤트
    liveLocalCheckbox.addEventListener('change', function() {
        liveLocalSection.style.display = this.checked ? 'block' : 'none';
    });

    timeBankCheckbox.addEventListener('change', function() {
        timeBankSection.style.display = this.checked ? 'block' : 'none';
    });

    // 폼 제출 이벤트
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 마지막 단계 유효성 검사
        if (validateStep(totalSteps)) {
            // 폼 데이터 수집
            const formData = new FormData(form);

            // API 호출 (실제 구현 시)
            // fetch('/api/listings', {
            //     method: 'POST',
            //     body: formData
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         alert('숙소가 성공적으로 등록되었습니다.');
            //         window.location.href = '/host/listings';
            //     } else {
            //         alert(data.message || '숙소 등록에 실패했습니다.');
            //     }
            // })
            // .catch(error => {
            //     console.error('Error:', error);
            //     alert('숙소 등록 중 오류가 발생했습니다.');
            // });

            // 임시 구현 (API 연동 전)
            alert('숙소가 성공적으로 등록되었습니다.');
            window.location.href = '/host/listings';
        }
    });
});