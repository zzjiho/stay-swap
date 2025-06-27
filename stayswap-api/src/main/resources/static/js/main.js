// 전역 플래그 및 초기화 상태 관리
window.apiFlags = window.apiFlags || {
    checkingNotifications: false,
    refreshingToken: false,
    initializingDropdowns: false
};

window.mainInitialized = window.mainInitialized || false;

// 알림 중복 체크 플래그 (페이지당 1회 실행 보장)
// 페이지 로드 시마다 리셋하여 새로고침 시에도 정상 동작
window.notificationCheckedOnce = false;

document.addEventListener('DOMContentLoaded', function() {
    // 중복 초기화 방지
    if (window.mainInitialized) return;
    window.mainInitialized = true;

    // auth 객체 초기화 (auth-common.js가 없는 경우 대비)
    if (!window.auth) {
        window.auth = {
            accessToken: null,
            tokenExpireTime: null,
            isInitialized: false,
        };
    }

    // 초기화 순서 정리
    initializeMainComponents();
});

async function initializeMainComponents() {
    try {
        // 1. UI 초기화
        highlightCurrentPage();
        initDropdowns();
        initLogoutButton();

        // 2. Firebase 및 토큰 설정
        await setupFirebaseMessaging();
        
        // 3. 인증 상태 변경 이벤트 리스너 (auth-common.js 이벤트에만 의존)
        setupAuthEventListeners();

    } catch (error) {
        console.error('Main 컴포넌트 초기화 실패:', error);
    }
}

function setupAuthEventListeners() {
    // 인증 상태 변경 이벤트 리스너 (auth-common.js 이벤트에만 의존)
    if (!window.authEventListenerAdded) {
        window.authEventListenerAdded = true;
        
        document.addEventListener('authStateChanged', function(e) {
            console.log('🔍 Main.js가 authStateChanged 이벤트 수신:', e.detail.isLoggedIn);
            
            // 로그아웃 시 알림 체크 플래그 리셋
            if (!e.detail.isLoggedIn) {
                window.notificationCheckedOnce = false;
            }
            
            updateUIBasedOnAuthState();
            if (e.detail.isLoggedIn) {
                setTimeout(() => registerFCMToken(), 2000);
            }
        });
    }
}

// 드롭다운 초기화 (중복 방지)
function initDropdowns() {
    if (window.apiFlags.initializingDropdowns) return;
    window.apiFlags.initializingDropdowns = true;

    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationToggle = document.getElementById('notification-dropdown-toggle');
    const notificationDropdown = document.getElementById('notification-dropdown');

    // 기존 이벤트 리스너 제거
    if (profileToggle && !profileToggle.dataset.initialized) {
        profileToggle.dataset.initialized = 'true';
        profileToggle.addEventListener('click', handleProfileDropdownClick);
    }

    if (notificationToggle && !notificationToggle.dataset.initialized) {
        notificationToggle.dataset.initialized = 'true';
        notificationToggle.addEventListener('click', handleNotificationDropdownClick);
    }

    // 외부 클릭 시 드롭다운 닫기 (중복 등록 방지)
    if (!document.body.dataset.dropdownListenerAdded) {
        document.body.dataset.dropdownListenerAdded = 'true';
        document.addEventListener('click', handleOutsideClick);
    }

    window.apiFlags.initializingDropdowns = false;
}

// 드롭다운 재초기화 함수 (페이지에서 DOM을 수정한 후 호출)
function reinitializeDropdowns() {
    console.log('🔍 드롭다운 재초기화 시작');
    
    // 기존 초기화 플래그 리셋
    window.apiFlags.initializingDropdowns = false;
    
    // 헤더 요소들의 이벤트 리스너 상태 리셋
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const notificationToggle = document.getElementById('notification-dropdown-toggle');
    
    console.log('🔍 헤더 요소 확인:', {
        profileToggle: !!profileToggle,
        notificationToggle: !!notificationToggle,
        profileInitialized: profileToggle?.dataset.initialized,
        notificationInitialized: notificationToggle?.dataset.initialized
    });
    
    if (profileToggle) {
        profileToggle.dataset.initialized = '';
        // 기존 이벤트 리스너 제거
        profileToggle.removeEventListener('click', handleProfileDropdownClick);
    }
    if (notificationToggle) {
        notificationToggle.dataset.initialized = '';
        // 기존 이벤트 리스너 제거
        notificationToggle.removeEventListener('click', handleNotificationDropdownClick);
    }
    
    // 전역 이벤트 리스너도 리셋
    if (document.body.dataset.dropdownListenerAdded) {
        document.body.dataset.dropdownListenerAdded = '';
        document.removeEventListener('click', handleOutsideClick);
    }
    
    // 드롭다운 다시 초기화
    initDropdowns();
    
    console.log('🔍 드롭다운 재초기화 완료');
}

