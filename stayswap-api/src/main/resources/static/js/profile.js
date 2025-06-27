document.addEventListener("DOMContentLoaded", () => {
    // 초기 로딩 표시
    showInitialLoading();
    
    // 인증 상태 확인 및 초기화
    checkAuthAndInitialize();

    // 프로필 탭 기능
    const profileTabs = document.querySelectorAll(".profile-tab")
    const profileContents = document.querySelectorAll(".profile-tab-content")

    profileTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const tabName = this.getAttribute("data-tab")

            // 탭 활성화 상태 변경
            profileTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            profileContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${tabName}-content`).classList.add("active")
        })
    })

    // 후기 탭 기능
    const reviewsTabs = document.querySelectorAll(".reviews-tab")
    const reviewsContents = document.querySelectorAll(".reviews-content")

    reviewsTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const reviewsType = this.getAttribute("data-reviews")

            // 탭 활성화 상태 변경
            reviewsTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            reviewsContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${reviewsType}-reviews`).classList.add("active")
        })
    })

    // 소개 수정 버튼
    const editIntroBtn = document.querySelector(".edit-intro-btn")
    if (editIntroBtn) {
        editIntroBtn.addEventListener("click", () => {
            openEditIntroModal();
        })
    }

    // 정보 수정 버튼
    const editInfoBtn = document.querySelector(".edit-info-btn")
    if (editInfoBtn) {
        editInfoBtn.addEventListener("click", () => {
            // 실제 구현 시 정보 수정 모달 또는 페이지로 이동
            alert("정보 수정 기능은 아직 구현되지 않았습니다.")
        })
    }
})

/**
 * 초기 로딩 화면 표시
 */
function showInitialLoading() {
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.innerHTML = `
            <div class="initial-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>프로필 정보를 불러오는 중입니다...</p>
                </div>
            </div>
        `;
    }
}

/**
 * 인증 상태 확인 및 초기화
 */
async function checkAuthAndInitialize() {
    // auth-common.js가 로드되어 있는지 확인
    if (typeof window.auth === 'undefined') {
        console.error("인증 모듈이 로드되지 않았습니다.");
        window.location.href = "/page/auth";
        return;
    }

    // auth-common.js가 이미 초기화를 완료했는지 확인
    if (!window.auth.isInitialized) {
        // 초기화가 아직 완료되지 않았다면 잠시 대기
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.auth.isInitialized) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // 최대 5초 대기
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    // 인증 상태 확인
    if (!window.auth.accessToken || (typeof window.isTokenExpired === 'function' && window.isTokenExpired())) {
        // 인증 실패 시 로그인 페이지로 리디렉션
        window.location.href = "/page/auth?redirect=" + encodeURIComponent(window.location.pathname);
        return;
    }

    // 인증 성공 시 사용자 정보 로드
    loadUserInfo();
}

/**
 * 사용자 정보를 API에서 가져와 화면에 표시
 */
function loadUserInfo() {
    // 로딩 표시
    showLoading();
    
    // fetchWithAuth 함수를 사용하여 인증된 API 호출
    fetchWithAuth('/api/user/me')
        .then(response => {
            if (!response || !response.ok) {
                throw new Error("API 응답 오류");
            }
            return response.json();
        })
        .then(response => {
            if (response && response.data) {
                // 프로필 컨테이너 초기화 및 HTML 구성
                renderProfileHTML(response.data);
                // 이벤트 리스너 다시 설정
                setupProfileEventListeners();
                // 사용자 정보로 UI 업데이트
                updateUserInfo(response.data);
            }
        })
        .catch(error => {
            console.error('사용자 정보 로드 실패:', error);
            showError('사용자 정보를 불러오는 데 실패했습니다.');
        })
        .finally(() => {
            hideLoading();
        });
}

/**
 * 프로필 HTML 구성
 */
