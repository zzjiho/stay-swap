$(document).ready(function() {
    // 전역 변수
    let currentPage = 0;
    const pageSize = 10;
    let isLoading = false;
    let isLastPage = false;

    // 초기 데이터 로드
    loadCountries(); // 국가 목록 먼저 로드
    loadHouseList(true);

    // 이벤트 리스너 설정
    setupEventListeners();

    /**
     * 국가 목록 로드
     */
    function loadCountries() {
        $.ajax({
            url: '/api/house/countries',
            type: 'GET',
            success: function(response) {
                if (response.httpStatus === "OK" && response.data) {
                    const countrySelect = $('#country-filter');
                    
                    response.data.forEach(function(country) {
                        countrySelect.append(`<option value="${country.countryKo}">${country.countryKo} (${country.countryEn})</option>`);
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('국가 목록 로드 실패:', error);
                // 에러가 발생해도 기본 기능은 동작하도록 함
            }
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 검색 버튼 클릭
        $('.search-button').on('click', function() {
            resetSearch();
        });

        // 검색어 입력 필드 엔터키
        $('#search-query').on('keypress', function(e) {
            if (e.which === 13) {
                resetSearch();
            }
        });

        // 필터 변경 이벤트
        $('#country-filter, #city-filter, #bedroom-filter, #date-filter').on('change', function() {
            resetSearch();
        });

        // 편의시설 체크박스 변경
        $('.amenity-checkbox').on('change', function() {
            resetSearch();
        });

        // 정렬 옵션 변경
        $('#sort-select').on('change', function() {
            resetSearch();
        });

        // 무한 스크롤
        $(window).on('scroll', function() {
            if (!isLoading && !isLastPage &&
                $(window).scrollTop() + $(window).height() >
                $(document).height() - 300) {
                currentPage++;
                loadHouseList(false);
            }
        });

        // 가격 슬라이더 (있는 경우)
        const priceSlider = $('#price-slider');
        if (priceSlider.length) {
            priceSlider.on('input', function() {
                $('#price-value').text($(this).val() + ' P');
            });
        }
    }

    /**
     * 검색 초기화 및 재검색
     */
    function resetSearch() {
        currentPage = 0;
        isLastPage = false;
        loadHouseList(true);
    }

    /**
     * 숙소 목록 로드
     */
    function loadHouseList(resetList) {
        if (isLoading) return;

        isLoading = true;
        showLoading(resetList);

        // API 요청 파라미터 구성
        const params = {
            keyword: $('#search-query').val() || null,
            country: $('#country-filter').val() || null,
            city: $('#city-filter').val() || null,
            houseType: getHouseTypeFromSelect(),
            date: $('#date-filter').val() || null,
            amenities: getSelectedAmenities(),
            sortBy: $('#sort-select').val() || 'review_count',
            page: currentPage,
            size: pageSize
        };

        // API 호출
        $.ajax({
            url: '/api/house',
            type: 'GET',
            data: params,
            success: function(response) {
                handleSuccessResponse(response, resetList);
            },
            error: function(xhr, status, error) {
                handleErrorResponse(xhr, status, error);
            },
            complete: function() {
                isLoading = false;
                hideLoading();
            }
        });
    }

    /**
     * 성공 응답 처리
     * @param {Object} response - API 응답
     * @param {boolean} resetList - 목록 초기화 여부
     */
    function handleSuccessResponse(response, resetList) {
        const container = $('#listings-container');
        const listings = response.data.content;

        // 목록 초기화가 필요한 경우
        if (resetList) {
            container.empty();
        }

        // 결과가 없는 경우
        if (listings.length === 0 && currentPage === 0) {
            container.html('<div class="no-results">검색 결과가 없습니다.</div>');
            $('#listings-count').text('0');
            return;
        }

        // 목록 렌더링
        renderListings(listings);

        // 총 개수 업데이트
        $('#listings-count').text(response.data.totalElements || 0);

        // 마지막 페이지 체크
        isLastPage = response.data.last;
    }

    /**
     * 에러 응답 처리
     */
    function handleErrorResponse(xhr, status, error) {
        console.error('API 오류:', xhr, status, error);

        let errorMessage = '서버와 통신 중 오류가 발생했습니다.';

        if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.status === 404) {
            errorMessage = '요청한 정보를 찾을 수 없습니다.';
        } else if (xhr.status === 500) {
            errorMessage = '서버 내부 오류가 발생했습니다.';
        }

        $('#listings-container').html(`
            <div class="api-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${errorMessage}</p>
                <button id="retry-button" class="retry-button">다시 시도</button>
            </div>
        `);

        $('#retry-button').on('click', function() {
            resetSearch();
        });
    }

    /**
     * 숙소 목록 렌더링
     */
    function renderListings(listings) {
        const container = $('#listings-container');

        listings.forEach(function(listing) {
            // 평점 포맷팅
            const rating = listing.avgRating ? parseFloat(listing.avgRating).toFixed(1) : '0.0';

            // 숙소 카드 HTML 생성
            const card = $('<div>').addClass('listing-card');
            card.html(`
                <a href="/page/listing-detail?id=${listing.houseId}" class="listing-link">
                    <div class="listing-image">
                        <img src="${listing.mainImageUrl || '/images/placeholder.jpg'}" alt="${listing.title}">
                        <div class="listing-rating">
                            <i class="fas fa-star"></i>
                            <span>${rating} (${listing.reviewCount || 0})</span>
                        </div>
                    </div>
                    <div class="listing-content">
                        <h3 class="listing-title">${listing.title}</h3>
                        <div class="listing-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${listing.cityKo} ${listing.districtKo || ''}</span>
                        </div>
                        <div class="listing-details">
                            <div class="listing-detail-item">
                                <i class="fas fa-bed"></i>
                                <span>침실 ${listing.bedrooms}개</span>
                            </div>
                            <div class="listing-detail-item">
                                <i class="fas fa-user-friends"></i>
                                <span>최대 ${listing.maxGuests}인</span>
                            </div>
                            <div class="listing-type">
                                <i class="fas fa-home"></i>
                                <span>${formatHouseType(listing.houseType)}</span>
                            </div>
                        </div>
                    </div>
                </a>
            `);

            container.append(card);
        });
    }

    /**
     * 로딩 표시 함수
     */
    function showLoading(isNewSearch) {
        if (isNewSearch) {
            $('#listings-container').html(`
                <div class="listing-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>숙소를 불러오는 중입니다...</p>
                </div>
            `);
        } else {
            $('#listings-container').append(`
                <div class="listing-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>추가 숙소를 불러오는 중입니다...</p>
                </div>
            `);
        }
    }

    /**
     * 로딩 표시 제거 함수
     */
    function hideLoading() {
        $('.listing-loading').remove();
    }

    /**
     * 숙소 유형 select 값 변환
     */
    function getHouseTypeFromSelect() {
        const typeValue = $('#bedroom-filter').val();
        if (!typeValue) return null;

        const typeMap = {
            '1': 'APT',
            '2': 'HOUSE',
            '3': 'VILLA',
            '4': 'OFFICETEL'
        };

        return typeMap[typeValue];
    }

    /**
     * 선택된 편의시설 배열 가져오기
     */
    function getSelectedAmenities() {
        const amenities = [];

        // 체크된 편의시설 확인
        $('.amenity-checkbox:checked').each(function() {
            const amenityMap = {
                'wifi': 'WIFI',
                'aircon': 'AIRCON',
                'kitchen': 'KITCHEN',
                'washer': 'WASHER',
                'pet': 'PETS',
                'parking': 'PARKING',
                'tv': 'TV'
            };

            const apiValue = amenityMap[$(this).attr('id')];
            if (apiValue) {
                amenities.push(apiValue);
            }
        });

        return amenities.length > 0 ? amenities : null;
    }

    /**
     * 숙소 유형 포맷팅
     */
    function formatHouseType(type) {
        const typeMap = {
            'APT': '아파트',
            'HOUSE': '주택',
            'VILLA': '빌라',
            'OFFICETEL': '오피스텔'
        };

        return typeMap[type] || '기타';
    }
});