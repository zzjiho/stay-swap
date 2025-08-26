document.addEventListener('DOMContentLoaded', function() {
    // 전역에서 접근 가능한 인증 체크 함수
    function checkAuthToken() {
        if (!window.isLoggedIn()) {
            alert('로그인이 필요한 서비스예요 ✨');
            window.location.href = '/page/auth';
            return false;
        }
        return true;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const houseId = urlParams.get('id');

    // 중복 초기화 방지 플래그
    let isInitialized = false;

    // 메인 초기화 함수
    function initializeListingDetail() {
        if (isInitialized) {
            return;
        }
        isInitialized = true;

        // Google Maps API 로딩 상태 확인
        function checkGoogleMapsAPI() {
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

            return true;
        }

        // Google Maps API 로딩 대기 함수
        function waitForGoogleMapsAPI(callback, maxAttempts = 50) {
            let attempts = 0;

            const checkInterval = setInterval(() => {
                attempts++;

                if (checkGoogleMapsAPI()) {
                    clearInterval(checkInterval);
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

        // houseId가 있으면 API 호출
        if (houseId) {
            Promise.all([
                fetchHouseDetail(houseId),
                fetchHouseImages(houseId),
                fetchHouseReviews(houseId, 6) // 처음 6개 리뷰만 로드
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
            alert('공유 기능이 곧 찾아올 예정이에요! 조금만 기다려주세요 ✨');
        });

        // 저장 버튼 클릭 이벤트
        $('.save-btn').on('click', function() {
            if (!checkAuthToken()) {
                return;
            }

            const $button = $(this);
            const $icon = $button.find('i');
            const isCurrentlyLiked = $icon.hasClass('fas'); // 현재 좋아요 상태

            // 버튼 비활성화 (중복 클릭 방지)
            $button.prop('disabled', true);

            if (isCurrentlyLiked) {
                // 좋아요 취소
                cancelLike(houseId).then(() => {
                    updateLikeButton(false);
                }).catch(error => {
                    console.error('좋아요 취소 실패:', error);
                    alert('좋아요 취소에 실패했습니다.');
                }).always(() => {
                    $button.prop('disabled', false);
                });
            } else {
                // 좋아요 등록
                addLike(houseId).then(() => {
                    updateLikeButton(true);
                }).catch(error => {
                    console.error('좋아요 등록 실패:', error);
                    alert('좋아요 등록에 실패했습니다.');
                }).always(() => {
                    $button.prop('disabled', false);
                });
            }
        });

        // 좋아요 등록 API 호출
        function addLike(houseId) {
            return $.ajax({
                url: `/api/house/${houseId}/like`,
                type: 'POST',
                dataType: 'json'
            });
        }

        // 좋아요 취소 API 호출
        function cancelLike(houseId) {
            return $.ajax({
                url: `/api/house/${houseId}/like`,
                type: 'DELETE',
                dataType: 'json'
            });
        }

        // 좋아요 버튼 상태 업데이트
        function updateLikeButton(isLiked) {
            const $button = $('.save-btn');

            if ($button.length === 0) {
                console.error('save-btn 요소를 찾을 수 없습니다!');
                return;
            }

            const $icon = $button.find('i');

            if (isLiked) {
                $button.html('<i class="fas fa-heart"></i> 저장됨');
            } else {
                $button.html('<i class="far fa-heart"></i> 저장');
            }

            // 업데이트 후 상태 확인
            const updatedIcon = $button.find('i');
        }



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

        // 내 숙소 목록을 가져오는 API 호출 함수
        function fetchMyListings() {
            if (!checkAuthToken()) return Promise.reject('No token');

            return $.ajax({
                url: '/api/house/my',
                type: 'GET',
                dataType: 'json',
                success: function(response) {
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
            const container = $('.my-listings-container');
            container.empty();

            if (!myListings || myListings.length === 0) {
                container.html('<p class="p-4 text-center">등록된 숙소가 없습니다.</p>');
                return;
            }

            myListings.forEach(listing => {
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

            if (!checkAuthToken()) {
                return;
            }

            // 체크인/체크아웃 날짜 확인
            const checkinDate = $('#checkin-date').val();
            const checkoutDate = $('#checkout-date').val();
            const guestCount = $('#guest-count').val();

            if (!checkinDate || !checkoutDate) {
                alert('체크인/체크아웃 날짜를 선택해주세요 ✨');
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

            // 내 숙소 목록 렌더링
            fetchMyListings().then(function() {
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
                alert('체크인/체크아웃 날짜를 선택해주세요 ✨');
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

        // 리뷰 전체보기 버튼 클릭 이벤트
        $('#show-all-reviews-btn').on('click', function() {
            openReviewsModal();
        });

        // 리뷰 필터 버튼 클릭 이벤트
        $(document).on('click', '.filter-btn', function() {
            $('.filter-btn').removeClass('active');
            $(this).addClass('active');

            const filter = $(this).data('filter');
            filterReviews(filter);
        });

        // 리뷰 정렬 변경 이벤트
        $(document).on('change', '#reviews-sort', function() {
            const sort = $(this).val();
            sortReviews(sort);
        });

        // 더 많은 리뷰 보기 버튼 클릭 이벤트
        $(document).on('click', '#load-more-reviews-btn', function() {
            loadMoreReviews();
        });

        // 교환 요청 API 호출 함수
        function requestSwapExchange(listingId, checkinDate, checkoutDate, guestCount, message) {
            if (!checkAuthToken()) return Promise.reject('No token');

            return $.ajax({
                url: '/api/house/swap',
                type: 'POST',
                contentType: 'application/json',
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
                alert('교환할 숙소를 선택해주세요 🏠');
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
                    alert('교환 요청을 보냈어요! 호스트의 답변을 기다려주세요 🙌');
                } else {
                    alert('앗! 교환 요청 중에 문제가 발생했어요: ' + response.message);
                }
            }).fail(function(xhr, status, error) {
                console.error('교환 요청 API 호출 실패:', error);
                console.error('상태 코드:', xhr.status);
                console.error('응답 텍스트:', xhr.responseText);

                try {
                    // 서버에서 반환된 JSON 에러 메시지 파싱
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse && errorResponse.errorMessage) {
                        alert('앗! ' + errorResponse.errorMessage);
                        // 존재하지 않는 숙소인 경우 메인 페이지로 리디렉션
                        if (errorResponse.errorCode === "NOT_EXISTS_HOUSE") {
                            alert('존재하지 않는 숙소예요. 메인 페이지로 이동할게요 🏠');
                            setTimeout(function() {
                                window.location.href = "/";
                            }, 1000);
                        }
                        return;
                    }
                } catch (e) {
                    console.error('에러 응답 파싱 실패:', e);
                }

                alert('서버와 연결하는데 문제가 있어요. 잠시 후 다시 시도해주세요 🔄');
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
                    alert('숙박 요청을 보냈어요! 호스트의 답변을 기다려주세요 🙌');
                } else {
                    alert('앗! 숙박 요청 중에 문제가 발생했어요: ' + response.message);
                }
            }).fail(function(xhr, status, error) {
                console.error('숙박 요청 API 호출 실패:', error);
                console.error('상태 코드:', xhr.status);
                console.error('응답 텍스트:', xhr.responseText);

                try {
                    // 서버에서 반환된 JSON 에러 메시지 파싱
                    const errorResponse = JSON.parse(xhr.responseText);
                    if (errorResponse && errorResponse.errorMessage) {
                        alert('앗! ' + errorResponse.errorMessage);
                        // 존재하지 않는 숙소인 경우 메인 페이지로 리디렉션
                        if (errorResponse.errorCode === "NOT_EXISTS_HOUSE") {
                            alert('존재하지 않는 숙소예요. 메인 페이지로 이동할게요 🏠');
                            setTimeout(function() {
                                window.location.href = "/";
                            }, 1000);
                        }
                        return;
                    }
                } catch (e) {
                    console.error('에러 응답 파싱 실패:', e);
                }

                alert('서버와 연결하는데 문제가 있어요. 잠시 후 다시 시도해주세요 🔄');
            });
        });

        // API로 숙소 상세 정보 가져오기
        function fetchHouseDetail(houseId) {

            // Authorization 헤더는 브라우저가 자동으로 HttpOnly 쿠키에서 가져옴
            const headers = {
                'Content-Type': 'application/json'
            };

            return $.ajax({
                url: `/api/house/${houseId}`,
                type: 'GET',
                dataType: 'json',
                headers: headers,
                success: function(response) {

                    if (response.httpStatus === 'OK') {
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
                            alert('앗! ' + errorResponse.errorMessage);
                            // 존재하지 않는 숙소인 경우 메인 페이지로 리디렉션
                            if (errorResponse.errorCode === "NOT_EXISTS_HOUSE") {
                                alert('존재하지 않는 숙소예요. 메인 페이지로 이동할게요 🏠');
                                setTimeout(function() {
                                    window.location.href = "/";
                                }, 1000);
                            }
                            return;
                        }
                    } catch (e) {
                        console.error('에러 응답 파싱 실패:', e);
                    }

                    alert('서버와 연결하는데 문제가 있어요. 잠시 후 다시 시도해주세요 🔄');
                }
            });
        }

        // 호스트 상세 정보 API 호출 함수
        function fetchHostDetail(houseId) {

            $.ajax({
                url: `/api/house/${houseId}/host`,
                type: 'GET',
                dataType: 'json',
                success: function(response) {

                    if (response.httpStatus === 'OK') {
                        updateHostDetailUI(response.data);
                    } else {
                        console.error('호스트 API 요청 실패:', response.message);
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
                            return;
                        }
                    } catch (e) {
                        console.error('에러 응답 파싱 실패:', e);
                    }
                }
            });
        }

        // 호스트 상세 정보 UI 업데이트 함수
        function updateHostDetailUI(hostData) {
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

            } catch (e) {
                console.error('호스트 UI 업데이트 중 오류 발생:', e);
            }
        }

        // 숙소 상세 정보로 UI 업데이트
        function updateHouseDetailUI(houseData) {
            try {
                // 제목 및 기본 정보 업데이트
                if (houseData.title) {
                    $('#listing-title').text(houseData.title);
                }

                if (houseData.description) {
                    // 개행 문자(\n)를 <br> 태그로 변환하여 줄바꿈 유지
                    const descriptionWithBreaks = houseData.description.replace(/\n/g, '<br>');
                    $('#listing-description').html(descriptionWithBreaks);
                }

                if (houseData.cityKo && houseData.districtKo) {
                    $('#listing-location').text(`${houseData.cityKo} ${houseData.districtKo}`);
                }

                // 평점 및 리뷰 업데이트
                if (houseData.avgRating !== undefined) {
                    const rating = houseData.avgRating.toFixed(1);
                    $('#listing-rating, #sidebar-rating').text(rating);
                }

                if (houseData.reviewCount !== undefined) {
                    $('#listing-reviews').text(`(${houseData.reviewCount})`);
                    $('#sidebar-review-count').text(houseData.reviewCount);
                }

                // 리뷰 섹션 정보 업데이트
                updateReviewInfo(houseData.avgRating, houseData.reviewCount);

                // 편의시설 업데이트
                if (houseData.amenities) {
                    updateAmenities(houseData.amenities);
                } else {
                    console.warn('편의시설 정보가 없습니다');
                }

                // 특징 배지 업데이트
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

                    // 위도/경도가 없어도 주소가 있으면 Geocoding API로 좌표를 찾아서 지도 표시
                    if (houseData.address && houseData.address.trim() !== '') {

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

                // 좋아요 상태 업데이트 (API 응답에서 확인)
                if (houseData.isLiked !== undefined) {
                    updateLikeButton(houseData.isLiked);
                } else {
                    console.warn('houseData.isLiked가 undefined입니다. API 응답 확인 필요');
                }
            } catch (e) {
                console.error('UI 업데이트 중 오류 발생:', e);
            }
        }

        // 편의시설 UI 업데이트
        function updateAmenities(amenityInfo) {
            try {
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
                }
            } catch (e) {
                console.error('편의시설 업데이트 중 오류 발생:', e);
            }
        }

        // 특징 배지 업데이트
        function updateFeatureBadges(houseData) {
            try {
                const featuresContainer = $('#listing-features');
                if (!featuresContainer.length) {
                    console.warn('listing-features 요소를 찾을 수 없습니다');
                    return;
                }

                featuresContainer.empty();

                // 반려동물 허용 여부에 따라 배지 추가
                if (houseData.petsAllowed) {
                    featuresContainer.append('<span class="badge badge-outline">반려동물 동반 가능</span>');
                }

                // 무료 주차 여부에 따라 배지 추가
                if (houseData.amenities && houseData.amenities.hasFreeParking) {
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
            } catch (e) {
                console.error('배지 업데이트 중 오류 발생:', e);
            }
        }

        // 숙소 이미지 API 호출 함수
        function fetchHouseImages(houseId) {
            $.ajax({
                url: `/api/house/${houseId}/images`,
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (response.httpStatus === 'OK' && response.data && response.data.length > 0) {
                        // 이미지 URL 배열 추출
                        const apiImages = response.data.map(image => image.imageUrl);

                        if (apiImages.length > 0) {
                            // API에서 가져온 이미지로 갤러리 업데이트
                            images = apiImages;
                            currentImageIndex = 0;

                            // 첫 번째 이미지 표시
                            $('#gallery-main-image').attr('src', images[0]);

                            // 도트 갱신
                            createGalleryDots();
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('이미지 API 호출 오류:', error);
                    console.error('상태 코드:', xhr.status);
                    console.error('응답 텍스트:', xhr.responseText);
                }
            });
        }

        // 주소를 이용해서 지도 표시하는 함수
        function geocodeAndShowMap(address) {
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
                    if (status === 'OK' && results[0] && results[0].geometry) {
                        const location = results[0].geometry.location;
                        const lat = location.lat();
                        const lng = location.lng();

                        // 추출된 좌표로 지도 표시
                        initializeMap(lat, lng, address, results[0].geometry.viewport);

                    } else {
                        console.error('❌ 주소에서 좌표 추출 실패:', status);

                        // Geocoding 실패 시 기본 지도 표시
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
            } catch (e) {
                console.warn('세션 캐시 저장 실패:', e);
            }
        }

        // 지도 초기화 함수
        function initializeMap(latitude, longitude, address, viewportData) {
            // 악의적 새로고침 체크
            const refreshCheck = checkRefreshLimit();
            if (refreshCheck.blocked) {
                console.error('🚫 과도한 새로고침으로 인한 지도 로딩 차단');

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

            // 지도 요소가 화면에 보이는지 확인
            if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
                console.warn('⚠️ 지도 요소가 화면에 보이지 않습니다. 잠시 후 다시 시도합니다.');

                // 100ms 후 다시 시도
                setTimeout(() => {
                    initializeMap(latitude, longitude, address, viewportData);
                }, 100);
                return;
            }

            try {
                // 위도/경도 유효성 확인
                if (!latitude || !longitude || latitude === 0 || longitude === 0) {
                    console.error('❌ 유효하지 않은 위도/경도:', { latitude, longitude });

                    // 기본 지도라도 표시
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
                    map = null;
                    marker = null;
                    rectangle = null;
                }

                const location = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

                // 캐시된 설정이 있으면 최적화된 설정으로 지도 생성
                const useCache = cachedData && cachedData.viewportData;

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

                // 지도 로딩 완료 대기
                google.maps.event.addListenerOnce(map, 'idle', function() {
                    // viewport 정보가 있으면 빨간색 영역 표시
                    const useViewportData = viewportData || (cachedData && cachedData.viewportData);

                    if (useViewportData && useViewportData.northeastLat && useViewportData.northeastLng &&
                        useViewportData.southwestLat && useViewportData.southwestLng) {

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

                        // 영역을 좀 더 넓게 보기 위해 zoom out
                        const currentZoom = map.getZoom();
                        map.setZoom(currentZoom - 1);

                    } else {
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

        // 리뷰 관련 변수
        let allReviews = [];
        let currentPage = 0;
        let hasNextPage = true;
        let currentFilter = 'all';
        let currentSort = 'recent';

        // 숙소 리뷰 API 호출 함수
        function fetchHouseReviews(houseId, size = 10, page = 0) {
            const headers = {};
            return $.ajax({
                url: `/api/review/house/${houseId}?page=${page}&size=${size}`,
                type: 'GET',
                dataType: 'json',
                headers: headers,
                success: function(response) {
                    if (response.httpStatus === 'OK' && response.data) {
                        const reviewsData = response.data;

                        if (page === 0) {
                            // 첫 페이지 로드 시
                            allReviews = reviewsData.content || [];
                            renderReviews(allReviews, true); // 메인 페이지에 6개만 표시
                        } else {
                            // 추가 페이지 로드 시
                            allReviews = allReviews.concat(reviewsData.content || []);
                            renderModalReviews(allReviews);
                        }

                        hasNextPage = !reviewsData.last;
                        currentPage = page;

                        // 로딩 상태 제거
                        $('.reviews-loading, .modal-reviews-loading').hide();

                    } else {
                        console.error('리뷰 API 요청 실패:', response.message);
                        $('.reviews-loading, .modal-reviews-loading').text('리뷰를 불러오는데 실패했습니다.');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('리뷰 API 호출 오류:', error);
                    $('.reviews-loading, .modal-reviews-loading').text('리뷰를 불러오는데 실패했습니다.');
                }
            });
        }

        // 리뷰 렌더링 (메인 페이지용 - 최대 6개)
        function renderReviews(reviews, isMainPage = false) {
            const container = $('#reviews-container');
            container.empty();

            if (!reviews || reviews.length === 0) {
                container.html('<div class="no-reviews"><p>아직 첫 리뷰를 기다리고 있어요 ✨</p></div>');
                return;
            }

            const displayReviews = isMainPage ? reviews.slice(0, 6) : reviews;

            displayReviews.forEach(review => {
                const reviewElement = createReviewElement(review);
                container.append(reviewElement);
            });

            // 메인 페이지에서 6개 이상의 리뷰가 있거나 더 많은 페이지가 있으면 "더보기" 버튼 표시
            if (isMainPage && (reviews.length >= 6 || hasNextPage)) {
                $('#show-all-reviews-btn').show();
                $('#total-reviews-count').text(reviews.length);
            } else if (isMainPage) {
                $('#show-all-reviews-btn').hide();
            }
        }

        // 리뷰 요소 생성
        function createReviewElement(review) {
            const reviewDate = new Date(review.createdDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long'
            });

            const avatarContent = review.reviewerProfile ?
                `<img src="${review.reviewerProfile}" alt="${review.reviewerNickname}">` :
                `<div class="review-avatar-placeholder">${review.reviewerNickname.charAt(0)}</div>`;

            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            return $(`
            <div class="review-item" data-rating="${review.rating}">
                <div class="review-avatar">
                    ${avatarContent}
                </div>
                <div class="review-content">
                    <div class="review-header">
                        <span class="review-author">${review.reviewerNickname}</span>
                        <div class="review-rating">
                            <span>${stars}</span>
                        </div>
                    </div>
                    <div class="review-date">${reviewDate}</div>
                    <div class="review-text">${review.comment || '리뷰 내용이 없습니다.'}</div>
                </div>
            </div>
        `);
        }

        // 리뷰 모달 열기
        function openReviewsModal() {
            // 모달 내용 업데이트
            $('#modal-reviews-rating').text($('#reviews-rating').text());
            $('#modal-reviews-count').text($('#reviews-count').text());

            // 모달 열기
            openPopup('reviews-modal');

            // 전체 리뷰 개수 확인
            const totalReviewCount = parseInt($('#reviews-count').text()) || 0;

            // 모든 리뷰가 로드되지 않았다면 전체 로드
            if (allReviews.length < totalReviewCount) {
                fetchHouseReviews(houseId, totalReviewCount, 0).then(() => {
                    // 모든 리뷰 로드 후 렌더링
                    renderModalReviews(allReviews);
                }).catch(error => {
                    console.error('모달 리뷰 로드 실패:', error);
                    // 실패해도 기존 리뷰는 표시
                    renderModalReviews(allReviews);
                });
            } else {
                // 이미 모든 리뷰가 로드된 경우
                renderModalReviews(allReviews);
            }
        }

        // 모달용 리뷰 렌더링
        function renderModalReviews(reviews) {
            const container = $('#modal-reviews-container');
            container.empty();

            if (!reviews || reviews.length === 0) {
                container.html('<div class="no-reviews"><p>해당하는 리뷰가 없어요 🔍</p></div>');
                updateLoadMoreButton();
                return;
            }

            // 필터와 정렬 적용
            let filteredReviews = filterReviewsByRating(reviews, currentFilter);
            filteredReviews = sortReviewsBy(filteredReviews, currentSort);

            filteredReviews.forEach(review => {
                const reviewElement = createReviewElement(review);
                container.append(reviewElement);
            });

            updateLoadMoreButton();
        }

        // 리뷰 필터링
        function filterReviewsByRating(reviews, filter) {
            if (filter === 'all') return reviews;

            const rating = parseInt(filter);
            if (filter === '3') {
                // 3점 이하
                return reviews.filter(review => review.rating <= 3);
            } else {
                // 특정 점수
                return reviews.filter(review => review.rating === rating);
            }
        }

        // 리뷰 정렬
        function sortReviewsBy(reviews, sort) {
            const sortedReviews = [...reviews];

            switch (sort) {
                case 'recent':
                    return sortedReviews.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
                case 'rating-high':
                    return sortedReviews.sort((a, b) => b.rating - a.rating);
                case 'rating-low':
                    return sortedReviews.sort((a, b) => a.rating - b.rating);
                default:
                    return sortedReviews;
            }
        }

        // 필터 적용
        function filterReviews(filter) {
            currentFilter = filter;
            renderModalReviews(allReviews);
        }

        // 정렬 적용
        function sortReviews(sort) {
            currentSort = sort;
            renderModalReviews(allReviews);
        }

        // 더 많은 리뷰 로드
        function loadMoreReviews() {
            if (!hasNextPage) {
                return;
            }

            $('#load-more-reviews-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 리뷰를 더 가져오고 있어요...');

            fetchHouseReviews(houseId, 10, currentPage + 1).then(() => {
                updateLoadMoreButton();
            }).catch(error => {
                console.error('추가 리뷰 로드 실패:', error);
                $('#load-more-reviews-btn').prop('disabled', false).html('<i class="fas fa-plus"></i> 더 많은 후기 보기 ✨');
            });
        }

        // 더보기 버튼 상태 업데이트
        function updateLoadMoreButton() {
            const loadMoreBtn = $('#load-more-reviews-btn');

            if (hasNextPage) {
                loadMoreBtn.show().prop('disabled', false).html('<i class="fas fa-plus"></i> 더 많은 후기 보기 ✨');
            } else {
                loadMoreBtn.hide();
            }
        }

        // 리뷰 정보 업데이트 (숙소 상세 정보에서 호출)
        function updateReviewInfo(avgRating, reviewCount) {
            if (avgRating !== undefined) {
                $('#reviews-rating, #modal-reviews-rating').text(avgRating.toFixed(1));
            }

            if (reviewCount !== undefined) {
                $('#reviews-count, #modal-reviews-count, #total-reviews-count').text(reviewCount);
            }
        }
    } // initializeListingDetail 함수 종료

    // 인증 상태 변경 이벤트 리스너 등록
    document.addEventListener('authStateChanged', function(event) {
        // 인증 초기화가 완료되면 (로그인 여부와 관계없이) 메인 로직 실행
        initializeListingDetail();
    });

    // 이미 인증이 초기화된 경우 즉시 실행
    if (window.authInitialized) {
        initializeListingDetail();
    }

    // 호스트에게 메시지 보내기 버튼 이벤트
    $(document).on('click', '#message-host-btn', function() {
        if (!checkAuthToken()) {
            return;
        }

        const $button = $(this);
        $button.prop('disabled', true).text('채팅방으로 이동 중...');

        $.ajax({
            url: `/api/chats/house/${houseId}/inquiry`,
            type: 'POST'
        }).done(function(response) {
            if (response.httpStatus === 'OK' && response.data && (response.data.chatroomId || response.data.chatRoomId)) {
                const chatroomId = response.data.chatroomId || response.data.chatRoomId;
                // 성공 시 채팅방으로 이동
                window.location.href = `/page/messages?chatroomId=${chatroomId}`;
            } else {
                alert('채팅방을 열 수 없습니다. 다시 시도해주세요.');
                $button.prop('disabled', false).text('💬 호스트에게 메시지 보내기');
            }
        }).fail(function(xhr) {
            console.error('채팅방 생성/조회 실패:', xhr.responseText);
            const error = xhr.responseJSON || {};
            alert(error.errorMessage || '채팅방을 열 수 없습니다. 잠시 후 다시 시도해주세요.');
            $button.prop('disabled', false).text('💬 호스트에게 메시지 보내기');
        });
    });
});