function renderProfileHTML(userData) {
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;
    
    profileContainer.innerHTML = `
        <!-- 프로필 헤더 -->
        <div class="profile-header">
            <div class="profile-cover">
<!--                <img src="/images/profile-cover.jpg" alt="커버 이미지" class="cover-image">-->
                <div class="profile-avatar-container">
                    <img src="${userData.profile || '/images/profile-avatar.jpg'}" alt="프로필 이미지" class="profile-avatar">
                    <button class="edit-avatar-btn">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
            </div>
            <div class="profile-info">
                <h1 class="profile-name">${userData.name || userData.nickname}</h1>
                <div class="profile-meta">
                    <div class="profile-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${userData.joinYear || ''}년에 가입</span>
                    </div>
                    <div class="profile-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>서울, 대한민국</span>
                    </div>
                    <div class="profile-meta-item">
                        <i class="fas fa-star"></i>
                        <span>후기 ${userData.reviewCount || 0}개</span>
                    </div>
                </div>
                <div class="profile-badges">
                    <div class="profile-badge">
                        <i class="fas fa-check-circle"></i>
                        <span>본인 인증 완료</span>
                    </div>
                    <div class="profile-badge">
                        <i class="fas fa-award"></i>
                        <span>슈퍼호스트</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 프로필 탭 -->
        <div class="profile-tabs">
            <button class="profile-tab active" data-tab="intro">
                <i class="fas fa-user"></i>
                <span>소개</span>
            </button>
            <button class="profile-tab" data-tab="listings">
                <i class="fas fa-home"></i>
                <span>내 숙소</span>
            </button>
            <button class="profile-tab" data-tab="reviews">
                <i class="fas fa-star"></i>
                <span>후기</span>
            </button>
            <button class="profile-tab" data-tab="settings">
                <i class="fas fa-cog"></i>
                <span>설정</span>
            </button>
        </div>

        <!-- 프로필 콘텐츠 -->
        <div class="profile-content">
            <!-- 소개 탭 -->
            <div class="profile-tab-content active" id="intro-content">
                <h2 class="content-title">소개</h2>
                <div class="intro-section">
                    <p class="intro-text">${userData.introduction || '소개가 없습니다. 소개를 추가해보세요!'}</p>
                    <button class="btn btn-outline edit-intro-btn">
                        <i class="fas fa-edit"></i> 소개 수정
                    </button>
                </div>
            </div>

            <!-- 내 숙소 탭 -->
            <div class="profile-tab-content" id="listings-content">
                <h2 class="content-title">내 숙소</h2>
                <div class="listings-header">
                    <a href="/page/host/listings/new" class="btn btn-primary">
                        <i class="fas fa-plus"></i> 새 숙소 등록
                    </a>
                </div>
                <div class="listings-grid">
                    <!-- 숙소 목록은 별도 API 호출로 로드 -->
                </div>
            </div>

            <!-- 후기 탭 -->
            <div class="profile-tab-content" id="reviews-content">
                <h2 class="content-title">후기</h2>
                <div class="reviews-tabs">
                    <button class="reviews-tab active" data-reviews="received">받은 후기</button>
                    <button class="reviews-tab" data-reviews="written">작성한 후기</button>
                </div>
                <div class="reviews-content-container">
                    <div class="reviews-content active" id="received-reviews">
                        <!-- 받은 후기 목록 -->
                    </div>
                    <div class="reviews-content" id="written-reviews">
                        <!-- 작성한 후기 목록 -->
                    </div>
                </div>
            </div>

            <!-- 설정 탭 -->
            <div class="profile-tab-content" id="settings-content">
                <h2 class="content-title">설정</h2>
                <div class="settings-section">
                    <h3 class="section-title">계정 설정</h3>
                    <div class="settings-card">
                        <div class="settings-item">
                            <div class="settings-label">이메일</div>
                            <div class="settings-value">${userData.email || ''}</div>
                        </div>
                        <div class="settings-item">
                            <div class="settings-label">닉네임</div>
                            <div class="settings-value">${userData.nickname || ''}</div>
                            <button class="btn btn-sm btn-outline">변경</button>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <h3 class="section-title">알림 설정</h3>
                    <div class="settings-card">
                        <div class="settings-toggle">
                            <div class="toggle-label">푸시 알림</div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-toggle">
                            <div class="toggle-label">이메일 알림</div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="settings-toggle">
                            <div class="toggle-label">마케팅 정보 수신</div>
                            <label class="toggle-switch">
                                <input type="checkbox">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // DOM 수정 후 헤더 드롭다운 재초기화
    console.log('🔍 Profile.js - DOM 수정 완료, 드롭다운 재초기화 시도');
    if (typeof window.reinitializeDropdowns === 'function') {
        setTimeout(() => {
            console.log('🔍 Profile.js - reinitializeDropdowns 호출');
            window.reinitializeDropdowns();
            
            // 재초기화 후 알림 버튼 상태 확인
            const notificationToggle = document.getElementById('notification-dropdown-toggle');
            console.log('🔍 Profile.js - 재초기화 후 알림 버튼 상태:', {
                exists: !!notificationToggle,
                hasClickListener: notificationToggle?.onclick !== null,
                dataset: notificationToggle?.dataset
            });
        }, 100);
    } else {
        console.error('🔍 Profile.js - reinitializeDropdowns 함수가 없음');
    }
}

/**
 * 프로필 페이지 이벤트 리스너 설정
 */
function setupProfileEventListeners() {
    // 프로필 탭 기능
    const profileTabs = document.querySelectorAll(".profile-tab")
    const profileContents = document.querySelectorAll(".profile-tab-content")

    profileTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const tabName = this.getAttribute("data-tab")

            // 탭 활성화 상태 변경
            profileTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            profileContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${tabName}-content`).classList.add("active")
        })
    })

    // 후기 탭 기능
    const reviewsTabs = document.querySelectorAll(".reviews-tab")
    const reviewsContents = document.querySelectorAll(".reviews-content")

    reviewsTabs.forEach((tab) => {
        tab.addEventListener("click", function () {
            const reviewsType = this.getAttribute("data-reviews")

            // 탭 활성화 상태 변경
            reviewsTabs.forEach((t) => t.classList.remove("active"))
            this.classList.add("active")

            // 콘텐츠 활성화 상태 변경
            reviewsContents.forEach((content) => {
                content.classList.remove("active")
            })

            document.getElementById(`${reviewsType}-reviews`).classList.add("active")
        })
    })

    // 소개 수정 버튼
    const editIntroBtn = document.querySelector(".edit-intro-btn")
    if (editIntroBtn) {
        editIntroBtn.addEventListener("click", () => {
            openEditIntroModal();
        })
    }
    
    // 무한 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', handleInfiniteScroll);
    
    // 푸시 알림 토글 이벤트 리스너 설정
    setupPushNotificationToggle();
}