// 전역에서 접근 가능하도록 노출
window.reinitializeDropdowns = reinitializeDropdowns;

function handleProfileDropdownClick(e) {
    e.preventDefault();
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationDropdown = document.getElementById('notification-dropdown');
    
    if (profileDropdown) {
        profileDropdown.classList.toggle('active');
    }
    if (notificationDropdown) {
        notificationDropdown.classList.remove('active');
    }
}

function handleNotificationDropdownClick(e) {
    console.log('🔍 알림 드롭다운 클릭 이벤트 발생');
    e.preventDefault();
    
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationDropdown = document.getElementById('notification-dropdown');
    
    console.log('🔍 드롭다운 요소 확인:', {
        profileDropdown: !!profileDropdown,
        notificationDropdown: !!notificationDropdown,
        currentActive: notificationDropdown?.classList.contains('active')
    });
    
    if (!notificationDropdown) {
        console.error('🔍 알림 드롭다운 요소를 찾을 수 없음');
        return;
    }
    
    const isOpening = !notificationDropdown.classList.contains('active');
    console.log('🔍 드롭다운 상태 변경:', isOpening ? '열기' : '닫기');
    
    notificationDropdown.classList.toggle('active');
    if (profileDropdown) {
        profileDropdown.classList.remove('active');
    }

    // 드롭다운 열릴 때 알림 로드
    if (isOpening && window.auth?.accessToken) {
        console.log('🔍 알림 드롭다운 열림 - 알림 로드 시작');
        loadNotificationsOnDropdownOpen();
        // 무한 스크롤 설정 (드롭다운이 열릴 때)
        setTimeout(() => setupNotificationInfiniteScroll(), 100);
    } else if (isOpening && !window.auth?.accessToken) {
        console.log('🔍 액세스 토큰이 없어서 알림 로드하지 않음');
    }
}

function handleOutsideClick(e) {
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationToggle = document.getElementById('notification-dropdown-toggle');
    const notificationDropdown = document.getElementById('notification-dropdown');

    if (profileToggle && profileDropdown &&
        !profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('active');
    }
    if (notificationToggle && notificationDropdown &&
        !notificationToggle.contains(e.target) && !notificationDropdown.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
}

// 로그아웃 버튼 초기화
function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn.dataset.initialized) {
        logoutBtn.dataset.initialized = 'true';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // auth-common.js의 로그아웃 함수 사용
            if (typeof window.logout === 'function') {
                window.logout();
            } else {
                console.error('auth-common.js의 logout 함수가 없습니다.');
                window.location.href = '/page/auth';
            }
        });
    }
}

// Firebase 메시징 설정
async function setupFirebaseMessaging() {
    try {
        const initialized = await initFirebase();
        if (!initialized) return false;

        if (!('Notification' in window)) return false;

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return false;
        }

        const messaging = firebase.messaging();

        // 포그라운드 메시지 처리
        messaging.onMessage((payload) => {
            if (payload.notification && Notification.permission === 'granted') {
                const notification = new Notification(
                    payload.notification.title || '새로운 알림',
                    {
                    body: payload.notification.body || '',
                    icon: '/img/logo.png',
                    data: payload.data || {}
                    }
                );

                notification.onclick = function() {
                            window.focus();
                            const url = payload.data?.url || '/';
                            window.location.href = url;
                            notification.close();
                        };
            }
        });

        return true;
    } catch (error) {
        console.error('Firebase 메시징 설정 실패:', error);
        return false;
    }
}

