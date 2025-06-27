document.addEventListener('DOMContentLoaded', function() {
    console.log('listing-detail.js 로드됨');
    
    // Google Maps API 로딩 상태 확인
    function checkGoogleMapsAPI() {
        console.log('🔍 Google Maps API 상태 확인 중...');
        
        if (typeof google === 'undefined') {
            console.error('❌ Google Maps API가 로드되지 않았습니다.');
            return false;
        }
        
        if (!google.maps) {
            console.error('❌ google.maps 객체가 없습니다.');
            return false;
        }
        
        if (!google.maps.Map) {
            console.error('❌ google.maps.Map이 없습니다.');
            return false;
        }
        
        console.log('✅ Google Maps API 로딩 완료!');
        return true;
    }
    
    // Google Maps API 로딩 대기 함수
    function waitForGoogleMapsAPI(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkInterval = setInterval(() => {
            attempts++;
            console.log(`🔄 Google Maps API 로딩 확인 시도 ${attempts}/${maxAttempts}`);
            
            if (checkGoogleMapsAPI()) {
                clearInterval(checkInterval);
                console.log('🎉 Google Maps API 로딩 완료! 콜백 실행');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Google Maps API 로딩 시간 초과');
                // API 로딩에 실패해도 주소 정보는 표시
                if (window.pendingMapData) {
                    const { latitude, longitude, address } = window.pendingMapData;
                    const mapElement = document.getElementById('listing-map');
                    if (mapElement) {
                        mapElement.innerHTML = `
                            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; font-size: 14px;">
                                <div>
                                    <i class="fas fa-map-marker-alt" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                                    Google Maps API 로딩에 실패했습니다.<br>
                                    페이지를 새로고침해보세요.
                                </div>
                            </div>
                        `;
                    }
                    
                    const addressElement = document.getElementById('location-address');
                    if (addressElement) {
                        addressElement.textContent = address || '위치 정보를 불러올 수 없습니다.';
                    }
                }
            }
        }, 100); // 100ms마다 확인
    }
    
    // 로딩 스피너 표시
    $('#loading-overlay').show();
    
    // 지도 관련 전역 변수
    let map = null;
    let marker = null;
    let rectangle = null;
    
    // 대기 중인 지도 데이터 저장용
    window.pendingMapData = null;
    
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
                
                try {
                    // 서버에서 반환된 JSON 에러 메시지 파싱
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse && errorResponse.errorMessage) {
                        alert(errorResponse.errorMessage);
                        // 존재하지 않는 숙소인 경우 메인 페이지로 리디렉션
                        if (errorResponse.errorCode === "NOT_EXISTS_HOUSE") {
                            setTimeout(function() {
                                window.location.href = "/";
                            }, 1000);
                        }
                        return;
                    }
                } catch (e) {
                    console.error('에러 응답 파싱 실패:', e);
                }
                
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
                
                try {
                    // 서버에서 반환된 JSON 에러 메시지 파싱
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse && errorResponse.errorMessage) {
                        console.log('호스트 정보 에러:', errorResponse.errorMessage);
                        return;
                    }
                } catch (e) {
                    console.error('에러 응답 파싱 실패:', e);
                }
                
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

            // 지도 초기화 (Google Maps API 로딩 대기)
            if (houseData.latitude && houseData.longitude) {
                console.log('위도/경도 정보 있음. Google Maps API 로딩 대기 후 지도 초기화:', houseData.latitude, houseData.longitude);
                
                // 지도 데이터 저장
                window.pendingMapData = {
                    latitude: houseData.latitude,
                    longitude: houseData.longitude,
                    address: houseData.address
                };
                
                                  // Google Maps API 로딩을 기다린 후 지도 초기화
                  const viewportData = {
                      northeastLat: houseData.viewportNortheastLat,
                      northeastLng: houseData.viewportNortheastLng,
                      southwestLat: houseData.viewportSouthwestLat,
                      southwestLng: houseData.viewportSouthwestLng
                  };
                  
                  waitForGoogleMapsAPI(() => {
                      initializeMap(houseData.latitude, houseData.longitude, houseData.address, viewportData);
                  });
                
            } else {
                console.warn('위도/경도 정보가 없어 지도를 표시할 수 없습니다.');
                console.log('🔍 houseData.latitude:', houseData.latitude);
                console.log('🔍 houseData.longitude:', houseData.longitude);
                console.log('🔍 전체 houseData:', houseData);
                
                // 위도/경도가 없어도 주소가 있으면 Geocoding API로 좌표를 찾아서 지도 표시
                if (houseData.address && houseData.address.trim() !== '') {
                    console.log('📍 주소 기반으로 지도 표시 시도:', houseData.address);
                    
                    // 지도 데이터 저장
                    window.pendingMapData = {
                        latitude: null,
                        longitude: null,
                        address: houseData.address
                    };
                    
                    // Google Maps API 로딩을 기다린 후 주소 기반 지도 표시
                    waitForGoogleMapsAPI(() => {
                        geocodeAndShowMap(houseData.address);
                    });
                    
                } else {
                    // 주소도 없으면 지도 섹션 숨기기
                    document.getElementById('location-address').textContent = houseData.address || '위치 정보를 불러올 수 없습니다.';
                    const mapContainer = document.querySelector('.location-section');
                    if (mapContainer) {
                        mapContainer.style.display = 'none';
                    }
                }
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

    // 주소를 이용해서 지도 표시하는 함수
    function geocodeAndShowMap(address) {
        console.log('🔍 주소로 지도 찾기 시작:', address);
        
        // Google Maps API 상태 확인
        if (!checkGoogleMapsAPI()) {
            console.error('❌ Google Maps API를 사용할 수 없어 주소 기반 지도 표시를 중단합니다.');
            
            // 주소 정보만 표시
            document.getElementById('location-address').textContent = address;
            
            // 지도 영역에 메시지 표시
            const mapElement = document.getElementById('listing-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; font-size: 14px;">
                        <div>
                            <i class="fas fa-map-marker-alt" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            Google Maps API를 사용할 수 없습니다.
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        // DOM 요소 확인
        const mapElement = document.getElementById('listing-map');
        if (!mapElement) {
            console.error('❌ 지도 DOM 요소를 찾을 수 없습니다.');
            return;
        }
        
        try {
            // Geocoding API를 사용해서 주소를 좌표로 변환
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                address: address,
                componentRestrictions: { country: 'KR' } // 한국 내에서만 검색
            }, (results, status) => {
                console.log('📡 주소 기반 Geocoding API 응답:', status, results);
                
                if (status === 'OK' && results[0] && results[0].geometry) {
                    const location = results[0].geometry.location;
                    const lat = location.lat();
                    const lng = location.lng();
                    
                    console.log('✅ 주소에서 좌표 추출 성공:', { lat, lng });
                    
                    // 추출된 좌표로 지도 표시
                    initializeMap(lat, lng, address, results[0].geometry.viewport);
                    
                } else {
                    console.error('❌ 주소에서 좌표 추출 실패:', status);
                    
                    // Geocoding 실패 시 기본 지도 표시
                    console.log('📍 기본 지도 표시 (서울 시청)');
                    const defaultLocation = { lat: 37.5665, lng: 126.9780 };
                    
                    map = new google.maps.Map(mapElement, {
                        center: defaultLocation,
                        zoom: 10,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true
                    });
                    
                    // 주소 정보 표시
                    document.getElementById('location-address').textContent = address;
                    
                    // 정보창으로 메시지 표시
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; text-align: center;">
                                <strong>${address}</strong><br>
                                <small>정확한 위치를 찾을 수 없어 기본 지도를 표시합니다.</small>
                            </div>
                        `,
                        position: defaultLocation
                    });
                    infoWindow.open(map);
                }
            });
            
        } catch (error) {
            console.error('❌ 주소 기반 지도 표시 실패:', error);
            
            // 오류 시 메시지 표시
            const mapElement = document.getElementById('listing-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ffe6e6; color: #d00; text-align: center; font-size: 14px; border: 1px solid #ffb3b3;">
                        <div>
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            주소 기반 지도 표시 중 오류가 발생했습니다.<br>
                            오류: ${error.message}
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('location-address').textContent = address || '지도를 불러올 수 없습니다.';
        }
    }

    // 악의적 새로고침 방지를 위한 보호 장치
    function checkRefreshLimit() {
        const now = Date.now();
        const timeWindow = 60 * 1000; // 1분
        const maxRefreshes = 10; // 1분에 최대 10회
        
        try {
            // 새로고침 기록 가져오기
            const refreshKey = 'mapRefreshLog';
            const refreshLog = JSON.parse(sessionStorage.getItem(refreshKey) || '[]');
            
            // 1분 이내의 기록만 유지
            const recentRefreshes = refreshLog.filter(timestamp => now - timestamp < timeWindow);
            
            // 현재 새로고침 추가
            recentRefreshes.push(now);
            
            // 기록 저장
            sessionStorage.setItem(refreshKey, JSON.stringify(recentRefreshes));
            
            // 제한 확인
            if (recentRefreshes.length > maxRefreshes) {
                console.warn('⚠️ 과도한 새로고침 감지:', recentRefreshes.length, '회/분');
                return {
                    blocked: true,
                    count: recentRefreshes.length,
                    remaining: Math.ceil((recentRefreshes[0] + timeWindow - now) / 1000)
                };
            }
            
            return {
                blocked: false,
                count: recentRefreshes.length
            };
            
        } catch (e) {
            console.warn('새로고침 체크 실패:', e);
            return { blocked: false, count: 1 };
        }
    }
    
    // 세션 스토리지 캐싱을 위한 헬퍼 함수들
    function getSessionCache(key) {
        try {
            const cached = sessionStorage.getItem(`mapCache_${key}`);
            if (cached) {
                const data = JSON.parse(cached);
                // 30분 이내의 캐시만 유효
                if (Date.now() - data.timestamp < 30 * 60 * 1000) {
                    return data;
                }
                // 만료된 캐시 삭제
                sessionStorage.removeItem(`mapCache_${key}`);
            }
        } catch (e) {
            console.warn('세션 캐시 읽기 실패:', e);
        }
        return null;
    }
    
    function setSessionCache(key, data) {
        try {
            const cacheData = {
                ...data,
                timestamp: Date.now()
            };
            sessionStorage.setItem(`mapCache_${key}`, JSON.stringify(cacheData));
            console.log('💾 세션 스토리지에 지도 설정 저장:', key);
        } catch (e) {
            console.warn('세션 캐시 저장 실패:', e);
        }
    }
    
    // 지도 초기화 함수
    function initializeMap(latitude, longitude, address, viewportData) {
        console.log('🗺️ 지도 초기화 시작:', { latitude, longitude, address, viewportData });
        
        // 악의적 새로고침 체크
        const refreshCheck = checkRefreshLimit();
        if (refreshCheck.blocked) {
            console.error('🚫 과도한 새로고침으로 인한 지도 로딩 차단');
            console.log(`⏰ ${refreshCheck.remaining}초 후 다시 시도 가능`);
            
            // 차단 메시지 표시
            const mapElement = document.getElementById('listing-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #fff3cd; color: #856404; text-align: center; font-size: 14px; border: 1px solid #ffeaa7;">
                        <div>
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            <strong>과도한 새로고침이 감지되었습니다.</strong><br>
                            잠시 후 다시 시도해주세요.<br>
                            <small>(${refreshCheck.remaining}초 후 재시도 가능)</small>
                        </div>
                    </div>
                `;
            }
            
            // 주소 정보는 표시
            if (address) {
                document.getElementById('location-address').textContent = address;
            }
            
            // 자동 재시도 (제한 시간 후)
            setTimeout(() => {
                console.log('🔄 자동 재시도...');
                initializeMap(latitude, longitude, address, viewportData);
            }, refreshCheck.remaining * 1000);
            
            return;
        }
        
        // 새로고침 횟수 로깅
        if (refreshCheck.count > 3) {
            console.warn(`⚠️ 빈번한 새로고침: ${refreshCheck.count}회/분`);
        }
        
        // 캐시 키 생성 (숙소 ID 기반)
        const urlParams = new URLSearchParams(window.location.search);
        const houseId = urlParams.get('houseId') || window.location.pathname.split('/').pop();
        const cacheKey = `house_${houseId}_${latitude}_${longitude}`;
        
        // 세션 캐시 확인 (설정값만 캐시)
        const cachedData = getSessionCache(cacheKey);
        if (cachedData) {
            console.log('♻️ 세션 스토리지에서 지도 설정 재사용:', cacheKey);
            console.log('⏰ 캐시 생성 시간:', new Date(cachedData.timestamp).toLocaleString());
        }
        
        // 일단 주소 정보부터 표시
        if (address) {
            document.getElementById('location-address').textContent = address;
        }
        
        // Google Maps API 상태 확인
        if (!checkGoogleMapsAPI()) {
            console.error('❌ Google Maps API를 사용할 수 없어 지도 초기화를 중단합니다.');
            
            // Google Maps API가 없는 경우 대체 메시지 표시
            const mapElement = document.getElementById('listing-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; font-size: 14px;">
                        <div>
                            <i class="fas fa-map-marker-alt" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            지도를 불러올 수 없습니다.<br>
                            Google Maps API 로딩을 확인해주세요.
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('location-address').textContent = address || '지도를 불러올 수 없습니다.';
            return;
        }
        
        // DOM 요소 확인
        const mapElement = document.getElementById('listing-map');
        if (!mapElement) {
            console.error('❌ 지도 DOM 요소를 찾을 수 없습니다. (id: listing-map)');
            return;
        }
        
        console.log('✅ 지도 DOM 요소 확인:', mapElement);
        console.log('🎯 지도 요소 크기:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
        
        // 지도 요소가 화면에 보이는지 확인
        if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
            console.warn('⚠️ 지도 요소가 화면에 보이지 않습니다. 잠시 후 다시 시도합니다.');
            
            // 100ms 후 다시 시도
            setTimeout(() => {
                console.log('🔄 지도 초기화 재시도...');
                initializeMap(latitude, longitude, address, viewportData);
            }, 100);
            return;
        }
        
        try {
            // 위도/경도 유효성 확인
            if (!latitude || !longitude || latitude === 0 || longitude === 0) {
                console.error('❌ 유효하지 않은 위도/경도:', { latitude, longitude });
                
                // 기본 지도라도 표시
                console.log('📍 기본 위치로 지도 표시 (서울 시청)');
                const defaultLocation = { lat: 37.5665, lng: 126.9780 };
                
                map = new google.maps.Map(mapElement, {
                    center: defaultLocation,
                    zoom: 10,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true
                });
                
                // 기본 메시지 표시
                const infoWindow = new google.maps.InfoWindow({
                    content: '정확한 위치 정보를 불러올 수 없습니다.'
                });
                infoWindow.open(map);
                
                document.getElementById('location-address').textContent = address || '위치 정보가 유효하지 않습니다.';
                return;
            }
            
            // 지도가 이미 있으면 제거
            if (map) {
                console.log('🔄 기존 지도 제거 중...');
                map = null;
                marker = null;
                rectangle = null;
            }
            
            const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
            console.log('📍 최종 위치 좌표:', location);
            
            // 캐시된 설정이 있으면 최적화된 설정으로 지도 생성
            const useCache = cachedData && cachedData.viewportData;
            console.log(useCache ? 
                '🗺️ 🚀 캐시된 설정으로 최적화된 지도 생성...' : 
                '🗺️ ⚡ 새 지도 생성 중... (첫 방문)');
            
            map = new google.maps.Map(mapElement, {
                center: location,
                zoom: useCache ? (cachedData.zoom || 14) : 14,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                styles: [
                    {
                        featureType: 'poi.business',
                        stylers: [{ visibility: 'on' }]
                    }
                ]
            });
            
            console.log('✅ 지도 생성 완료!', map);
            
            // 지도 로딩 완료 대기
            google.maps.event.addListenerOnce(map, 'idle', function() {
                console.log('🎉 지도 렌더링 완료!');
                
                // viewport 정보가 있으면 빨간색 영역 표시
                const useViewportData = viewportData || (cachedData && cachedData.viewportData);
                
                if (useViewportData && useViewportData.northeastLat && useViewportData.northeastLng && 
                    useViewportData.southwestLat && useViewportData.southwestLng) {
                    
                    console.log('🎯 Viewport 영역 표시:', useViewportData);
                    console.log(cachedData ? '📦 (캐시된 설정 사용)' : '🆕 (새 설정)');
                    
                    // 기존 영역 제거
                    if (rectangle) {
                        rectangle.setMap(null);
                    }
                    
                    // LatLngBounds 객체 생성
                    const bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(useViewportData.southwestLat, useViewportData.southwestLng), // 남서쪽
                        new google.maps.LatLng(useViewportData.northeastLat, useViewportData.northeastLng)  // 북동쪽
                    );
                    
                    // 영역을 사각형으로 표시 (빨간색 반투명)
                    rectangle = new google.maps.Rectangle({
                        bounds: bounds,
                        fillColor: '#FF4444',
                        fillOpacity: 0.25,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        map: map
                    });
                    
                    // 지도 뷰를 viewport에 맞춤
                    map.fitBounds(bounds);
                    
                    console.log('🎨 영역 표시 완료! (Geocoding API 호출 없음)');
                    
                } else {
                    console.log('⚠️ Viewport 정보 없음, 마커로 표시');
                    
                    // viewport가 없으면 기존처럼 마커 표시
                    if (marker) {
                        marker.setMap(null);
                    }
                    
                    marker = new google.maps.Marker({
                        position: location,
                        map: map,
                        title: '숙소 위치',
                        animation: google.maps.Animation.DROP
                    });
                    
                    map.setCenter(location);
                    map.setZoom(16);
                    
                    console.log('📍 마커 표시 완료!');
                }
                
                // 세션 스토리지에 설정 저장 (첫 방문이거나 캐시가 없는 경우만)
                if (!cachedData) {
                    setSessionCache(cacheKey, {
                        houseId: houseId,
                        location: location,
                        viewportData: viewportData,
                        zoom: map.getZoom(),
                        center: map.getCenter().toJSON()
                    });
                    
                    console.log('💾 지도 설정 세션 스토리지 저장 완료:', cacheKey);
                } else {
                    console.log('♻️ 기존 캐시 재사용 - 저장 생략');
                }
            });
            
        } catch (error) {
            console.error('❌ 지도 초기화 실패:', error);
            
            // 지도 생성 실패 시 에러 메시지 표시
            const mapElement = document.getElementById('listing-map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ffe6e6; color: #d00; text-align: center; font-size: 14px; border: 1px solid #ffb3b3;">
                        <div>
                            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                            지도 로딩 중 오류가 발생했습니다.<br>
                            오류: ${error.message}
                        </div>
                    </div>
                `;
            }
            
            document.getElementById('location-address').textContent = address || '지도를 불러올 수 없습니다.';
        }
    }
});