/**
 * 무한 스크롤 처리 함수
 */
function handleInfiniteScroll() {
    // 현재 활성화된 탭 확인
    const listingsTab = document.querySelector('.profile-tab[data-tab="listings"]');
    const reviewsTab = document.querySelector('.profile-tab[data-tab="reviews"]');
    
    // listings 탭이 활성화된 경우
    if (listingsTab && listingsTab.classList.contains('active')) {
        const listingsGrid = document.querySelector('.listings-grid');
        if (!listingsGrid) return;
        
        // 스크롤 위치 확인
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // 페이지 하단에 도달했고, 로딩 중이 아니고, 다음 페이지가 있는 경우
        if (scrollTop + clientHeight >= scrollHeight - 300 && !isLoading && hasNextPage) {
            // 다음 페이지 로드
            loadMyHouses(currentPage + 1);
        }
    }
    // reviews 탭이 활성화된 경우
    else if (reviewsTab && reviewsTab.classList.contains('active')) {
        // 현재 활성화된 리뷰 탭 확인 (받은 후기 또는 작성한 후기)
        const receivedReviewsTab = document.querySelector('.reviews-tab[data-reviews="received"]');
        const writtenReviewsTab = document.querySelector('.reviews-tab[data-reviews="written"]');
        
        // 스크롤 위치 확인
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // 받은 후기 탭이 활성화된 경우
        if (receivedReviewsTab && receivedReviewsTab.classList.contains('active')) {
            if (scrollTop + clientHeight >= scrollHeight - 300 && !receivedReviewsLoading && receivedReviewsHasNext) {
                loadReceivedReviews(receivedReviewsPage + 1);
            }
        }
        // 작성한 후기 탭이 활성화된 경우
        else if (writtenReviewsTab && writtenReviewsTab.classList.contains('active')) {
            if (scrollTop + clientHeight >= scrollHeight - 300 && !writtenReviewsLoading && writtenReviewsHasNext) {
                loadWrittenReviews(writtenReviewsPage + 1);
            }
        }
    }
}

/**
 * 로딩 표시
 */
function showLoading() {
    // 로딩 오버레이 생성
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>정보를 불러오는 중입니다...</p>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
}

/**
 * 로딩 숨기기
 */
