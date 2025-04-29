document.addEventListener('DOMContentLoaded', function() {
    // URL에서 숙소 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');

    if (!listingId) {
        // ID가 없으면 목록 페이지로 리다이렉트 (실제 구현 시)
        // window.location.href = '/listings';
        // return;

        // 테스트를 위해 기본 ID 사용
        console.log('숙소 ID가 없습니다. 기본 데이터를 사용합니다.');
    }

    // 숙소 상세 정보 불러오기
    fetchListingDetail(listingId || '1');

    // 예약 탭 기능
    const bookingTabs = document.querySelectorAll('.booking-tab');
    const bookingTabPanes = document.querySelectorAll('.booking-tab-pane');

    bookingTabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            // 탭 활성화 상태 변경
            bookingTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // 탭 패널 활성화 상태 변경
            bookingTabPanes.forEach(pane => pane.classList.remove('active'));
            bookingTabPanes[index].classList.add('active');
        });
    });

    // 갤러리 네비게이션 기능
    const galleryPrev = document.querySelector('.gallery-prev');
    const galleryNext = document.querySelector('.gallery-next');
    const galleryDots = document.getElementById('gallery-dots');

    if (galleryPrev && galleryNext) {
        galleryPrev.addEventListener('click', function() {
            navigateGallery('prev');
        });

        galleryNext.addEventListener('click', function() {
            navigateGallery('next');
        });
    }

    // 교환 요청 버튼 이벤트 리스너
    const exchangeRequestBtn = document.getElementById('exchange-request-btn');
    if (exchangeRequestBtn) {
        exchangeRequestBtn.addEventListener('click', function() {
            requestExchange(listingId || '1');
        });
    }

    // 옵션 적용 버튼 이벤트 리스너
    const optionsApplyBtn = document.getElementById('options-apply-btn');
    if (optionsApplyBtn) {
        optionsApplyBtn.addEventListener('click', function() {
            applyOptions();
        });
    }
});

// 숙소 상세 정보 불러오기
function fetchListingDetail(listingId) {
    // API 호출 (실제 구현 시)
    // fetch(`/api/listings/${listingId}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         renderListingDetail(data);
    //     })
    //     .catch(error => {
    //         console.error('Error:', error);
    //         alert('숙소 정보를 불러오는 데 실패했습니다.');
    //     });

    // 임시 데이터 (API 연동 전)
    setTimeout(() => {
        const mockListing = {
            id: listingId,
            title: '서울 강남 모던 아파트',
            description: '강남역에서 도보 5분 거리에 위치한 모던한 아파트입니다. 편리한 교통과 함께 강남의 중심에서 현지인처럼 생활해보세요. 주변에는 다양한 맛집과 쇼핑몰이 있어 편리합니다.',
            location: '서울 강남구',
            rating: 4.9,
            reviews: 28,
            points: 500,
            features: ['LiveLocal', '무료 주차', '반려동물 동반 가능'],
            images: [
                '/images/listing-detail-1.jpg',
                '/images/listing-detail-2.jpg',
                '/images/listing-detail-3.jpg',
                '/images/listing-detail-4.jpg',
                '/images/listing-detail-5.jpg'
            ],
            amenities: [
                '무선 인터넷',
                '에어컨',
                '세탁기',
                '주방',
                '헤어드라이어',
                '다리미',
                '냉장고',
                '전자레인지',
                'TV'
            ],
            host: {
                name: '김민수',
                image: '/images/host-1.jpg',
                joinedYear: 2020,
                responseRate: 98,
                isSuperhost: true
            },
            liveLocalExperiences: [
                {
                    id: 1,
                    title: '강남 맛집 투어',
                    description: '현지인만 아는 강남의 숨은 맛집들을 소개해드립니다.',
                    duration: 3,
                    points: 100
                },
                {
                    id: 2,
                    title: '한강 자전거 투어',
                    description: '한강을 따라 자전거를 타며 서울의 아름다운 경치를 감상해보세요.',
                    duration: 2,
                    points: 80
                }
            ],
            timeBankServices: [
                {
                    id: 1,
                    title: '한국어 회화 레슨',
                    description: '기초적인 한국어 회화를 가르쳐드립니다.',
                    duration: 1,
                    points: 50
                },
                {
                    id: 2,
                    title: '서울 지하철 이용 가이드',
                    description: '복잡한 서울 지하철 시스템을 쉽게 이용하는 방법을 알려드립니다.',
                    duration: 1,
                    points: 30
                }
            ]
        };

        renderListingDetail(mockListing);
    }, 300);
}

