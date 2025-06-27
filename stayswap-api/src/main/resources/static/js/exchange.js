$(document).ready(function() {
    // 전역 변수
    let currentPage = 0;
    const pageSize = 10;
    let isLoading = false;
    let isLastPage = false;
    let activeType = "guest"; // 기본값은 게스트 모드
    let activeStatus = "all"; // 기본값은 모든 상태
    let isInitialized = false; // 초기화 중복 방지 플래그

    // 페이지 초기화 시 로딩 표시
    showInitialLoading();
    
    // auth-common.js의 인증 상태 이벤트에만 의존
    waitForAuthAndInitialize();

    /**
     * 초기 로딩 화면 표시
     */
    function showInitialLoading() {
        $(".exchange-list").html(`
            <div class="exchange-loading initial-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>교환/숙박 정보를 불러오는 중입니다...</p>
            </div>
        `);
    }

    /**
     * auth-common.js의 인증 상태를 기다리고 초기화
     */
    function waitForAuthAndInitialize() {
        console.log('🔍 Exchange.js - 인증 상태 대기 중');
        
        // authStateChanged 이벤트 리스너 등록
        document.addEventListener('authStateChanged', function(e) {
            console.log('🔍 Exchange.js - authStateChanged 이벤트 수신:', e.detail.isLoggedIn);
            
            if (e.detail.isLoggedIn && !isInitialized) {
                // 로그인 상태: 데이터 로드 및 이벤트 리스너 설정 (중복 방지)
                console.log('🔍 Exchange.js - 이벤트로부터 초기화 시작');
                isInitialized = true;
                setupEventListeners();
                loadSwapList(true);
            } else if (e.detail.isLoggedIn && isInitialized) {
                console.log('🔍 Exchange.js - 이미 초기화됨, 이벤트 무시');
            } else if (!e.detail.isLoggedIn) {
                // 로그아웃 상태: 로그인 페이지로 리디렉션
                console.log('🔍 Exchange.js - 로그인이 필요하여 리디렉션');
                window.location.href = "/page/auth?redirect=" + encodeURIComponent(window.location.pathname);
            }
        });
        
        // auth-common.js가 아직 초기화되지 않았을 경우를 대비한 체크
        setTimeout(() => {
            if (!isInitialized && typeof window.isLoggedIn === 'function' && window.isLoggedIn()) {
                console.log('🔍 Exchange.js - setTimeout으로부터 초기화 시작');
                isInitialized = true;
                setupEventListeners();
                loadSwapList(true);
            } else if (isInitialized) {
                console.log('🔍 Exchange.js - 이미 초기화됨, setTimeout 무시');
            } else if (typeof window.auth !== 'undefined' && window.auth.isInitialized === false) {
                // auth-common.js가 아직 초기화 중인 경우 잠시 더 대기
                console.log('🔍 Exchange.js - auth-common.js 초기화 대기 중');
            } else {
                // 로그인되지 않은 상태
                console.log('🔍 Exchange.js - 로그인되지 않은 상태');
                window.location.href = "/page/auth?redirect=" + encodeURIComponent(window.location.pathname);
            }
        }, 300); // auth-common.js 초기화 완료 대기
    }

    /**
     * 이벤트 리스너 설정
     */
    function setupEventListeners() {
        // 중복 등록 방지
        if (window.exchangeEventListenersAdded) {
            console.log('🔍 Exchange.js - 이벤트 리스너 이미 등록됨');
            return;
        }
        window.exchangeEventListenersAdded = true;
        console.log('🔍 Exchange.js - 이벤트 리스너 등록 시작');
        
    // 예약 유형 탭 기능
        $(".booking-type-tab").on("click", function() {
            // 탭 활성화 상태 변경
            $(".booking-type-tab").removeClass("active");
            $(this).addClass("active");

            // 선택된 유형에 따라 교환 항목 필터링
            activeType = $(this).data("type");
            resetSearch();
        });

    // 상태 필터 기능
        $(".status-filter").on("click", function() {
            // 필터 활성화 상태 변경
            $(".status-filter").removeClass("active");
            $(this).addClass("active");

            // 선택된 상태에 따라 교환 항목 필터링
            activeStatus = $(this).data("status");
            resetSearch();
        });

        // 무한 스크롤
        $(window).on("scroll", function() {
            if (!isLoading && !isLastPage &&
                $(window).scrollTop() + $(window).height() >
                $(document).height() - 300) {
                currentPage++;
                loadSwapList(false);
            }
        });
    }

    /**
     * 검색 초기화 및 재검색
     */
    function resetSearch() {
        currentPage = 0;
        isLastPage = false;
        loadSwapList(true);
    }

    /**
     * 교환/숙박 목록 로드
     */
    function loadSwapList(resetList) {
        console.log('🔍 Exchange.js - loadSwapList 호출됨, resetList:', resetList, 'currentPage:', currentPage);
        
        if (isLoading) {
            console.log('🔍 Exchange.js - 이미 로딩 중이라 건너뜀');
            return;
        }

        isLoading = true;
        showLoading(resetList);

        // API 엔드포인트 결정
        let apiUrl = "";
        if (activeType === "guest") {
            apiUrl = "/api/house/swap/list/requester";
                } else {
            apiUrl = "/api/house/swap/list/host";
        }

        // API 요청 파라미터 구성
        const params = {
            page: currentPage,
            size: pageSize
        };

        // 상태 필터 적용
        if (activeStatus !== "all") {
            params.swapStatus = convertStatusToApi(activeStatus);
        }

        // URL에 쿼리 파라미터 추가
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = `${apiUrl}?${queryString}`;

        // fetchWithAuth 함수를 사용하여 인증된 API 호출
        let apiCall;
        
        // auth-common.js의 fetchWithAuth 함수 사용 (인증 처리 포함)
        if (typeof window.fetchWithAuth === 'function') {
            apiCall = window.fetchWithAuth(fullUrl);
        } else {
            // fetchWithAuth가 없는 경우 일반 fetch 사용 (fallback)
            console.warn('fetchWithAuth 함수가 없어서 일반 fetch 사용');
            apiCall = fetch(fullUrl, {
                headers: {
                    'Authorization': `Bearer ${window.auth?.accessToken || ''}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        }
        
        apiCall
            .then(response => {
                if (!response || !response.ok) {
                    throw new Error(`API 응답 오류: ${response?.status || 'Unknown'}`);
                }
                return response.json();
            })
            .then(response => {
                handleSuccessResponse(response, resetList);
            })
            .catch(error => {
                handleErrorResponse(error);
            })
            .finally(() => {
                isLoading = false;
                hideLoading();
            });
    }

    /**
     * 성공 응답 처리
     * @param {Object} response - API 응답
     * @param {boolean} resetList - 목록 초기화 여부
     */
    function handleSuccessResponse(response, resetList) {
        const container = $(".exchange-list");
        const exchanges = response.data.content;

        // 목록 초기화가 필요한 경우
        if (resetList) {
            container.empty();
        }

        // 결과가 없는 경우
        if (exchanges.length === 0 && currentPage === 0) {
            container.html('<div class="no-results">검색 결과가 없습니다.</div>');
            return;
        }

        // 목록 렌더링
        renderExchanges(exchanges);

        // 마지막 페이지 체크
        isLastPage = response.data.last;
    }

    /**
     * 에러 응답 처리
     */
    function handleErrorResponse(error) {
        console.error("API 오류:", error);

        let errorMessage = "서버와 통신 중 오류가 발생했습니다.";
        
        // 에러 객체에서 메시지 추출 시도
        if (error.message) {
            errorMessage = error.message;
        } else if (error.responseJSON && error.responseJSON.errorMessage) {
            errorMessage = error.responseJSON.errorMessage;
        }

        $(".exchange-list").html(`
            <div class="api-error">
                <i class="fas fa-exclamation-circle"></i>
                <p>${errorMessage}</p>
                <button id="retry-button" class="retry-button">다시 시도</button>
            </div>
        `);

        $("#retry-button").on("click", function() {
            resetSearch();
        });
    }

    /**
     * 교환/숙박 목록 렌더링
     */
    function renderExchanges(exchanges) {
        const container = $(".exchange-list");

        exchanges.forEach(function(exchange) {
            // 상태 포맷팅
            const statusClass = convertStatusToClass(exchange.swapStatus);
            const statusText = convertStatusToText(exchange.swapStatus);

            // 교환/숙박 카드 HTML 생성
            const card = $("<div>").addClass("exchange-item").attr({
                "data-type": activeType,
                "data-status": convertStatusToFront(exchange.swapStatus),
                "data-house-id": exchange.hostHouseId,
                "data-requester-house-id": exchange.requesterHouseId
            });

            let itemHtml = `
                <div class="exchange-status ${statusClass}">${statusText}</div>
                <div class="exchange-content">
                    <div class="exchange-image">
                        <img src="${exchange.imageUrl || '/images/placeholder.jpg'}" alt="${exchange.houseTitle}">
                    </div>
                    <div class="exchange-details">
                        <h3 class="exchange-title">${exchange.houseTitle}</h3>
            `;

            if (activeType === "guest") {
                itemHtml += `
                    <div class="exchange-host">
                        <span>숙소 유형: ${formatHouseType(exchange.houseType)}</span>
                    </div>
                `;
            } else {
                itemHtml += `
                    <div class="exchange-guest">
                        <img src="/images/profile.png" alt="게스트 이미지" class="guest-avatar">
                        <span>요청자: ${exchange.requesterName}</span>
                    </div>
                `;
            }

            itemHtml += `
                        <div class="exchange-date">
                            <i class="far fa-calendar"></i>
                            <span>${formatDate(exchange.startDate)} - ${formatDate(exchange.endDate)}</span>
                        </div>
                        <div class="${exchange.swapType === "SWAP" ? "exchange-type clickable" : "exchange-type"}">
                            <i class="${exchange.swapType === "SWAP" ? "fas fa-exchange-alt" : "fas fa-bed"}"></i>
                            <span>${exchange.swapType === "SWAP" ? "교환" : "숙박"}</span>
                        </div>
                    </div>
                    <div class="exchange-actions">
                        <button class="btn btn-primary view-detail" data-id="${exchange.swapId}">상세 보기</button>
                        ${getActionButton(exchange)}
                    </div>
                </div>
            `;

            card.html(itemHtml);
            container.append(card);
        });

        // 상세 보기 버튼 이벤트 연결
        $(".view-detail").on("click", function() {
            // 카드에 저장된 hostHouseId 바로 사용
            const houseId = $(this).closest(".exchange-item").data("house-id");
            window.location.href = `/page/listing-detail?id=${houseId}`;
        });
        
        // 교환 타입 클릭 이벤트 연결 (교환일 때만 클릭 가능)
        $(".exchange-item").on("click", ".exchange-type.clickable", function() {
            // 카드에 저장된 requesterHouseId 사용
            const requesterHouseId = $(this).closest(".exchange-item").data("requester-house-id");
            if (requesterHouseId) {
                window.location.href = `/page/listing-detail?id=${requesterHouseId}`;
            } else {
                alert("교환 상대방의 숙소 정보가 없습니다.");
            }
        });

        // 액션 버튼 이벤트 연결
        setupActionButtons();
    }

    /**
     * 액션 버튼 이벤트 설정
     */
    function setupActionButtons() {
        // 취소 요청 버튼
        $(".cancel-request").on("click", function() {
            const swapId = $(this).data("id");
            const itemStatus = $(this).closest(".exchange-item").data("status");
            const itemType = $(this).closest(".exchange-item").data("type");
            
            let confirmMessage = "교환/숙박 요청을 취소하시겠습니까?";
            
            if (itemStatus === "confirmed") {
                confirmMessage = "확정된 교환/숙박을 취소하시겠습니까? 취소 시 패널티가 부과될 수 있습니다.";
            }
            
            if (itemType === "host" && itemStatus === "pending") {
                confirmMessage = "받은 교환/숙박 요청을 취소하시겠습니까?";
            }
            
            if (confirm(confirmMessage)) {
                // 취소 API 호출 로직 추가
                cancelSwapRequest(swapId);
            }
        });

        // 수락 버튼
        $(".accept-request").on("click", function() {
            const swapId = $(this).data("id");
            if (confirm("교환/숙박 요청을 수락하시겠습니까?")) {
                // 수락 API 호출 로직 추가
                acceptSwapRequest(swapId);
            }
        });

        // 거절 버튼
        $(".reject-request").on("click", function() {
            const swapId = $(this).data("id");
            if (confirm("교환/숙박 요청을 거절하시겠습니까?")) {
                // 거절 API 호출 로직 추가
                rejectSwapRequest(swapId);
            }
        });

        // 메시지 보내기 버튼
        $(".send-message").on("click", function() {
            const swapId = $(this).data("id");
            // 메시지 보내기 페이지로 이동 또는 모달 표시
            alert("메시지 기능은 준비 중입니다.");
        });
    }

    /**
     * 교환/숙박 요청 취소
     */
    function cancelSwapRequest(swapId) {
        if (typeof window.fetchWithAuth !== 'function') {
            console.error('fetchWithAuth 함수가 없습니다.');
            alert('인증 처리 중 오류가 발생했습니다.');
            return;
        }
        
        window.fetchWithAuth(`/api/house/swap/${swapId}/cancel`, {
            method: "POST"
        })
        .then(response => {
            if (!response.ok) {
                // 서버에서 오는 에러 메시지를 파싱
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "취소 요청 실패");
                });
            }
            return response.json();
        })
        .then(data => {
            alert("요청이 취소되었습니다.");
            resetSearch();
        })
        .catch(error => {
            console.error("취소 요청 중 오류:", error);
            alert(error.message || "요청 취소 중 오류가 발생했습니다.");
        });
    }

    /**
     * 교환/숙박 요청 수락
     */
    function acceptSwapRequest(swapId) {
        if (typeof window.fetchWithAuth !== 'function') {
            console.error('fetchWithAuth 함수가 없습니다.');
            alert('인증 처리 중 오류가 발생했습니다.');
            return;
        }
        
        window.fetchWithAuth(`/api/house/swap/${swapId}/accept`, {
            method: "POST"
        })
        .then(response => {
            if (!response.ok) {
                // 서버에서 오는 에러 메시지를 파싱
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "수락 요청 실패");
                });
            }
            return response.json();
        })
        .then(data => {
            alert("요청이 수락되었습니다.");
            resetSearch();
        })
        .catch(error => {
            console.error("수락 요청 중 오류:", error);
            alert(error.message || "요청 수락 중 오류가 발생했습니다.");
        });
    }

    /**
     * 교환/숙박 요청 거절
     */
    function rejectSwapRequest(swapId) {
        if (typeof window.fetchWithAuth !== 'function') {
            console.error('fetchWithAuth 함수가 없습니다.');
            alert('인증 처리 중 오류가 발생했습니다.');
            return;
        }
        
        window.fetchWithAuth(`/api/house/swap/${swapId}/reject`, {
            method: "POST"
        })
        .then(response => {
            if (!response.ok) {
                // 서버에서 오는 에러 메시지를 파싱
                return response.json().then(errorData => {
                    throw new Error(errorData.message || "거절 요청 실패");
                });
            }
            return response.json();
        })
        .then(data => {
            alert("요청이 거절되었습니다.");
            resetSearch();
        })
        .catch(error => {
            console.error("거절 요청 중 오류:", error);
            alert(error.message || "요청 거절 중 오류가 발생했습니다.");
        });
    }

    /**
     * 로딩 표시 함수
     */
    function showLoading(isNewSearch) {
        if (isNewSearch) {
            $(".exchange-list").html(`
                <div class="exchange-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>교환/숙박 정보를 불러오는 중입니다...</p>
                </div>
            `);
        } else {
            $(".loading-indicator").show();
        }
    }

    /**
     * 로딩 표시 제거 함수
     */
    function hideLoading() {
        $(".exchange-loading").remove();
        $(".loading-indicator").hide();
    }

    /**
     * API 상태를 프론트엔드 상태로 변환
     */
    function convertStatusToFront(apiStatus) {
        const statusMap = {
            "PENDING": "pending",
            "ACCEPTED": "confirmed",
            "COMPLETED": "completed",
            "REJECTED": "cancelled"
        };

        return statusMap[apiStatus] || "pending";
    }

    /**
     * 프론트엔드 상태를 API 상태로 변환
     */
    function convertStatusToApi(frontStatus) {
        const statusMap = {
            "pending": "PENDING",
            "confirmed": "ACCEPTED",
            "completed": "COMPLETED",
            "cancelled": "REJECTED"
        };

        return statusMap[frontStatus] || "PENDING";
    }

    /**
     * 상태에 따른 CSS 클래스
     */
    function convertStatusToClass(status) {
        const classMap = {
            "PENDING": "pending",
            "ACCEPTED": "confirmed",
            "COMPLETED": "completed",
            "REJECTED": "cancelled"
        };

        return classMap[status] || "pending";
    }

    /**
     * 상태에 따른 표시 텍스트
     */
    function convertStatusToText(status) {
        const textMap = {
            "PENDING": "대기중",
            "ACCEPTED": "확정됨",
            "COMPLETED": "완료됨",
            "REJECTED": "거절됨"
        };

        return textMap[status] || "대기중";
    }

    /**
     * 상태에 따른 액션 버튼 생성
     */
    function getActionButton(exchange) {
        const status = exchange.swapStatus;
        
        if (activeType === "guest") {
            if (status === "PENDING") {
                return `<button class="btn btn-outline cancel-request" data-id="${exchange.swapId}">취소 요청</button>`;
            } else if (status === "ACCEPTED") {
                return `
                    <button class="btn btn-outline send-message" data-id="${exchange.swapId}">메시지 보내기</button>
                    <button class="btn btn-outline cancel-request" data-id="${exchange.swapId}">취소 요청</button>
                `;
            }
        } else { // 호스트
            if (status === "PENDING") {
                return `
                    <button class="btn btn-outline accept-request" data-id="${exchange.swapId}">수락</button>
                    <button class="btn btn-outline reject-request" data-id="${exchange.swapId}">거절</button>
                `;
            } else if (status === "ACCEPTED") {
                return `
                    <button class="btn btn-outline send-message" data-id="${exchange.swapId}">메시지 보내기</button>
                    <button class="btn btn-outline cancel-request" data-id="${exchange.swapId}">취소 요청</button>
                `;
            }
        }
        
        return "";
    }

    /**
     * 날짜 포맷팅
     */
    function formatDate(dateString) {
        if (!dateString) return "";
        
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    /**
     * 숙소 유형 포맷팅
     */
    function formatHouseType(type) {
        const typeMap = {
            "APT": "아파트",
            "HOUSE": "주택",
            "VILLA": "빌라",
            "OFFICETEL": "오피스텔"
        };

        return typeMap[type] || "기타";
    }
});