function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * 에러 메시지 표시
 */
function showError(message) {
    alert(message);
}

/**
 * 사용자 정보로 UI 업데이트
 */
function updateUserInfo(userData) {
    // 이미 renderProfileHTML에서 대부분의 정보를 표시했으므로
    // 추가적인 업데이트가 필요한 경우에만 여기에 구현
    console.log('사용자 정보 로드 완료:', userData);
    
    // 내 숙소 목록 로드
    loadMyHouses();
    
    // 후기 목록 로드
    loadReceivedReviews();
    loadWrittenReviews();
    
    // 푸시 알림 설정 로드
    loadPushNotificationSettings();
}

/**
 * 소개 수정 모달 열기
 */
function openEditIntroModal() {
    // 기존 소개 텍스트 가져오기
    const currentIntro = document.querySelector('.intro-text').textContent;
    
    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>소개 수정</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="intro-textarea" rows="5" placeholder="자기소개를 입력하세요...">${currentIntro}</textarea>
            </div>
            <div class="modal-footer">
                <button id="save-intro" class="btn btn-primary">저장</button>
                <button class="btn btn-outline cancel-modal">취소</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 닫기 이벤트
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.cancel-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    // 저장 버튼 이벤트
    modal.querySelector('#save-intro').addEventListener('click', () => {
        const newIntro = modal.querySelector('#intro-textarea').value;
        saveIntroduction(newIntro);
        modal.remove();
    });
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * 소개 저장 API 호출
 */
function saveIntroduction(introText) {
    // 로딩 표시
    showLoading();
    
    // fetchWithAuth 함수를 사용하여 인증된 API 호출
    fetchWithAuth('/api/user/introduction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ introduction: introText })
    })
    .then(response => {
        if (!response || !response.ok) {
            throw new Error("API 응답 오류");
        }
        return response.json();
    })
    .then(data => {
        // 성공 시 UI 업데이트
        document.querySelector('.intro-text').textContent = introText;
        alert('소개가 성공적으로 저장되었습니다.');
    })
    .catch(error => {
        console.error('소개 저장 실패:', error);
        showError('소개 저장에 실패했습니다.');
    })
    .finally(() => {
        hideLoading();
    });
}

/**
 * 내 숙소 목록 관련 변수
 */
let isLoading = false;
let hasNextPage = true;
let currentPage = 0;

// 받은 후기 목록 관련 변수
let receivedReviewsLoading = false;
let receivedReviewsHasNext = true;
let receivedReviewsPage = 0;

// 작성한 후기 목록 관련 변수
let writtenReviewsLoading = false;
let writtenReviewsHasNext = true;
let writtenReviewsPage = 0;

function loadMyHouses(page = 0) {
    const listingsGrid = document.querySelector('.listings-grid');
    
    if (!listingsGrid || isLoading || (!hasNextPage && page > 0)) return;
    
    // 로딩 상태 설정
    isLoading = true;
    
    // 첫 페이지 로드 시 로딩 표시
    if (page === 0) {
        listingsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>숙소 정보를 불러오는 중입니다...</p>
            </div>
        `;
        // 페이지 초기화
        hasNextPage = true;
        currentPage = 0;
    } else {
        // 로딩 표시 추가
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>불러오는 중...</span>
        `;
        listingsGrid.appendChild(loadingIndicator);
    }
    
    // API 호출
    fetchWithAuth(`/api/house/my?page=${page}&size=10`)
        .then(response => {
            if (!response || !response.ok) {
                throw new Error("API 응답 오류");
            }
            return response.json();
        })
        .then(response => {
            if (response && response.data) {
                const houses = response.data.content;
                hasNextPage = response.data.hasNext || false;

                // 첫 페이지 로드 시 그리드 초기화
                if (page === 0) {
                    listingsGrid.innerHTML = '';
                } else {
                    // 로딩 인디케이터 제거
                    const loadingIndicator = document.querySelector('.loading-indicator');
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                }

                // 숙소 목록 표시
                if (houses.length === 0 && page === 0) {
                    listingsGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-home"></i>
                            <p>등록된 숙소가 없습니다.</p>
                            <a href="/page/host/listings/new" class="btn btn-primary">새 숙소 등록하기</a>
                        </div>
                    `;
                } else {
                    // 숙소 카드 추가
                    houses.forEach(house => {
                        listingsGrid.appendChild(createHouseCard(house));
                    });
                    
                    // 현재 페이지 업데이트
                    currentPage = page;
                }
            }
        })
        .catch(error => {
            console.error('숙소 목록 로드 실패:', error);
            
            // 첫 페이지 로드 실패 시에만 에러 메시지 표시
            if (page === 0) {
                listingsGrid.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>숙소 정보를 불러오는데 실패했습니다.</p>
                        <button class="btn btn-outline retry-btn">다시 시도</button>
                    </div>
                `;
                
                const retryBtn = listingsGrid.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        loadMyHouses();
                    });
                }
            } else {
                // 로딩 인디케이터 제거
                const loadingIndicator = document.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // 간단한 에러 메시지 표시
                const errorMsg = document.createElement('div');
                errorMsg.className = 'load-error-message';
                errorMsg.textContent = '더 불러오기 실패. 스크롤하여 다시 시도하세요.';
                listingsGrid.appendChild(errorMsg);
                
                // 3초 후 에러 메시지 제거
                setTimeout(() => {
                    const errorElements = document.querySelectorAll('.load-error-message');
                    errorElements.forEach(el => el.remove());
                }, 3000);
            }
        })
        .finally(() => {
            isLoading = false;
        });
}