// 숙소 상세 정보 렌더링
function renderListingDetail(listing) {
    // 제목 설정
    document.title = `${listing.title} - StaySwap`;
    document.getElementById('listing-title').textContent = listing.title;

    // 평점 및 리뷰 설정
    document.getElementById('listing-rating').textContent = listing.rating;
    document.getElementById('listing-reviews').textContent = `(${listing.reviews})`;
    document.getElementById('sidebar-rating').textContent = listing.rating;

    // 위치 설정
    document.getElementById('listing-location').textContent = listing.location;

    // 설명 설정
    document.getElementById('listing-description').textContent = listing.description;

    // 포인트 설정
    document.getElementById('listing-points').textContent = `${listing.points} P`;
    document.getElementById('summary-points').textContent = `${listing.points} 포인트`;
    document.getElementById('total-points').textContent = `${listing.points} P`;

    // 갤러리 이미지 설정
    const galleryMainImage = document.getElementById('gallery-main-image');
    galleryMainImage.src = listing.images[0];
    galleryMainImage.alt = listing.title;

    // 갤러리 점 생성
    const galleryDots = document.getElementById('gallery-dots');
    galleryDots.innerHTML = '';

    listing.images.forEach((image, index) => {
        const dot = document.createElement('span');
        dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('data-index', index);
        dot.addEventListener('click', function() {
            const imageIndex = parseInt(this.getAttribute('data-index'));
            updateGallery(imageIndex);
        });
        galleryDots.appendChild(dot);
    });

    // 호스트 정보 설정
    document.getElementById('host-name-title').textContent = `${listing.host.name}님이 호스팅하는 숙소`;
    document.getElementById('host-image').src = listing.host.image;
    document.getElementById('host-detail-name').textContent = listing.host.name;
    document.getElementById('host-joined').textContent = `${listing.host.joinedYear}년에 가입`;
    document.getElementById('host-reviews').textContent = `후기 ${listing.reviews}개`;
    document.getElementById('host-response-rate').textContent = `응답률: ${listing.host.responseRate}%`;

    // 슈퍼호스트 배지 설정
    const superhostBadge = document.getElementById('superhost-badge');
    if (listing.host.isSuperhost) {
        superhostBadge.classList.remove('hidden');
    } else {
        superhostBadge.classList.add('hidden');
    }

    // 특징 배지 설정
    const featuresContainer = document.getElementById('listing-features');
    featuresContainer.innerHTML = '';

    listing.features.forEach(feature => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-outline';
        badge.textContent = feature;
        featuresContainer.appendChild(badge);
    });

    // 편의시설 설정
    const amenitiesContainer = document.getElementById('amenities-container');
    amenitiesContainer.innerHTML = '';

    listing.amenities.forEach(amenity => {
        const amenityElement = document.createElement('div');
        amenityElement.className = 'amenity';
        amenityElement.innerHTML = `
            <i class="fas fa-check"></i>
            <span>${amenity}</span>
        `;
        amenitiesContainer.appendChild(amenityElement);
    });

    // LiveLocal 경험 설정
    const liveLocalContainer = document.getElementById('livelocal-container');
    if (listing.liveLocalExperiences && listing.liveLocalExperiences.length > 0) {
        liveLocalContainer.innerHTML = '<h4 class="booking-options-title">LiveLocal 경험</h4>';

        listing.liveLocalExperiences.forEach((exp, index) => {
            const option = document.createElement('div');
            option.className = 'booking-option';
            option.innerHTML = `
                <div class="booking-option-info">
                    <h5>${exp.title}</h5>
                    <p>${exp.description}</p>
                    <div class="booking-option-duration">소요 시간: ${exp.duration}시간</div>
                </div>
                <div class="booking-option-action">
                    <div class="booking-option-price">${exp.points} P</div>
                    <div class="booking-option-select">
                        <label class="radio-label">
                            <input type="radio" name="exp-${exp.id}" value="none" checked>
                            <span>선택 안함</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="exp-${exp.id}" value="select">
                            <span>선택</span>
                        </label>
                    </div>
                </div>
            `;
            liveLocalContainer.appendChild(option);
        });
    } else {
        liveLocalContainer.innerHTML = '<p>이용 가능한 LiveLocal 경험이 없습니다.</p>';
    }

    // TimeBank 서비스 설정
    const timeBankContainer = document.getElementById('timebank-container');
    if (listing.timeBankServices && listing.timeBankServices.length > 0) {
        timeBankContainer.innerHTML = '<h4 class="booking-options-title">TimeBank 서비스</h4>';

        listing.timeBankServices.forEach((service, index) => {
            const option = document.createElement('div');
            option.className = 'booking-option';
            option.innerHTML = `
                <div class="booking-option-info">
                    <h5>${service.title}</h5>
                    <p>${service.description}</p>
                    <div class="booking-option-duration">소요 시간: ${service.duration}시간</div>
                </div>
                <div class="booking-option-action">
                    <div class="booking-option-price">${service.points} P</div>
                    <div class="booking-option-select">
                        <label class="radio-label">
                            <input type="radio" name="service-${service.id}" value="none" checked>
                            <span>선택 안함</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="service-${service.id}" value="select">
                            <span>선택</span>
                        </label>
                    </div>
                </div>
            `;
            timeBankContainer.appendChild(option);
        });
    } else {
        timeBankContainer.innerHTML = '<p>이용 가능한 TimeBank 서비스가 없습니다.</p>';
    }

    // 갤러리 이미지 배열 저장
    window.galleryImages = listing.images;
    window.currentImageIndex = 0;
}

