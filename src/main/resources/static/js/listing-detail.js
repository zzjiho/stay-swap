$(document).ready(function() {
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
    const images = [
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

    // LiveLocal 경험 데이터 (실제로는 API에서 가져옴)
    const liveLocalExperiences = [
        {
            id: 1,
            title: '현지인 맛집 투어',
            description: '강남 현지인들만 아는 숨은 맛집을 소개해드립니다.',
            duration: 3,
            points: 100
        },
        {
            id: 2,
            title: '한강 자전거 투어',
            description: '한강을 따라 자전거를 타며 서울의 아름다운 경치를 감상하세요.',
            duration: 2,
            points: 80
        }
    ];

    // TimeBank 서비스 데이터 (실제로는 API에서 가져옴)
    const timeBankServices = [
        {
            id: 1,
            title: '한국어 회화 수업',
            description: '기초적인 한국어 회화를 배워보세요.',
            duration: 1,
            points: 50
        },
        {
            id: 2,
            title: '한식 요리 클래스',
            description: '김치찌개와 불고기 등 한국 전통 요리를 배워보세요.',
            duration: 2,
            points: 70
        }
    ];

    // LiveLocal 경험 렌더링
    function renderLiveLocalExperiences() {
        const container = $('#livelocal-container');
        container.empty();

        if (liveLocalExperiences.length === 0) {
            container.html('<p>제공되는 LiveLocal 경험이 없습니다.</p>');
            return;
        }

        liveLocalExperiences.forEach(exp => {
            const option = $('<div>').addClass('booking-option');
            option.html(`
                <div class="booking-option-info">
                    <h5>${exp.title}</h5>
                    <p>${exp.description}</p>
                    <div class="booking-option-duration">
                        <i class="far fa-clock"></i> ${exp.duration}시간
                    </div>
                </div>
                <div class="booking-option-action">
                    <div class="booking-option-price">${exp.points} P</div>
                    <div class="booking-option-select">
                        <label class="radio-label">
                            <input type="radio" name="livelocal" value="${exp.id}"> 선택
                        </label>
                    </div>
                </div>
            `);

            container.append(option);
        });
    }

    // TimeBank 서비스 렌더링
    function renderTimeBankServices() {
        const container = $('#timebank-container');
        container.empty();

        if (timeBankServices.length === 0) {
            container.html('<p>제공되는 TimeBank 서비스가 없습니다.</p>');
            return;
        }

        timeBankServices.forEach(service => {
            const option = $('<div>').addClass('booking-option');
            option.html(`
                <div class="booking-option-info">
                    <h5>${service.title}</h5>
                    <p>${service.description}</p>
                    <div class="booking-option-duration">
                        <i class="far fa-clock"></i> ${service.duration}시간
                    </div>
                </div>
                <div class="booking-option-action">
                    <div class="booking-option-price">${service.points} P</div>
                    <div class="booking-option-select">
                        <label class="radio-label">
                            <input type="radio" name="timebank" value="${service.id}"> 선택
                        </label>
                    </div>
                </div>
            `);

            container.append(option);
        });
    }

    // 초기 데이터 렌더링
    renderLiveLocalExperiences();
    renderTimeBankServices();

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

    // 내 숙소 데이터 (실제로는 API에서 가져옴)
    const myListings = [
        {
            id: 1,
            title: '제주 바다 전망 빌라',
            location: '제주 서귀포시',
            image: '/images/my-listing-1.jpg',
            points: 700
        },
        {
            id: 2,
            title: '부산 해운대 오션뷰 콘도',
            location: '부산 해운대구',
            image: '/images/my-listing-2.jpg',
            points: 600
        },
        {
            id: 3,
            title: '강원도 평창 산장',
            location: '강원 평창군',
            image: '/images/my-listing-3.jpg',
            points: 650
        }
    ];

    // 내 숙소 목록 렌더링
    function renderMyListings() {
        const container = $('.my-listings-container');
        container.empty();

        if (myListings.length === 0) {
            container.html('<p class="p-4 text-center">등록된 숙소가 없습니다.</p>');
            return;
        }

        myListings.forEach(listing => {
            const item = $('<div>').addClass('my-listing-item').attr('data-id', listing.id);
            item.html(`
                <div class="my-listing-image">
                    <img src="${listing.image}" alt="${listing.title}">
                </div>
                <div class="my-listing-info">
                    <div class="my-listing-title">${listing.title}</div>
                    <div class="my-listing-location">${listing.location}</div>
                </div>
                <div class="my-listing-points">${listing.points} P</div>
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
        $('#popup-checkin').text(formatDate(checkinDate));
        $('#popup-checkout').text(formatDate(checkoutDate));
        $('#popup-guests').text(guestCount);

        // 내 숙소 목록 렌더링
        renderMyListings();

        // 팝업 열기
        openPopup('exchange-popup');
    });

    // 숙박 요청 버튼 클릭 이벤트
    $('#stay-request-btn').on('click', function() {
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

    // 교환 요청 확인 버튼 클릭 이벤트
    $('#exchange-confirm').on('click', function() {
        const selectedListing = $('.my-listing-item.selected');

        if (selectedListing.length === 0) {
            alert('교환할 숙소를 선택해주세요.');
            return;
        }

        const listingId = selectedListing.data('id');
        const message = $('#exchange-message-text').val();

        // 실제 구현 시 API 호출
        console.log('교환 요청:', {
            listingId,
            checkinDate: $('#checkin-date').val(),
            checkoutDate: $('#checkout-date').val(),
            guestCount: $('#guest-count').val(),
            message
        });

        // 팝업 닫기
        closePopup('exchange-popup');

        // 성공 메시지
        alert('교환 요청이 성공적으로 전송되었습니다.');
    });

    // 숙박 요청 확인 버튼 클릭 이벤트
    $('#stay-confirm').on('click', function() {
        const message = $('#stay-message-text').val();

        // 실제 구현 시 API 호출
        console.log('숙박 요청:', {
            checkinDate: $('#checkin-date').val(),
            checkoutDate: $('#checkout-date').val(),
            guestCount: $('#guest-count').val(),
            totalPoints: $('#total-points').text(),
            message
        });

        // 팝업 닫기
        closePopup('stay-popup');

        // 성공 메시지
        alert('숙박 요청이 성공적으로 전송되었습니다.');
    });
});