/**
 * 숙소 카드 생성
 */
function createHouseCard(house) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    // 평점 표시 포맷팅
    const rating = house.averageRating ? parseFloat(house.averageRating).toFixed(1) : '0.0';
    const reviewCount = house.reviewCount || 0;
    
    // 등록일 포맷팅
    let formattedDate = '';
    if (house.createdAt) {
        const date = new Date(house.createdAt);
        formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 등록`;
    }
    
    // active 값이 없는 경우 기본값으로 true 설정 (활성화 상태)
    // API 응답에 active가 포함되지 않으므로 기본값으로 처리
    const active = house.active !== undefined ? 
        (typeof house.active === 'boolean' ? house.active : house.active === 'true') : 
        true;
    
    card.innerHTML = `
        <a href="/page/listing-detail?id=${house.id}" class="listing-card-link">
            <div class="listing-image">
                <img src="${house.thumbnailUrl || '/images/placeholder-house.jpg'}" alt="${house.title}">
                ${active ? 
                    '<span class="listing-badge active">활성화</span>' : 
                    '<span class="listing-badge inactive">비활성화</span>'
                }
                <div class="listing-rating">
                    <i class="fas fa-star"></i>
                    <span>${rating} (${reviewCount})</span>
                </div>
            </div>
            <div class="listing-info">
                <h3 class="listing-title">${house.title}</h3>
                <p class="listing-location">
                    ${house.address || formattedDate} 
                    <span class="listing-type-inline">${getHouseTypeName(house.houseType) || '기타'}</span>
                </p>
                <div class="listing-meta">
                    <div class="listing-details">
                        ${house.bedrooms ? `<span><i class="fas fa-bed"></i> 침실 ${house.bedrooms}개</span>` : ''}
                        ${house.maxGuests ? `<span><i class="fas fa-user-friends"></i> 최대 ${house.maxGuests}인</span>` : ''}
                    </div>
                </div>
            </div>
        </a>
        <div class="listing-actions">
            <a href="/page/host/listings/${house.id}/edit" class="btn btn-sm btn-outline">
                <i class="fas fa-edit"></i> 수정
            </a>
            <button class="btn btn-sm btn-outline toggle-status-btn" data-house-id="${house.id}" data-is-active="${active}">
                ${active ? '<i class="fas fa-eye-slash"></i> 비활성화' : '<i class="fas fa-eye"></i> 활성화'}
            </button>
        </div>
    `;
    
    // 활성화/비활성화 버튼 이벤트 리스너
    const toggleBtn = card.querySelector('.toggle-status-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleHouseStatus(house.id, active);
        });
    }
    
    return card;
}

/**
 * 숙소 타입 이름 반환
 */
function getHouseTypeName(houseType) {
    if (!houseType) return '기타';
    
    const houseTypes = {
        'APT': '아파트',
        'HOUSE': '주택',
        'VILLA': '빌라',
        'OP': '오피스텔',
        'OTHER': '기타'
    };
    
    return houseTypes[houseType] || '기타';
}

/**
 * 숙소 활성화/비활성화 토글
 */
function toggleHouseStatus(houseId, currentStatus) {
    // currentStatus가 문자열인 경우 boolean으로 변환
    const active = typeof currentStatus === 'boolean' ? currentStatus : currentStatus === 'true';
    
    if (!confirm(`정말 이 숙소를 ${active ? '비활성화' : '활성화'}하시겠습니까?`)) {
        return;
    }
    
    showLoading();
    
    fetchWithAuth(`/api/house/${houseId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !active })
    })
    .then(response => {
        if (!response || !response.ok) {
            throw new Error("API 응답 오류");
        }
        return response.json();
    })
    .then(response => {
        if (response && response.data) {
            // 성공 메시지 표시
            alert(`숙소가 성공적으로 ${response.data.active ? '활성화' : '비활성화'}되었습니다.`);
            // 목록 새로고침
            loadMyHouses();
        }
    })
    .catch(error => {
        console.error('숙소 상태 변경 실패:', error);
        showError('숙소 상태 변경에 실패했습니다.');
    })
    .finally(() => {
        hideLoading();
    });
}