// 갤러리 이미지 업데이트
function updateGallery(index) {
    if (!window.galleryImages) return;

    const galleryMainImage = document.getElementById('gallery-main-image');
    const galleryDots = document.querySelectorAll('.gallery-dot');

    // 이미지 업데이트
    galleryMainImage.src = window.galleryImages[index];

    // 점 활성화 상태 업데이트
    galleryDots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });

    // 현재 이미지 인덱스 업데이트
    window.currentImageIndex = index;
}

// 갤러리 네비게이션
function navigateGallery(direction) {
    if (!window.galleryImages) return;

    const totalImages = window.galleryImages.length;
    let newIndex;

    if (direction === 'prev') {
        newIndex = (window.currentImageIndex - 1 + totalImages) % totalImages;
    } else {
        newIndex = (window.currentImageIndex + 1) % totalImages;
    }

    updateGallery(newIndex);
}

// 교환 요청 처리
function requestExchange(listingId) {
    // 로그인 상태 확인 (실제 구현 시)
    // const token = localStorage.getItem('token');
    // if (!token) {
    //     alert('로그인이 필요한 서비스입니다.');
    //     window.location.href = '/auth';
    //     return;
    // }

    // API 호출 (실제 구현 시)
    // fetch('/api/exchanges', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify({
    //         listingId: listingId,
    //         // 추가 정보 (날짜 등)
    //     })
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if (data.success) {
    //         alert('교환 요청이 성공적으로 전송되었습니다.');
    //         window.location.href = '/my/exchanges';
    //     } else {
    //         alert(data.message || '교환 요청에 실패했습니다.');
    //     }
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    //     alert('교환 요청 중 오류가 발생했습니다.');
    // });

    // 임시 구현 (API 연동 전)
    alert('교환 요청이 성공적으로 전송되었습니다.');
    window.location.href = '/page/exchanges';
}

// 옵션 적용 처리
function applyOptions() {
    // 선택된 옵션 확인
    const selectedOptions = [];

    // LiveLocal 경험 옵션
    document.querySelectorAll('input[name^="exp-"]:checked').forEach(input => {
        if (input.value === 'select') {
            const expId = input.name.split('-')[1];
            selectedOptions.push({
                type: 'experience',
                id: expId
            });
        }
    });

    // TimeBank 서비스 옵션
    document.querySelectorAll('input[name^="service-"]:checked').forEach(input => {
        if (input.value === 'select') {
            const serviceId = input.name.split('-')[1];
            selectedOptions.push({
                type: 'service',
                id: serviceId
            });
        }
    });

    // 선택된 옵션이 없는 경우
    if (selectedOptions.length === 0) {
        alert('선택된 옵션이 없습니다.');
        return;
    }

    // 옵션 적용 (실제 구현 시 API 호출)
    alert('선택한 옵션이 적용되었습니다.');

    // 첫 번째 탭으로 전환
    const bookingTabs = document.querySelectorAll('.booking-tab');
    const bookingTabPanes = document.querySelectorAll('.booking-tab-pane');

    bookingTabs.forEach(t => t.classList.remove('active'));
    bookingTabs[0].classList.add('active');

    bookingTabPanes.forEach(pane => pane.classList.remove('active'));
    bookingTabPanes[0].classList.add('active');
}