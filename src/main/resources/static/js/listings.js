document.addEventListener('DOMContentLoaded', function() {
    // 숙소 목록 불러오기
    fetchListings();

    // 토글 버튼 이벤트 리스너
    const toggleButtons = document.querySelectorAll('.toggle-button');
    const viewPanes = document.querySelectorAll('.view-pane');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');

            // 버튼 활성화 상태 변경
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 뷰 패널 활성화 상태 변경
            viewPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(view + '-view').classList.add('active');
        });
    });
});

// 숙소 목록 불러오기
function fetchListings() {
    const listingsContainer = document.getElementById('listings-container');

    if (!listingsContainer) return;

    // API 호출 (실제 구현 시)
    // fetch('/api/listings')
    //     .then(response => response.json())
    //     .then(data => {
    //         renderListings(data.listings);
    //     })
    //     .catch(error => {
    //         console.error('Error:', error);
    //         listingsContainer.innerHTML = '<div class="listing-error">숙소 정보를 불러오는 데 실패했습니다.</div>';
    //     });

    // 임시 데이터 (API 연동 전)
    setTimeout(() => {
        const mockListings = [
            {
                id: 1,
                title: '서울 강남 모던 아파트',
                image: 'images/listing-1.jpg',
                location: '서울 강남구',
                rating: 4.9,
                points: 500,
                features: ['LiveLocal', '무료 주차'],
                host: {
                    name: '김민수',
                    image: 'images/host-1.jpg'
                }
            },
            {
                id: 2,
                title: '제주 바다 전망 독채',
                image: 'images/listing-2.jpg',
                location: '제주 서귀포시',
                rating: 4.8,
                points: 700,
                features: ['LiveLocal', 'TimeBank', '반려동물 동반'],
                host: {
                    name: '이지은',
                    image: 'images/host-2.jpg'
                }
            },
            {
                id: 3,
                title: '부산 해운대 오션뷰 콘도',
                image: 'images/listing-3.jpg',
                location: '부산 해운대구',
                rating: 4.7,
                points: 600,
                features: ['수영장', '무료 주차'],
                host: {
                    name: '박준호',
                    image: 'images/host-3.jpg'
                }
            },
            {
                id: 4,
                title: '경주 한옥 스테이',
                image: 'images/listing-4.jpg',
                location: '경북 경주시',
                rating: 4.9,
                points: 450,
                features: ['LiveLocal', 'TimeBank'],
                host: {
                    name: '최서연',
                    image: 'images/host-4.jpg'
                }
            },
            {
                id: 5,
                title: '인천 송도 럭셔리 아파트',
                image: 'images/listing-5.jpg',
                location: '인천 연수구',
                rating: 4.6,
                points: 550,
                features: ['무료 주차', '헬스장'],
                host: {
                    name: '정현우',
                    image: 'images/host-5.jpg'
                }
            },
            {
                id: 6,
                title: '강원도 평창 통나무집',
                image: 'images/listing-6.jpg',
                location: '강원 평창군',
                rating: 4.8,
                points: 650,
                features: ['LiveLocal', '바베큐'],
                host: {
                    name: '김지영',
                    image: 'images/host-6.jpg'
                }
            }
        ];

        renderListings(mockListings);
    }, 1000);
}

// 숙소 목록 렌더링
function renderListings(listings) {
    const listingsContainer = document.getElementById('listings-container');

    if (!listingsContainer) return;

    // 로딩 표시 제거
    listingsContainer.innerHTML = '';

    if (listings.length === 0) {
        listingsContainer.innerHTML = '<div class="listing-empty">검색 결과가 없습니다.</div>';
        return;
    }

    // 숙소 카드 템플릿 가져오기
    const template = document.getElementById('listing-card-template');

    // 각 숙소에 대해 카드 생성
    listings.forEach(listing => {
        const card = template.content.cloneNode(true);

        // 링크 설정
        const link = card.querySelector('.listing-link');
        link.href = `listing-detail.html?id=${listing.id}`;

        // 이미지 설정
        const image = card.querySelector('.listing-image img');
        image.src = listing.image;
        image.alt = listing.title;

        // 제목 설정
        const title = card.querySelector('.listing-title');
        title.textContent = listing.title;

        // 평점 설정
        const rating = card.querySelector('.listing-rating span');
        rating.textContent = listing.rating;

        // 위치 설정
        const location = card.querySelector('.listing-location span');
        location.textContent = listing.location;

        // 특징 배지 설정
        const features = card.querySelector('.listing-features');
        listing.features.forEach(feature => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-outline';
            badge.textContent = feature;
            features.appendChild(badge);
        });

        // 가격 설정
        const price = card.querySelector('.listing-price span');
        price.textContent = `${listing.points} P`;

        // 호스트 정보 설정
        const hostImage = card.querySelector('.listing-host .avatar img');
        hostImage.src = listing.host.image;
        hostImage.alt = listing.host.name;

        const hostName = card.querySelector('.listing-host span');
        hostName.textContent = listing.host.name;

        // 카드 추가
        listingsContainer.appendChild(card);
    });
}