/**
 * 받은 후기 목록 로드
 */
function loadReceivedReviews(page = 0) {
    const receivedReviews = document.getElementById('received-reviews');
    
    if (!receivedReviews || receivedReviewsLoading || (!receivedReviewsHasNext && page > 0)) return;
    
    // 로딩 상태 설정
    receivedReviewsLoading = true;
    
    // 첫 페이지 로드 시 로딩 표시
    if (page === 0) {
        receivedReviews.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>후기를 불러오는 중입니다...</p>
            </div>
        `;
        // 페이지 초기화
        receivedReviewsHasNext = true;
        receivedReviewsPage = 0;
    } else {
        // 로딩 표시 추가
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>불러오는 중...</span>
        `;
        receivedReviews.appendChild(loadingIndicator);
    }
    
    // API 호출
    fetchWithAuth(`/api/review/received?page=${page}&size=10`)
        .then(response => {
            if (!response || !response.ok) {
                throw new Error("API 응답 오류");
            }
            return response.json();
        })
        .then(response => {
            if (response && response.data) {
                const reviews = response.data.content;
                receivedReviewsHasNext = response.data.hasNext || false;
                
                // 첫 페이지 로드 시 컨테이너 초기화
                if (page === 0) {
                    receivedReviews.innerHTML = '';
                } else {
                    // 로딩 인디케이터 제거
                    const loadingIndicator = receivedReviews.querySelector('.loading-indicator');
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                }
                
                // 후기 목록 표시
                if (reviews.length === 0 && page === 0) {
                    receivedReviews.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-comment-slash"></i>
                            <p>받은 후기가 없습니다.</p>
                        </div>
                    `;
                } else {
                    // 후기 카드 추가
                    reviews.forEach(review => {
                        receivedReviews.appendChild(createReviewCard(review, 'received'));
                    });
                    
                    // 현재 페이지 업데이트
                    receivedReviewsPage = page;
                }
            }
        })
        .catch(error => {
            console.error('후기 목록 로드 실패:', error);
            
            // 첫 페이지 로드 실패 시에만 에러 메시지 표시
            if (page === 0) {
                receivedReviews.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>후기 정보를 불러오는데 실패했습니다.</p>
                        <button class="btn btn-outline retry-btn">다시 시도</button>
                    </div>
                `;
                
                const retryBtn = receivedReviews.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        loadReceivedReviews();
                    });
                }
            } else {
                // 로딩 인디케이터 제거
                const loadingIndicator = receivedReviews.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // 간단한 에러 메시지 표시
                const errorMsg = document.createElement('div');
                errorMsg.className = 'load-error-message';
                errorMsg.textContent = '더 불러오기 실패. 스크롤하여 다시 시도하세요.';
                receivedReviews.appendChild(errorMsg);
                
                // 3초 후 에러 메시지 제거
                setTimeout(() => {
                    const errorElements = document.querySelectorAll('.load-error-message');
                    errorElements.forEach(el => el.remove());
                }, 3000);
            }
        })
        .finally(() => {
            receivedReviewsLoading = false;
        });
}

/**
 * 작성한 후기 목록 로드
 */
