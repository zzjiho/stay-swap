document.addEventListener('DOMContentLoaded', function() {
    // 가격 슬라이더 초기화
    const priceSlider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');

    if (priceSlider && priceValue) {
        priceSlider.addEventListener('input', function() {
            priceValue.textContent = this.value + ' P';
        });
    }

    // 숙소 목록 불러오기
    fetchListings();

    // 검색 버튼 이벤트
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            applyFilters();
        });
    }

    // 필터 변경 이벤트
    const filterElements = [
        document.getElementById('location-filter'),
        document.getElementById('price-slider'),
        document.getElementById('bedroom-filter'),
        document.getElementById('date-filter')
    ];

    filterElements.forEach(element => {
        if (element) {
            element.addEventListener('change', function() {
                applyFilters();
            });
        }
    });

    // 편의시설 체크박스 이벤트
    const amenityCheckboxes = document.querySelectorAll('.amenity-checkbox');
    amenityCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });

    // 정렬 옵션 변경 이벤트
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            applyFilters();
        });
    }
});

// 필터 적용하여 숙소 검색
function applyFilters() {
    const query = document.getElementById('search-query').value;
    const location = document.getElementById('location-filter').value;
    const maxPrice = document.getElementById('price-slider').value;
    const minBedrooms = document.getElementById('bedroom-filter').value;
    const date = document.getElementById('date-filter').value;
    const sort = document.getElementById('sort-select').value;

    // 선택된 편의시설 가져오기
    const selectedAmenities = [];
    document.querySelectorAll('.amenity-checkbox:checked').forEach(checkbox => {
        selectedAmenities.push(checkbox.id);
    });

    // 필터 적용하여 숙소 검색
    fetchListings(query, {
        location,
        maxPrice,
        minBedrooms,
        date,
        amenities: selectedAmenities,
        sort
    });
}

// 숙소 목록 불러오기
function fetchListings(query = '', filters = {}) {
    const listingsContainer = document.getElementById('listings-container');

    if (!listingsContainer) return;

    // 로딩 표시
    listingsContainer.innerHTML = `
        <div class="listing-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>숙소를 불러오는 중입니다...</p>
        </div>
    `;

    // 테스트용 더미 데이터
    const dummyListings = [
        {
            id: 1,
            title: '서울 강남 모던 아파트',
            image: '/images/listing1.jpg',
            location: '서울 강남구',
            rating: 4.9,
            reviews: 128,
            bedrooms: 2,
            bathrooms: 1,
            guests: 4,
            features: ['와이파이', '에어컨', '주방'],
            points: 500,
            host: {
                name: '김민수',
                image: '/images/host1.jpg'
            }
        },
        {
            id: 2,
            title: '제주도 바다 전망 빌라',
            image: '/images/listing2.jpg',
            location: '제주 서귀포시',
            rating: 4.8,
            reviews: 95,
            bedrooms: 3,
            bathrooms: 2,
            guests: 6,
            features: ['와이파이', '수영장', '주차장'],
            points: 700,
            host: {
                name: '이지은',
                image: '/images/host2.jpg'
            }
        },
        {
            id: 3,
            title: '부산 해운대 오션뷰 콘도',
            image: '/images/listing3.jpg',
            location: '부산 해운대구',
            rating: 4.7,
            reviews: 76,
            bedrooms: 2,
            bathrooms: 1,
            guests: 4,
            features: ['와이파이', '에어컨', '헬스장'],
            points: 600,
            host: {
                name: '박준호',
                image: '/images/host3.jpg'
            }
        },
        {
            id: 4,
            title: '경주 한옥 스테이',
            image: '/images/listing4.jpg',
            location: '경북 경주시',
            rating: 4.9,
            reviews: 42,
            bedrooms: 2,
            bathrooms: 1,
            guests: 4,
            features: ['와이파이', '주방', '바베큐'],
            points: 450,
            host: {
                name: '최서연',
                image: '/images/host4.jpg'
            }
        },
        {
            id: 5,
            title: '인천 송도 럭셔리 아파트',
            image: '/images/listing5.jpg',
            location: '인천 연수구',
            rating: 4.6,
            reviews: 53,
            bedrooms: 3,
            bathrooms: 2,
            guests: 5,
            features: ['와이파이', '주차장', '헬스장'],
            points: 550,
            host: {
                name: '정현우',
                image: '/images/host5.jpg'
            }
        },
        {
            id: 6,
            title: '강원도 평창 산장',
            image: '/images/listing6.jpg',
            location: '강원 평창군',
            rating: 4.8,
            reviews: 37,
            bedrooms: 4,
            bathrooms: 2,
            guests: 8,
            features: ['와이파이', '바베큐', '주방'],
            points: 650,
            host: {
                name: '김지영',
                image: '/images/host6.jpg'
            }
        }
    ];

    // 필터링 적용
    let filteredListings = [...dummyListings];

    // 검색어 필터링
    if (query) {
        filteredListings = filteredListings.filter(listing =>
            listing.title.toLowerCase().includes(query.toLowerCase()) ||
            listing.location.toLowerCase().includes(query.toLowerCase())
        );
    }

    // 위치 필터링
    if (filters.location) {
        filteredListings = filteredListings.filter(listing =>
            listing.location.includes(filters.location)
        );
    }

    // 가격 필터링
    if (filters.maxPrice) {
        filteredListings = filteredListings.filter(listing =>
            listing.points <= parseInt(filters.maxPrice)
        );
    }

    // 침실 수 필터링
    if (filters.minBedrooms) {
        filteredListings = filteredListings.filter(listing =>
            listing.bedrooms >= parseInt(filters.minBedrooms)
        );
    }

    // 편의시설 필터링
    if (filters.amenities && filters.amenities.length > 0) {
        const amenityMap = {
            'wifi': '와이파이',
            'aircon': '에어컨',
            'kitchen': '주방',
            'washer': '세탁기',
            'pool': '수영장',
            'parking': '주차장',
            'gym': '헬스장',
            'bbq': '바베큐'
        };

        filteredListings = filteredListings.filter(listing => {
            return filters.amenities.every(amenity => {
                const koreanAmenity = amenityMap[amenity];
                return listing.features.includes(koreanAmenity);
            });
        });
    }

    // 정렬 적용
    if (filters.sort) {
        switch (filters.sort) {
            case 'price_low':
                filteredListings.sort((a, b) => a.points - b.points);
                break;
            case 'price_high':
                filteredListings.sort((a, b) => b.points - a.points);
                break;
            case 'rating':
                filteredListings.sort((a, b) => b.rating - a.rating);
                break;
            // 추천순은 기본 순서 유지
        }
    }

    // 약간의 지연 효과 (실제 API 호출 시뮬레이션)
    setTimeout(() => {
        renderListings(filteredListings);

        // 결과 개수 업데이트
        const listingsCount = document.getElementById('listings-count');
        if (listingsCount) {
            listingsCount.textContent = filteredListings.length;
        }

        renderPagination({
            currentPage: 1,
            totalPages: Math.ceil(filteredListings.length / 6),
            totalItems: filteredListings.length
        });
    }, 800);
}