// 현재 페이지 활성화
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.endsWith(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// UI 상태 업데이트
function updateUIBasedOnAuthState() {
    // auth-common.js의 isLoggedIn 함수에만 의존
    const isUserLoggedIn = (typeof window.isLoggedIn === 'function') ? window.isLoggedIn() : false;
    const userProfile = document.getElementById('user-profile');
    const authButtons = document.getElementById('auth-buttons');
    const notificationIcon = document.getElementById('notification-icon');

    console.log('🔍 updateUIBasedOnAuthState 호출됨. 로그인 상태:', isUserLoggedIn);

    // 현재 UI 상태 확인 (깜빡임 방지)
    const currentUIState = userProfile?.style.display === 'block' ? 'logged-in' : 'logged-out';
    const targetUIState = isUserLoggedIn ? 'logged-in' : 'logged-out';
    
    if (currentUIState === targetUIState) {
        console.log('🔍 UI 상태 변경 없음. 현재:', currentUIState);
        
        // 상태가 같더라도 로그인 상태일 때는 알림 확인
        if (isUserLoggedIn && !window.notificationCheckedOnce) {
            window.notificationCheckedOnce = true;
            console.log('🔍 새 알림 확인 예약됨 (UI 변경 없이)');
            setTimeout(() => checkNewNotifications(), 200);
        }
        return;
    }

    console.log('🔍 UI 상태 변경:', currentUIState, '→', targetUIState);

    if (isUserLoggedIn) {
        if (userProfile) userProfile.style.display = 'block';
        if (notificationIcon) notificationIcon.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
        
        // 로그인 상태일 때 새 알림 확인 (페이지당 1회만)
        if (!window.notificationCheckedOnce) {
            window.notificationCheckedOnce = true;
            console.log('🔍 새 알림 확인 예약됨');
            setTimeout(() => checkNewNotifications(), 200);
        }
    } else {
        if (userProfile) userProfile.style.display = 'none';
        if (notificationIcon) notificationIcon.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        
        // 로그아웃 상태일 때 배지 숨기기
        updateNotificationBadge(false);

        // 로그아웃 시 플래그 초기화 (다음 로그인에서 다시 한 번만 호출되도록)
        window.notificationCheckedOnce = false;
    }
}

// Firebase 초기화
async function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            await Promise.all([
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js'),
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js')
            ]);
            }

        try {
            firebase.app();
            return true;
        } catch (e) {
            // 초기화되지 않음, 계속 진행
        }

        const response = await fetch('/api/config/firebase');
        if (!response.ok) throw new Error('Firebase 설정 로드 실패');

        const config = await response.json();
        firebase.initializeApp(config);
        window.vapidKey = config.vapidKey;

        return true;
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return false;
    }
}

// 스크립트 로드
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
        document.head.appendChild(script);
    });
}

// FCM 토큰 상태 확인
async function checkFCMTokenStatus() {
    const tokenRegistered = localStorage.getItem('fcmTokenRegistered') === 'true';
    const tokenValue = localStorage.getItem('fcmToken');
    const tokenExpiry = localStorage.getItem('fcmTokenExpiry');

    if (!tokenRegistered || !tokenValue) return true;

    if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        if (Date.now() > expiryTime || Date.now() > expiryTime - 24 * 60 * 60 * 1000) {
            return true;
        }
    } else {
        return true;
    }

    return false;
}

// FCM 토큰 가져오기
async function getFCMToken() {
    try {
        if (typeof firebase === 'undefined' || !firebase.messaging) {
            const initialized = await initFirebase();
            if (!initialized) throw new Error('Firebase 초기화 실패');
            }

        if (!window.vapidKey) throw new Error('VAPID 키 없음');

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') throw new Error('알림 권한 없음');
        }

        const messaging = firebase.messaging();
        const token = await messaging.getToken({ vapidKey: window.vapidKey });

        if (token) return token;
        throw new Error('토큰 획득 실패');
    } catch (error) {
        console.error('FCM 토큰 요청 실패:', error);

        // 개발 환경용 가짜 토큰
        if (window.location.hostname === 'localhost') {
            return 'fake-fcm-token-' + Math.random().toString(36).substring(2, 15);
        }
        return null;
    }
}