function loadWrittenReviews(page = 0) {
    const writtenReviews = document.getElementById('written-reviews');
    
    if (!writtenReviews || writtenReviewsLoading || (!writtenReviewsHasNext && page > 0)) return;
    
    // 로딩 상태 설정
    writtenReviewsLoading = true;
    
    // 첫 페이지 로드 시 로딩 표시
    if (page === 0) {
        writtenReviews.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>후기를 불러오는 중입니다...</p>
            </div>
        `;
        // 페이지 초기화
        writtenReviewsHasNext = true;
        writtenReviewsPage = 0;
    } else {
        // 로딩 표시 추가
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>불러오는 중...</span>
        `;
        writtenReviews.appendChild(loadingIndicator);
    }
    
    // API 호출
    fetchWithAuth(`/api/review/written?page=${page}&size=10`)
        .then(response => {
            if (!response || !response.ok) {
                throw new Error("API 응답 오류");
            }
            return response.json();
        })
        .then(response => {
            if (response && response.data) {
                const reviews = response.data.content;
                writtenReviewsHasNext = response.data.hasNext || false;
                
                // 첫 페이지 로드 시 컨테이너 초기화
                if (page === 0) {
                    writtenReviews.innerHTML = '';
                } else {
                    // 로딩 인디케이터 제거
                    const loadingIndicator = writtenReviews.querySelector('.loading-indicator');
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                }
                
                // 후기 목록 표시
                if (reviews.length === 0 && page === 0) {
                    writtenReviews.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-comment-slash"></i>
                            <p>작성한 후기가 없습니다.</p>
                        </div>
                    `;
                } else {
                    // 후기 카드 추가
                    reviews.forEach(review => {
                        writtenReviews.appendChild(createReviewCard(review, 'written'));
                    });
                    
                    // 현재 페이지 업데이트
                    writtenReviewsPage = page;
                }
            }
        })
        .catch(error => {
            console.error('후기 목록 로드 실패:', error);
            
            // 첫 페이지 로드 실패 시에만 에러 메시지 표시
            if (page === 0) {
                writtenReviews.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>후기 정보를 불러오는데 실패했습니다.</p>
                        <button class="btn btn-outline retry-btn">다시 시도</button>
                    </div>
                `;
                
                const retryBtn = writtenReviews.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        loadWrittenReviews();
                    });
                }
            } else {
                // 로딩 인디케이터 제거
                const loadingIndicator = writtenReviews.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // 간단한 에러 메시지 표시
                const errorMsg = document.createElement('div');
                errorMsg.className = 'load-error-message';
                errorMsg.textContent = '더 불러오기 실패. 스크롤하여 다시 시도하세요.';
                writtenReviews.appendChild(errorMsg);
                
                // 3초 후 에러 메시지 제거
                setTimeout(() => {
                    const errorElements = document.querySelectorAll('.load-error-message');
                    errorElements.forEach(el => el.remove());
                }, 3000);
            }
        })
        .finally(() => {
            writtenReviewsLoading = false;
        });
}

/**
 * 후기 카드 생성
 */
function createReviewCard(review, type) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    // 별점 표시 포맷팅
    const rating = review.rating ? parseFloat(review.rating).toFixed(1) : '0.0';
    
    // 날짜 포맷팅
    let formattedDate = '';
    if (review.regTime) {
        const date = new Date(review.regTime);
        formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } else if (review.createdDate) {
        const date = new Date(review.createdDate);
        formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
    
    if (type === 'received') {
        card.innerHTML = `
            <div class="review-header">
                <img src="${review.reviewerProfile || '/images/profile-avatar.jpg'}" alt="${review.reviewerNickname}" class="review-avatar">
                <div class="review-user">
                    <h4 class="review-name">${review.reviewerNickname || '사용자'}</h4>
                    <div class="review-date">${formattedDate}</div>
                    <div class="review-rating">
                        ${generateStars(rating)}
                        <span>${rating}</span>
                    </div>
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment || '후기 내용이 없습니다.'}</p>
            </div>
            ${review.houseTitle ? `
            <div class="review-house-info">
                <div class="house-details">
                    <a href="/page/listing-detail?id=${review.houseId}" class="house-title">${review.houseTitle}</a>
                    <span class="house-label">이 숙소에 대한 리뷰</span>
                </div>
            </div>
            ` : ''}
        `;
    } else {
        card.innerHTML = `
            <div class="review-header">
                <img src="${review.profile || '/images/profile-avatar.jpg'}" alt="내 프로필" class="review-avatar">
                <div class="review-user">
                    <h4 class="review-name">내가 작성한 후기</h4>
                    <div class="review-date">${formattedDate}</div>
                    <div class="review-rating">
                        ${generateStars(rating)}
                        <span>${rating}</span>
                    </div>
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment || '후기 내용이 없습니다.'}</p>
            </div>
            <div class="review-house-info">
                <div class="house-details">
                    <a href="/page/listing-detail?id=${review.houseId}" class="house-title">${review.houseTitle}</a>
                    <span class="house-label">이 숙소에 대한 리뷰</span>
                </div>
            </div>
        `;
    }
    
    return card;
}