// 숙소 목록 렌더링
function renderListings(listings) {
    const container = document.getElementById('listings-container');

    if (!container) return;

    container.innerHTML = '';

    if (listings.length === 0) {
        container.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
        return;
    }

    listings.forEach(listing => {
        const card = document.createElement('div');
        card.className = 'listing-card';

        card.innerHTML = `
            <a href="/page/listings/id" class="listing-link">
                <div class="listing-image">
                    <img src="image-url" alt="숙소 제목">
                    <div class="listing-rating">
                        <i class="fas fa-star"></i>
                        <span>4.5 (100)</span>
                    </div>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">숙소 제목</h3>
                    <div class="listing-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>위치</span>
                    </div>
                    <div class="listing-details">
                        <div class="listing-detail-item">
                            <i class="fas fa-bed"></i>
                            <span>침실 2개</span>
                        </div>
                        <div class="listing-detail-item">
                            <i class="fas fa-user-friends"></i>
                            <span>최대 4인</span>
                        </div>
                    </div>
                    <div class="listing-price">
                        500 P
                        <small>/ 1박</small>
                    </div>
                </div>
            </a>
        `;

        container.appendChild(card);
    });
}

// 페이지네이션 렌더링
// function renderPagination(pagination) {
//     const paginationContainer = document.getElementById('pagination');
//
//     if (!paginationContainer) return;
//
//     paginationContainer.innerHTML = '';
//
//     if (!pagination || pagination.totalPages <= 1) {
//         paginationContainer.style.display = 'none';
//         return;
//     }
//
//     paginationContainer.style.display = 'flex';
//
//     // 이전 페이지 버튼
//     const prevButton = document.createElement('button');
//     prevButton.className = `pagination-button ${pagination.currentPage === 1 ? 'disabled' : ''}`;
//     prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
//     prevButton.disabled = pagination.currentPage === 1;
//     prevButton.addEventListener('click', () => {
//         if (pagination.currentPage > 1) {
//             goToPage(pagination.currentPage - 1);
//         }
//     });
//     paginationContainer.appendChild(prevButton);
//
//     // 페이지 번호 버튼
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
//     const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
//
//     if (endPage - startPage + 1 < maxVisiblePages) {
//         startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }
//
//     for (let i = startPage; i <= endPage; i++) {
//         const pageButton = document.createElement('button');
//         pageButton.className = `pagination-button ${i === pagination.currentPage ? 'active' : ''}`;
//         pageButton.textContent = i;
//         pageButton.addEventListener('click', () => {
//             goToPage(i);
//         });
//         paginationContainer.appendChild(pageButton);
//     }
//
//     // 다음 페이지 버튼
//     const nextButton = document.createElement('button');
//     nextButton.className = `pagination-button ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`;
//     nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
//     nextButton.disabled = pagination.currentPage === pagination.totalPages;
//     nextButton.addEventListener('click', () => {
//         if (pagination.currentPage < pagination.totalPages) {
//             goToPage(pagination.currentPage + 1);
//         }
//     });
//     paginationContainer.appendChild(nextButton);
// }

// 페이지 이동
// function goToPage(page) {
//     // 실제 구현 시 API 호출 또는 상태 업데이트
//     console.log(`페이지 ${page}로 이동`);
//
//     // 페이지 상단으로 스크롤
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//
//     // 테스트용 - 페이지 변경 시뮬레이션
//     const paginationButtons = document.querySelectorAll('.pagination-button');
//     paginationButtons.forEach(button => {
//         if (button.textContent === page.toString()) {
//             button.classList.add('active');
//         } else if (!isNaN(button.textContent)) {
//             button.classList.remove('active');
//         }
//     });
//
//     // 필터 유지하면서 데이터 다시 불러오기
//     applyFilters();
// }

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
