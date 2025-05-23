document.addEventListener('DOMContentLoaded', function() {
    console.log('listing-detail.js 로드됨');
    
    // 로딩 스피너 표시
    $('#loading-overlay').show();
    
    // 페이지 로드 시 URL에서 id 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const houseId = urlParams.get('id');
    
    console.log('URL 파라미터:', window.location.search);
    console.log('추출된 houseId:', houseId);

    // houseId가 있으면 API 호출
    if (houseId) {
        console.log('유효한 houseId가 있어 API 호출 시작');
        Promise.all([
            fetchHouseDetail(houseId),
            fetchHouseImages(houseId)
        ]).then(() => {
            // 모든 API 호출이 완료되면 로딩 스피너 숨기기
            $('#loading-overlay').hide();
            // 콘텐츠 표시
            $('.listing-detail-container').css('visibility', 'visible');
        }).catch(error => {
            console.error('API 호출 중 오류 발생:', error);
            $('#loading-overlay').hide();
            // 에러가 발생해도 콘텐츠는 표시
            $('.listing-detail-container').css('visibility', 'visible');
        });
    } else {
        console.error('houseId가 없어 API를 호출할 수 없습니다');
        alert('유효한 숙소 ID가 없습니다. URL에 ?id=숫자 형식으로 숙소 ID를 포함해주세요.');
        $('#loading-overlay').hide();
        // 에러가 발생해도 콘텐츠는 표시
        $('.listing-detail-container').css('visibility', 'visible');
    }

    // 탭 전환 기능
    $('.booking-tab').on('click', function() {
        const tabIndex = $(this).index();
        console.log('탭 클릭됨:', tabIndex);

        // 탭 활성화
        $('.booking-tab').removeClass('active');
        $(this).addClass('active');

        // 탭 내용 활성화
        $('.booking-tab-pane').removeClass('active');
        $('.booking-tab-pane').eq(tabIndex).addClass('active');
    });

    // 갤러리 기능
    // 기본 이미지 배열 (API에서 이미지를 가져오기 전에 사용될 기본 이미지)
    let images = [
        '/images/listing-detail-1.jpg',
        '/images/listing-detail-2.jpg',
        '/images/listing-detail-3.jpg',
        '/images/listing-detail-4.jpg',
        '/images/listing-detail-5.jpg'
    ];

    let currentImageIndex = 0;

    // 갤러리 도트 생성
    function createGalleryDots() {
        const dotsContainer = $('#gallery-dots');
        dotsContainer.empty();

        images.forEach((_, index) => {
            const dot = $('<div>').addClass('gallery-dot');
            if (index === currentImageIndex) {
                dot.addClass('active');
            }

            dot.on('click', function() {
                showImage(index);
            });

            dotsContainer.append(dot);
        });
    }

    // 이미지 표시
    function showImage(index) {
        if (index < 0) {
            index = images.length - 1;
        } else if (index >= images.length) {
            index = 0;
        }

        currentImageIndex = index;
        $('#gallery-main-image').attr('src', images[index]);

        // 도트 활성화 상태 업데이트
        $('.gallery-dot').removeClass('active');
        $('.gallery-dot').eq(index).addClass('active');
    }

    // 이전 이미지 버튼
    $('.gallery-prev').on('click', function() {
        showImage(currentImageIndex - 1);
    });

    // 다음 이미지 버튼
    $('.gallery-next').on('click', function() {
        showImage(currentImageIndex + 1);
    });

    // 초기 갤러리 도트 생성
    createGalleryDots();

    // 공유 버튼 클릭 이벤트
    $('.share-btn').on('click', function() {
        // 실제 구현에서는 공유 기능 추가
        alert('공유 기능은 준비 중입니다.');
    });

    // 저장 버튼 클릭 이벤트
    $('.save-btn').on('click', function() {
        const $icon = $(this).find('i');

        if ($icon.hasClass('far')) {
            // 저장 안된 상태 -> 저장
            $icon.removeClass('far').addClass('fas');
            alert('숙소가 저장되었습니다.');
        } else {
            // 저장된 상태 -> 저장 취소
            $icon.removeClass('fas').addClass('far');
            alert('숙소 저장이 취소되었습니다.');
        }
    });

    // 옵션 적용 버튼 클릭 이벤트
    $('#options-apply-btn').on('click', function() {
        let totalPoints = parseInt($('#listing-points').text());
        let liveLocalPoints = 0;
        let timeBankPoints = 0;

        // LiveLocal 선택 확인
        const selectedLiveLocal = $('input[name="livelocal"]:checked').val();
        if (selectedLiveLocal) {
            const experience = liveLocalExperiences.find(exp => exp.id === parseInt(selectedLiveLocal));
            if (experience) {
                liveLocalPoints = experience.points;
            }
        }

        // TimeBank 선택 확인
        const selectedTimeBank = $('input[name="timebank"]:checked').val();
        if (selectedTimeBank) {
            const service = timeBankServices.find(s => s.id === parseInt(selectedTimeBank));
            if (service) {
                timeBankPoints = service.points;
            }
        }

        // 요약 업데이트
        $('#livelocal-points').text(`${liveLocalPoints} P`);
        $('#timebank-points').text(`${timeBankPoints} P`);

        // 총 포인트 계산
        const total = totalPoints + liveLocalPoints + timeBankPoints;
        $('#total-points').text(`${total} P`);

        alert('옵션이 적용되었습니다.');
    });

    // 토큰 체크 함수
    function checkAuthToken() {
        if (!window.auth?.accessToken) {
            alert('로그인이 필요한 서비스입니다.');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            return false;
        }
        return true;
    }

    // 내 숙소 목록을 가져오는 API 호출 함수
    function fetchMyListings() {
        if (!checkAuthToken()) return Promise.reject('No token');

        console.log('현재 window.auth 상태:', window.auth);
        console.log('사용할 accessToken:', window.auth.accessToken);

        return $.ajax({
            url: '/api/house/my',
            type: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + window.auth.accessToken
            },
            success: function(response) {
                console.log('내 숙소 목록 API 응답:', response);
                if (response.httpStatus === 'OK' && response.data) {
                    const myListings = response.data.content; // Page 객체에서 content 추출
                    renderMyListings(myListings);
                } else {
                    console.error('API 응답이 올바르지 않습니다:', response);
                    $('.my-listings-container').html('<p class="p-4 text-center">숙소 목록을 불러오는데 실패했습니다.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('내 숙소 목록 API 호출 실패:', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                $('.my-listings-container').html('<p class="p-4 text-center">숙소 목록을 불러오는데 실패했습니다.</p>');
            }
        });
    }

    // 내 숙소 목록 렌더링
    function renderMyListings(myListings) {
        console.log('렌더링할 숙소 목록:', myListings);
        const container = $('.my-listings-container');
        container.empty();

        if (!myListings || myListings.length === 0) {
            container.html('<p class="p-4 text-center">등록된 숙소가 없습니다.</p>');
            return;
        }

        myListings.forEach(listing => {
            console.log('숙소 데이터:', listing);
            const item = $('<div>').addClass('my-listing-item').attr('data-id', listing.id);
            item.html(`
                <div class="my-listing-image">
                    <img src="${listing.thumbnailUrl || '/images/default-house.jpg'}" alt="${listing.title}">
                </div>
                <div class="my-listing-info">
                    <div class="my-listing-title">${listing.title}</div>
                    <div class="my-listing-rating">
                        <span class="rating">★ ${listing.averageRating.toFixed(1)}</span>
                        <span class="review-count">(${listing.reviewCount})</span>
                    </div>
                </div>
            `);

            // 숙소 선택 이벤트
            item.on('click', function() {
                $('.my-listing-item').removeClass('selected');
                $(this).addClass('selected');
            });

            container.append(item);
        });
    }

    // 팝업 열기 함수
    function openPopup(popupId) {
        $(`#${popupId}`).css('display', 'flex');
        $('body').css('overflow', 'hidden');
    }

    // 팝업 닫기 함수
    function closePopup(popupId) {
        $(`#${popupId}`).css('display', 'none');
        $('body').css('overflow', 'auto');
    }

    // 교환 요청 버튼 클릭 이벤트
    $('#exchange-request-btn').on('click', function() {
        console.log('교환 요청 버튼 클릭됨');
        
        if (!checkAuthToken()) {
            console.log('인증 토큰 없음');
            return;
        }

        // 체크인/체크아웃 날짜 확인
        const checkinDate = $('#checkin-date').val();
        const checkoutDate = $('#checkout-date').val();
        const guestCount = $('#guest-count').val();

        console.log('날짜 정보:', { checkinDate, checkoutDate, guestCount });

        if (!checkinDate || !checkoutDate) {
            alert('체크인/체크아웃 날짜를 선택해주세요.');
            return;
        }

        // 날짜 형식 변환
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        };

        // 팝업 내용 업데이트
        $('#popup-checkin').text(formatDate(checkinDate));
        $('#popup-checkout').text(formatDate(checkoutDate));
        $('#popup-guests').text(guestCount);

        console.log('내 숙소 목록 가져오기 시작');
        // 내 숙소 목록 렌더링
        fetchMyListings().then(function() {
            console.log('내 숙소 목록 가져오기 완료');
            // 팝업 열기
            openPopup('exchange-popup');
        }).fail(function(error) {
            console.error('내 숙소 목록 가져오기 실패:', error);
            alert('내 숙소 목록을 불러오는데 실패했습니다.');
        });
    });

    // 숙박 요청 버튼 클릭 이벤트
    $('#stay-request-btn').on('click', function() {
        if (!checkAuthToken()) return;

        // 체크인/체크아웃 날짜 확인
        const checkinDate = $('#checkin-date').val();
        const checkoutDate = $('#checkout-date').val();
        const guestCount = $('#guest-count').val();

        if (!checkinDate || !checkoutDate) {
            alert('체크인/체크아웃 날짜를 선택해주세요.');
            return;
        }

        // 날짜 형식 변환
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
        };

        // 팝업 내용 업데이트
        $('#stay-listing-title').text($('#listing-title').text());
        $('#stay-checkin').text(formatDate(checkinDate));
        $('#stay-checkout').text(formatDate(checkoutDate));
        $('#stay-guests').text(guestCount);
        $('#stay-points').text($('#total-points').text());

        // 팝업 열기
        openPopup('stay-popup');
    });

    // 팝업 닫기 버튼 클릭 이벤트
    $('.popup-close, .popup-cancel').on('click', function() {
        const popupId = $(this).closest('.popup-overlay').attr('id');
        closePopup(popupId);
    });

    // 교환 요청 API 호출 함수
    function requestSwapExchange(listingId, checkinDate, checkoutDate, guestCount, message) {
        if (!checkAuthToken()) return Promise.reject('No token');

        return $.ajax({
            url: '/api/house/swap',
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + window.auth.accessToken
            },
            data: JSON.stringify({
                requesterHouseId: listingId,
                targetHouseId: houseId,
                startDate: checkinDate,
                endDate: checkoutDate,
                guest: parseInt(guestCount),
                message: message
            })
        });
    }

    // 숙박 요청 API 호출 함수
    function requestStay(checkinDate, checkoutDate, guestCount, totalPoints, message) {
        if (!checkAuthToken()) return Promise.reject('No token');

        return $.ajax({
            url: '/api/house/stay',
            type: 'POST',
            contentType: 'application/json',
            headers: {
                'Authorization': 'Bearer ' + window.auth.accessToken
            },
            data: JSON.stringify({
                targetHouseId: houseId,
                startDate: checkinDate,
                endDate: checkoutDate,
                guest: parseInt(guestCount),
                message: message
            })
        });
    }

    // 교환 요청 확인 버튼 클릭 이벤트
    $('#exchange-confirm').on('click', function() {
        const selectedListing = $('.my-listing-item.selected');

        if (selectedListing.length === 0) {
            alert('교환할 숙소를 선택해주세요.');
            return;
        }

        const listingId = selectedListing.data('id');
        const message = $('#exchange-message-text').val();

        // API 호출
        requestSwapExchange(
            listingId,
            $('#checkin-date').val(),
            $('#checkout-date').val(),
            $('#guest-count').val(),
            message
        ).then(function(response) {
            if (response.httpStatus === 'OK') {
                // 팝업 닫기
                closePopup('exchange-popup');
                // 성공 메시지
                alert('교환 요청이 성공적으로 전송되었습니다.');
            } else {
                alert('교환 요청 전송에 실패했습니다: ' + response.message);
            }
        }).fail(function(xhr, status, error) {
            console.error('교환 요청 API 호출 실패:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        });
    });

    // 숙박 요청 확인 버튼 클릭 이벤트
    $('#stay-confirm').on('click', function() {
        const message = $('#stay-message-text').val();

        // API 호출
        requestStay(
            $('#checkin-date').val(),
            $('#checkout-date').val(),
            $('#guest-count').val(),
            $('#total-points').text(),
            message
        ).then(function(response) {
            if (response.httpStatus === 'OK') {
                // 팝업 닫기
                closePopup('stay-popup');
                // 성공 메시지
                alert('숙박 요청이 성공적으로 전송되었습니다.');
            } else {
                alert('숙박 요청 전송에 실패했습니다: ' + response.message);
            }
        }).fail(function(xhr, status, error) {
            console.error('숙박 요청 API 호출 실패:', error);
            alert('서버 연결에 문제가 발생했습니다.');
        });
    });

    // API로 숙소 상세 정보 가져오기
    function fetchHouseDetail(houseId) {
        console.log('API 호출 시작: houseId =', houseId);
        
        return $.ajax({
            url: `/api/house/${houseId}`,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                console.log('API 응답 성공:', response);
                
                if (response.httpStatus === 'OK') {
                    console.log('숙소 데이터:', response.data);
                    updateHouseDetailUI(response.data);
                    
                    // 호스트 정보 API 호출
                    return fetchHostDetail(houseId);
                } else {
                    console.error('API 요청 실패:', response.message);
                    alert('숙소 정보를 불러오는 데 실패했습니다.');
                }
            },
            error: function(xhr, status, error) {
                console.error('API 호출 오류:', error);
                console.error('상태 코드:', xhr.status);
                console.error('응답 텍스트:', xhr.responseText);
                alert('서버 연결에 문제가 발생했습니다.');
            }
        });
    }

    // 호스트 상세 정보 API 호출 함수
    function fetchHostDetail(houseId) {
        console.log('호스트 정보 API 호출 시작: houseId =', houseId);
        
        $.ajax({
            url: `/api/house/${houseId}/host`,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                console.log('호스트 API 응답 성공:', response);
                
                if (response.httpStatus === 'OK') {
                    console.log('호스트 데이터:', response.data);
                    updateHostDetailUI(response.data);
                } else {
                    console.error('호스트 API 요청 실패:', response.message);
                    console.log('호스트 정보를 불러오는 데 실패했습니다.');
                }
            },
            error: function(xhr, status, error) {
                console.error('호스트 API 호출 오류:', error);
                console.error('상태 코드:', xhr.status);
                console.error('응답 텍스트:', xhr.responseText);
                console.log('호스트 정보를 불러오는 데 실패했습니다.');
            }
        });
    }

    // 호스트 상세 정보 UI 업데이트 함수
    function updateHostDetailUI(hostData) {
        console.log('호스트 UI 업데이트 시작:', hostData);
        try {
            // 호스트 이름 업데이트
            if (hostData.hostName) {
                $('#host-name-title').text(`${hostData.hostName}님이 호스팅하는 숙소`);
                $('#host-name').text(hostData.hostName);
            }
            
            // 호스트 프로필 이미지 업데이트
            if (hostData.profile) {
                $('#host-profile-image').attr('src', hostData.profile);
            }
            
            // 호스트 정보 섹션 초기화 및 업데이트
            const hostInfoSection = $('#host-info-section');
            hostInfoSection.empty();
            
            // 가입 년도 추가
            if (hostData.joinedAt) {
                hostInfoSection.append(`<span id="host-joined">${hostData.joinedAt}년에 가입</span>`);
            }
            
            // 리뷰 수 추가
            if (hostData.reviewCount !== undefined) {
                hostInfoSection.append(`<span id="host-reviews">후기 ${hostData.reviewCount}개</span>`);
            }
            
            // 평점 추가
            if (hostData.avgRating !== undefined) {
                hostInfoSection.append(`<span id="host-rating">총 평점: ${hostData.avgRating.toFixed(1)}</span>`);
            }
            
            console.log('호스트 UI 업데이트 완료');
        } catch (e) {
            console.error('호스트 UI 업데이트 중 오류 발생:', e);
        }
    }

    // 숙소 상세 정보로 UI 업데이트
    function updateHouseDetailUI(houseData) {
        console.log('UI 업데이트 시작:', houseData);
        try {
            // 제목 및 기본 정보 업데이트
            if (houseData.title) {
                console.log('제목 업데이트:', houseData.title);
                $('#listing-title').text(houseData.title);
            }
            
            if (houseData.description) {
                $('#listing-description').text(houseData.description);
            }
            
            if (houseData.city && houseData.district) {
                $('#listing-location').text(`${houseData.city} ${houseData.district}`);
            }

            // 평점 및 리뷰 업데이트
            if (houseData.avgRating !== undefined) {
                const rating = houseData.avgRating.toFixed(1);
                console.log('평점 업데이트:', rating);
                $('#listing-rating, #sidebar-rating').text(rating);
            }
            
            if (houseData.reviewCount !== undefined) {
                $('#listing-reviews').text(`(${houseData.reviewCount})`);
                $('#sidebar-review-count').text(houseData.reviewCount);
            }

            // 편의시설 업데이트
            if (houseData.amenityInfo) {
                console.log('편의시설 업데이트');
                updateAmenities(houseData.amenityInfo);
            } else {
                console.warn('편의시설 정보가 없습니다');
            }

            // 특징 배지 업데이트
            console.log('특징 배지 업데이트');
            updateFeatureBadges(houseData);

            // 호스트 정보 업데이트 - 호스트 상세 정보는 별도 API 호출 필요할 수 있음
            if (houseData.hostId) {
                $('#host-name-title').text(`호스트 ID ${houseData.hostId}님이 호스팅하는 숙소`);
            }

            // 숙소 규칙 정보 추가 (HTML에 해당 요소가 있는 경우)
            if (houseData.rule && $('#listing-rules').length) {
                $('#listing-rules').text(houseData.rule);
            }

            console.log('UI 업데이트 완료');
        } catch (e) {
            console.error('UI 업데이트 중 오류 발생:', e);
        }
    }

    // 편의시설 UI 업데이트
    function updateAmenities(amenityInfo) {
        try {
            console.log('편의시설 업데이트 시작:', amenityInfo);
            const amenitiesContainer = $('#amenities-container');
            
            if (!amenitiesContainer.length) {
                console.warn('amenities-container 요소를 찾을 수 없습니다');
                return;
            }
            
            amenitiesContainer.empty();

            if (!amenityInfo) {
                console.warn('편의시설 정보가 없습니다');
                return;
            }

            // 편의시설 매핑 객체 - API 필드명과, 화면에 표시할 텍스트
            const amenitiesMap = {
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
                hasElevator: '엘리베이터'
            };

            let addedCount = 0;
            // 활성화된 편의시설만 표시
            for (const [key, value] of Object.entries(amenitiesMap)) {
                if (amenityInfo[key]) {
                    const amenityElement = $('<div>').addClass('amenity');
                    amenityElement.html(`
                        <i class="fas fa-check"></i>
                        <span>${value}</span>
                    `);
                    amenitiesContainer.append(amenityElement);
                    addedCount++;
                }
            }
            console.log(`기본 편의시설 ${addedCount}개 추가됨`);

            // 기타 편의시설이 있으면 추가
            if (amenityInfo.otherAmenities) {
                const otherAmenities = amenityInfo.otherAmenities.split(',');
                otherAmenities.forEach(amenity => {
                    const trimmedAmenity = amenity.trim();
                    if (trimmedAmenity) {
                        const amenityElement = $('<div>').addClass('amenity');
                        amenityElement.html(`
                            <i class="fas fa-check"></i>
                            <span>${trimmedAmenity}</span>
                        `);
                        amenitiesContainer.append(amenityElement);
                    }
                });
                console.log(`기타 편의시설 ${otherAmenities.length}개 추가됨`);
            }

            // 기타 특징이 있으면 추가
            if (amenityInfo.otherFeatures) {
                const otherFeatures = amenityInfo.otherFeatures.split(',');
                otherFeatures.forEach(feature => {
                    const trimmedFeature = feature.trim();
                    if (trimmedFeature) {
                        const featureElement = $('<div>').addClass('amenity');
                        featureElement.html(`
                            <i class="fas fa-check"></i>
                            <span>${trimmedFeature}</span>
                        `);
                        amenitiesContainer.append(featureElement);
                    }
                });
                console.log(`기타 특징 ${otherFeatures.length}개 추가됨`);
            }
            
            console.log('편의시설 업데이트 완료');
        } catch (e) {
            console.error('편의시설 업데이트 중 오류 발생:', e);
        }
    }

    // 특징 배지 업데이트
    function updateFeatureBadges(houseData) {
        try {
            console.log('배지 업데이트 시작');
            const featuresContainer = $('#listing-features');
            if (!featuresContainer.length) {
                console.warn('listing-features 요소를 찾을 수 없습니다');
                return;
            }
            
            featuresContainer.empty();

            // 반려동물 허용 여부에 따라 배지 추가
            if (houseData.petsAllowed) {
                console.log('반려동물 동반 가능 배지 추가');
                featuresContainer.append('<span class="badge badge-outline">반려동물 동반 가능</span>');
            }

            // 무료 주차 여부에 따라 배지 추가
            if (houseData.amenityInfo && houseData.amenityInfo.hasFreeParking) {
                console.log('무료 주차 배지 추가');
                featuresContainer.append('<span class="badge badge-outline">무료 주차</span>');
            }

            // 기본 배지 추가 (LiveLocal)
            featuresContainer.append('<span class="badge badge-outline">LiveLocal</span>');

            // 숙소 유형 배지 추가
            if (houseData.houseType) {
                let houseTypeText = houseData.houseType;
                // 숙소 유형 매핑 (필요에 따라 조정)
                const houseTypeMap = {
                    'APT': '아파트',
                    'HOUSE': '단독주택',
                    'VILLA': '빌라',
                    'PENSION': '펜션',
                    'HOTEL': '호텔'
                };

                if (houseTypeMap[houseData.houseType]) {
                    houseTypeText = houseTypeMap[houseData.houseType];
                }

                console.log('숙소 유형 배지 추가:', houseTypeText);
                featuresContainer.append(`<span class="badge badge-outline">${houseTypeText}</span>`);
            }

            // 침실, 침대, 욕실 정보 배지 추가
            if (houseData.bedrooms !== undefined) {
                featuresContainer.append(`<span class="badge badge-outline">침실 ${houseData.bedrooms}개</span>`);
            }
            
            if (houseData.bed !== undefined) {
                featuresContainer.append(`<span class="badge badge-outline">침대 ${houseData.bed}개</span>`);
            }
            
            if (houseData.bathrooms !== undefined) {
                featuresContainer.append(`<span class="badge badge-outline">욕실 ${houseData.bathrooms}개</span>`);
            }
            
            if (houseData.maxGuests !== undefined) {
                featuresContainer.append(`<span class="badge badge-outline">최대 ${houseData.maxGuests}명</span>`);
            }

            // 크기 정보가 있으면 추가
            if (houseData.size) {
                featuresContainer.append(`<span class="badge badge-outline">${houseData.size}평</span>`);
            }
            
            console.log('배지 업데이트 완료');
        } catch (e) {
            console.error('배지 업데이트 중 오류 발생:', e);
        }
    }

    // 숙소 이미지 API 호출 함수
    function fetchHouseImages(houseId) {
        console.log('숙소 이미지 API 호출 시작: houseId =', houseId);
        
        $.ajax({
            url: `/api/house/${houseId}/images`,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                console.log('이미지 API 응답 성공:', response);
                
                if (response.httpStatus === 'OK' && response.data && response.data.length > 0) {
                    console.log('이미지 데이터:', response.data);
                    
                    // 이미지 URL 배열 추출
                    const apiImages = response.data.map(image => image.imageUrl);
                    console.log('추출된 이미지 URL:', apiImages);
                    
                    if (apiImages.length > 0) {
                        // API에서 가져온 이미지로 갤러리 업데이트
                        images = apiImages;
                        currentImageIndex = 0;
                        
                        // 첫 번째 이미지 표시
                        $('#gallery-main-image').attr('src', images[0]);
                        
                        // 도트 갱신
                        createGalleryDots();
                        
                        console.log('갤러리 이미지 업데이트 완료');
                    }
                } else {
                    console.log('이미지가 없거나 응답이 비어있습니다. 기본 이미지를 사용합니다.');
                }
            },
            error: function(xhr, status, error) {
                console.error('이미지 API 호출 오류:', error);
                console.error('상태 코드:', xhr.status);
                console.error('응답 텍스트:', xhr.responseText);
                console.log('기본 이미지를 사용합니다.');
            }
        });
    }
});