/**
 * 별점 HTML 생성
 */
function generateStars(rating) {
    const ratingNum = parseFloat(rating);
    let starsHtml = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= ratingNum) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= ratingNum) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    
    return starsHtml;
}

/**
 * 푸시 알림 설정 로드
 */
function loadPushNotificationSettings() {
    fetchWithAuth('/api/notifications/settings')
        .then(response => {
            if (!response || !response.ok) {
                throw new Error("API 응답 오류");
            }
            return response.json();
        })
        .then(response => {
            if (response && response.data) {
                // 토글 스위치 상태 업데이트
                const pushToggle = document.querySelector('.settings-toggle input[type="checkbox"]');
                if (pushToggle) {
                    pushToggle.checked = response.data.pushNotificationEnabled;
                }
                
                console.log('푸시 알림 설정 로드 완료:', response.data);
            }
        })
        .catch(error => {
            console.error('푸시 알림 설정 로드 실패:', error);
        });
}

/**
 * 푸시 알림 토글 처리
 */
function togglePushNotification() {
    // 로딩 표시
    const toggleContainer = document.querySelector('.settings-toggle');
    const originalContent = toggleContainer.innerHTML;
    
    toggleContainer.innerHTML = `
        <div class="toggle-label">푸시 알림</div>
        <div class="toggle-loading">
            <i class="fas fa-spinner fa-spin"></i>
        </div>
    `;
    
    fetchWithAuth('/api/notifications/settings/push', {
        method: 'POST'
    })
    .then(response => {
        if (!response || !response.ok) {
            throw new Error("API 응답 오류");
        }
        return response.json();
    })
    .then(response => {
        if (response && response.data) {
            // 성공 시 토글 스위치 상태 업데이트
            const newStatus = response.data.pushNotificationEnabled;
            
            // 원래 HTML 복원
            toggleContainer.innerHTML = originalContent;
            
            // 토글 상태 업데이트
            const pushToggle = document.querySelector('.settings-toggle input[type="checkbox"]');
            if (pushToggle) {
                pushToggle.checked = newStatus;
                
                // 이벤트 리스너 다시 추가
                setupPushNotificationToggle();
            }
            
            // 성공 메시지 표시
            const message = newStatus ? '푸시 알림이 활성화되었습니다!' : '푸시 알림이 비활성화되었습니다!';
            showNotificationMessage(message, 'success');
            
            console.log('푸시 알림 설정 변경 완료:', newStatus);
        }
    })
    .catch(error => {
        console.error('푸시 알림 설정 변경 실패:', error);
        
        // 원래 HTML 복원
        toggleContainer.innerHTML = originalContent;
        
        // 이벤트 리스너 다시 추가
        setupPushNotificationToggle();
        
        // 에러 메시지 표시
        showNotificationMessage('푸시 알림 설정 변경에 실패했습니다.', 'error');
    });
}

/**
 * 푸시 알림 토글 이벤트 리스너 설정
 */
function setupPushNotificationToggle() {
    const pushToggle = document.querySelector('.settings-toggle input[type="checkbox"]');
    if (pushToggle) {
        // 기존 이벤트 리스너 제거
        pushToggle.removeEventListener('change', togglePushNotification);
        
        // 새로운 이벤트 리스너 추가
        pushToggle.addEventListener('change', function(e) {
            // 체크박스 상태 되돌리기 (API 결과에 따라 업데이트됨)
            e.target.checked = !e.target.checked;
            
            // API 호출
            togglePushNotification();
        });
    }
}

/**
 * 알림 메시지 표시
 */
function showNotificationMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.profile-notification-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `profile-notification-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // 페이지 상단에 추가
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}