// FCM 토큰 등록
async function registerFCMToken() {
    try {
        const needsRegistration = await checkFCMTokenStatus();
        if (!needsRegistration) return true;

        // 이미 유효한 액세스 토큰이 있는지 확인
        if (!window.auth?.accessToken || isTokenExpired()) {
            // 토큰이 없거나 만료된 경우에만 갱신
            const refreshSuccess = await refreshAccessToken();
            if (!refreshSuccess) {
                throw new Error('토큰 갱신 실패');
            }
        }

        const accessToken = window.auth.accessToken;

        // FCM 토큰 획득
        const token = await getFCMToken();
        if (!token) throw new Error('FCM 토큰 획득 실패');

        // 중복 등록 방지
        const previousToken = localStorage.getItem('fcmToken');
        if (previousToken === token && localStorage.getItem('fcmTokenRegistered') === 'true') {
            const expiryTime = Date.now() + 14 * 24 * 60 * 60 * 1000;
            localStorage.setItem('fcmTokenExpiry', expiryTime.toString());
            return true;
        }

        // 디바이스 정보
        const deviceId = localStorage.getItem('device_id') || ('web_' + Math.random().toString(36).substring(2, 15));
        localStorage.setItem('device_id', deviceId);

        const deviceInfo = {
            deviceId: deviceId,
            deviceType: 'WEB',
            deviceModel: navigator.userAgent,
            fcmToken: token
        };

        // 서버 등록
        const response = await fetch('/api/users/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(deviceInfo)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FCM 토큰 등록 실패 (${response.status}): ${errorText}`);
        }

        // 토큰 정보 저장
        localStorage.setItem('fcmTokenRegistered', 'true');
        localStorage.setItem('fcmToken', token);
        const expiryTime = Date.now() + 14 * 24 * 60 * 60 * 1000;
        localStorage.setItem('fcmTokenExpiry', expiryTime.toString());

        return true;
    } catch (error) {
        console.error('FCM 토큰 등록 오류:', error);
        return false;
    }
}

// 인기 숙소 로드
function loadPopularHouses() {
    $.ajax({
        url: '/api/house/popular',
        method: 'GET',
        data: { limit: 3 },
        success: function(response) {
            if (response.httpStatus === 'OK' && response.data) {
                const popularHousesContainer = $('#popular-houses');
                popularHousesContainer.empty();

                response.data.forEach(house => {
                    const houseCard = `
                        <div class="property-card">
                            <div class="property-image">
                                <img src="${house.thumbnailUrl}" alt="${house.title}">
                                <div class="property-rating">
                                    <i class="fas fa-star"></i> ${house.rating} (${house.reviewCount})
                                </div>
                            </div>
                            <div class="property-content">
                                <h3 class="property-title">${house.title}</h3>
                                <p class="property-location">${house.city} ${house.district}</p>
                                <a href="/page/listing-detail?id=${house.houseId}" class="btn btn-primary btn-block">자세히 보기</a>
                            </div>
                        </div>
                    `;
                    popularHousesContainer.append(houseCard);
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('인기 숙소 로드 실패:', error);
        }
    });
}

// 페이지 로드 시 인기 숙소 로드
$(document).ready(function() {
    loadPopularHouses();
});

// 알림 관련 유틸리티 함수들 (빨간점만 표시)
function updateNotificationBadge(hasUnread) {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    
    if (hasUnread) {
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// 새 알림 여부 확인 API 호출 (중복 호출 방지)
async function checkNewNotifications() {
    // 중복 호출 방지
    if (window.apiFlags.checkingNotifications) {
        console.log('새 알림 확인이 이미 진행 중입니다.');
        return false;
    }

    // auth-common.js의 인증 상태 확인 함수 사용
    if (typeof window.isLoggedIn !== 'function' || !window.isLoggedIn()) {
        console.log('인증 토큰이 없어서 새 알림 확인을 건너뜁니다.');
        return false;
    }

    window.apiFlags.checkingNotifications = true;

    try {
        const response = await fetch('/api/notifications/new', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${window.auth?.accessToken || ''}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('알림 확인 중 401 오류 - auth-common.js에서 토큰 갱신 처리됨');
                return false;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.httpStatus === 'OK' && data.data) {
            const hasNew = data.data.hasNew;
            console.log('새 알림 여부 확인:', hasNew);
            updateNotificationBadge(hasNew);
            return hasNew;
        } else {
            throw new Error(data.message || '새 알림 확인 실패');
        }
    } catch (error) {
        console.error('새 알림 확인 실패:', error);
        return false;
    } finally {
        window.apiFlags.checkingNotifications = false;
    }
}

function markNotificationsAsRead() {
    // 안읽은 알림들을 읽음으로 표시
    const unreadItems = document.querySelectorAll('.notification-item.unread');
    unreadItems.forEach(item => {
        item.classList.remove('unread');
    });
    
    // 배지 숨기기 (안읽은 알림이 없으면)
    const hasUnread = document.querySelectorAll('.notification-item.unread').length > 0;
    updateNotificationBadge(hasUnread);
}

function addNewNotification(notification) {
    // 새 알림 추가 로직 (실제 구현 시 사용)
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    // 새 알림 HTML 생성
    const newItem = document.createElement('div');
    newItem.className = 'notification-item unread';
    newItem.innerHTML = `
        <div class="notification-avatar">
            <div class="avatar-placeholder">${notification.senderName.charAt(0)}</div>
            <div class="notification-type-icon ${notification.type}">
                <i class="fas ${getTypeIcon(notification.type)}"></i>
            </div>
        </div>
        <div class="notification-content">
            <div class="notification-header">
                <span class="notification-username">${notification.senderName}</span>
                <span class="notification-time">방금 전</span>
            </div>
            <div class="notification-message">${notification.message}</div>
        </div>
    `;
    
    // 맨 위에 추가
    notificationList.insertBefore(newItem, notificationList.firstChild);
    
    // 배지 업데이트 (안읽은 알림이 있으므로 표시)
    updateNotificationBadge(true);
}

function getTypeIcon(type) {
    switch (type) {
        case 'like': return 'fa-heart';
        case 'swap': return 'fa-exchange-alt';
        case 'booking': return 'fa-calendar';
        case 'TEST_NOTIFICATION': return 'fa-bell';
        default: return 'fa-bell';
    }
}

// ========== 알림 조회 API 연동 ==========

// 알림 상태 관리
window.notificationState = {
    notifications: [],
    pivot: null,
    hasNext: true,
    loading: false,
    initialized: false,
    infiniteScrollSetup: false
};

// 알림 조회 API 호출
async function fetchNotifications(pivot = null) {
    if (!window.auth?.accessToken) {
        console.log('인증 토큰이 없습니다.');
        return { success: false, error: 'NO_TOKEN' };
    }

    try {
        window.notificationState.loading = true;
        
        let url = '/api/notifications';
        if (pivot) {
            url += `?pivot=${encodeURIComponent(pivot)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${window.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                // 토큰 만료 시 갱신 시도
                if (typeof refreshAccessToken === 'function') {
                    const refreshSuccess = await refreshAccessToken();
                    if (refreshSuccess) {
                        return await fetchNotifications(pivot);
                    }
                } else {
                    console.warn('refreshAccessToken 함수를 찾을 수 없습니다.');
                }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.httpStatus === 'OK' && data.data) {
            return {
                success: true,
                notifications: data.data.notifications || [],
                hasNext: data.data.hasNext || false,
                pivot: data.data.pivot || null
            };
        } else {
            throw new Error(data.message || '알림 조회 실패');
        }
    } catch (error) {
        console.error('알림 조회 실패:', error);
        return { success: false, error: error.message };
    } finally {
        window.notificationState.loading = false;
    }
}

// 알림 목록 렌더링
function renderNotifications(notifications, append = false) {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;

    if (!append) {
        notificationList.innerHTML = '';
    }

    if (notifications.length === 0 && !append) {
        notificationList.innerHTML = `
            <div class="notification-item no-notifications">
                <div class="notification-content">
                    <p>새로운 알림이 없습니다.</p>
                </div>
            </div>
        `;
        return;
    }

    notifications.forEach(notification => {
        const timeAgo = formatTimeAgo(notification.occurredAt);
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${!notification.read ? 'unread' : ''}`;
        notificationItem.dataset.notificationId = notification.id;
        notificationItem.style.cursor = 'pointer';
        
        // 알림 클릭 이벤트 추가
        notificationItem.addEventListener('click', () => handleNotificationClick(notification));
        
        notificationItem.innerHTML = `
            <div class="notification-avatar">
                ${notification.senderProfile ? 
                    `<img src="${notification.senderProfile}" alt="${notification.senderName}">` :
                    `<div class="avatar-placeholder">${notification.senderName ? notification.senderName.charAt(0) : '?'}</div>`
                }
                <div class="notification-type-icon ${notification.type.toLowerCase()}">
                    <i class="fas ${getTypeIcon(notification.type)}"></i>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-username">${notification.senderName || '알 수 없음'}</span>
                    <span class="notification-time">${timeAgo}</span>
                </div>
                <div class="notification-message">
                    <strong>${notification.title}</strong>
                    ${notification.content ? `<br><span class="notification-detail">${notification.content}</span>` : ''}
                </div>
            </div>
        `;
        
        notificationList.appendChild(notificationItem);
    });

    // 읽지 않은 알림 개수로 배지 업데이트
    const unreadCount = notifications.filter(n => !n.read).length;
    const totalUnreadInList = document.querySelectorAll('.notification-item.unread').length;
    updateNotificationBadge(totalUnreadInList > 0);
}

// 시간 포맷팅 함수
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 알림 드롭다운 열릴 때 알림 로드
function loadNotificationsOnDropdownOpen() {
    // window.notificationState가 아직 초기화되지 않은 경우 초기화
    if (!window.notificationState) {
        console.log('notificationState 초기화됨');
        window.notificationState = {
            notifications: [],
            pivot: null,
            hasNext: true,
            loading: false,
            initialized: false,
            infiniteScrollSetup: false
        };
    }
    
    if (!window.notificationState.initialized) {
        loadInitialNotifications();
    }
}

// 초기 알림 로드
async function loadInitialNotifications() {
    const result = await fetchNotifications();
    
    if (result.success) {
        window.notificationState.notifications = result.notifications;
        window.notificationState.pivot = result.pivot;
        window.notificationState.hasNext = result.hasNext;
        window.notificationState.initialized = true;
        
        renderNotifications(result.notifications);
        
        // 읽지 않은 알림이 있으면 배지 표시
        const hasUnread = result.notifications.some(n => !n.read);
        updateNotificationBadge(hasUnread);
    } else {
        console.error('초기 알림 로드 실패:', result.error);
        const notificationList = document.querySelector('.notification-list');
        if (notificationList) {
            notificationList.innerHTML = `
                <div class="notification-item error">
                    <div class="notification-content">
                        <p>알림을 불러올 수 없습니다.</p>
                        <button onclick="loadInitialNotifications()" class="btn btn-sm btn-primary">다시 시도</button>
                    </div>
                </div>
            `;
        }
    }
}

// 더 많은 알림 로드 (무한 스크롤)
async function loadMoreNotifications() {
    // window.notificationState가 아직 초기화되지 않은 경우 초기화
    if (!window.notificationState) {
        console.log('loadMoreNotifications: notificationState 초기화됨');
        window.notificationState = {
            notifications: [],
            pivot: null,
            hasNext: true,
            loading: false,
            initialized: false,
            infiniteScrollSetup: false
        };
    }
    
    console.log('loadMoreNotifications 호출됨', {
        hasNext: window.notificationState.hasNext,
        loading: window.notificationState.loading,
        pivot: window.notificationState.pivot
    });
    
    if (!window.notificationState.hasNext || window.notificationState.loading) {
        console.log('조건 미충족으로 로드 중단:', {
            hasNext: window.notificationState.hasNext,
            loading: window.notificationState.loading
        });
        return;
    }
    
    console.log('다음 페이지 알림 로드 시작, pivot:', window.notificationState.pivot);
    
    const result = await fetchNotifications(window.notificationState.pivot);
    
    console.log('다음 페이지 알림 로드 결과:', result);
    
    if (result.success) {
        window.notificationState.notifications.push(...result.notifications);
        window.notificationState.pivot = result.pivot;
        window.notificationState.hasNext = result.hasNext;
        
        console.log('상태 업데이트 완료:', {
            totalNotifications: window.notificationState.notifications.length,
            newPivot: window.notificationState.pivot,
            hasNext: window.notificationState.hasNext
        });
        
        renderNotifications(result.notifications, true);
    } else {
        console.error('다음 페이지 로드 실패:', result.error);
    }
}

// 무한 스크롤 설정
function setupNotificationInfiniteScroll() {
    // window.notificationState가 아직 초기화되지 않은 경우 초기화
    if (!window.notificationState) {
        console.log('setupNotificationInfiniteScroll: notificationState 초기화됨');
        window.notificationState = {
            notifications: [],
            pivot: null,
            hasNext: true,
            loading: false,
            initialized: false,
            infiniteScrollSetup: false
        };
    }
    
    // 이미 설정되었으면 재설정하지 않음
    if (window.notificationState.infiniteScrollSetup) {
        console.log('무한 스크롤 이미 설정됨');
        return;
    }
    
    // notification-list가 실제 스크롤이 일어나는 요소
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) {
        console.warn('알림 리스트를 찾을 수 없습니다.');
        return;
    }
    
    console.log('알림 무한 스크롤 설정 완료 (notification-list에 설정)');
    window.notificationState.infiniteScrollSetup = true;
    
    notificationList.addEventListener('scroll', function() {
        const { scrollTop, scrollHeight, clientHeight } = this;
        
        console.log('스크롤 이벤트 (notification-list):', {
            scrollTop,
            scrollHeight,
            clientHeight,
            hasNext: window.notificationState.hasNext,
            loading: window.notificationState.loading,
            trigger: scrollTop + clientHeight >= scrollHeight - 50
        });
        
        // 스크롤이 하단 근처에 도달했을 때
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            console.log('무한 스크롤 트리거됨');
            loadMoreNotifications();
        }
    });
}

// ========== 개별 알림 읽음 처리 ==========

// 알림 클릭 핸들러
async function handleNotificationClick(notification) {
    console.log('알림 클릭됨:', notification);
    
    // 안읽은 알림이면 읽음 처리
    if (!notification.read) {
        const success = await markNotificationAsRead(notification.id);
        if (success) {
            // UI에서 읽음 상태로 변경
            const notificationElement = document.querySelector(`[data-notification-id="${notification.id}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
            }
            
            // 배지 업데이트
            const totalUnreadInList = document.querySelectorAll('.notification-item.unread').length;
            updateNotificationBadge(totalUnreadInList > 0);
            
            // 메모리에서도 읽음 상태로 업데이트
            if (window.notificationState && window.notificationState.notifications) {
                const notificationInState = window.notificationState.notifications.find(n => n.id === notification.id);
                if (notificationInState) {
                    notificationInState.read = true;
                }
            }
        }
    }
    
    // 알림 타입에 따라 페이지 이동
    const targetUrl = getNotificationTargetUrl(notification);
    if (targetUrl) {
        window.location.href = targetUrl;
    }
}

// 알림 타입에 따른 이동 URL 결정
function getNotificationTargetUrl(notification) {
    const type = notification.type.toUpperCase();
    
    switch (type) {
        case 'LIKE':
            // 좋아요 알림: 숙소 상세 페이지로 이동
            if (notification.houseId) {
                return `/page/listing-detail?id=${notification.houseId}`;
            }
            break;
        case 'SWAP':
        case 'BOOKING':
        case 'CHECK_IN':
        case 'CHECK_OUT':
        case 'TEST_NOTIFICATION':
            // 교환 관련 알림: 교환 관리 페이지로 이동
            return '/page/exchanges';
        default:
            console.warn('알 수 없는 알림 타입:', type);
            return '/page/exchanges'; // 기본값으로 교환 관리 페이지
    }
    
    return null;
}

// 개별 알림 읽음 처리 API
async function markNotificationAsRead(notificationId) {
    if (!window.auth?.accessToken) {
        console.error('인증 토큰이 없습니다.');
        return false;
    }
    
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('알림 읽음 처리 중 401 오류 - auth-common.js에서 토큰 갱신 처리됨');
                return false;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.httpStatus === 'OK') {
            console.log('개별 알림 읽음 처리 성공:', notificationId);
            return true;
        } else {
            throw new Error(data.message || '알림 읽음 처리 실패');
        }
    } catch (error) {
        console.error('개별 알림 읽음 처리 실패:', error);
        return false;
    }
} 