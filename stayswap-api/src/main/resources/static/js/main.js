document.addEventListener('DOMContentLoaded', function() {
    // auth 객체 초기화
    if (!window.auth) {
        window.auth = {
            accessToken: null,
            tokenExpireTime: null,
            isInitialized: false,
            refreshInProgress: false
        };
    }

    // 인증 관련 함수들
    if (typeof window.isLoggedIn !== 'function') {
        window.isLoggedIn = function() {
            return !!window.auth.accessToken && !isTokenExpired();
        };

        window.isTokenExpired = function() {
            return !window.auth.tokenExpireTime || new Date().getTime() > window.auth.tokenExpireTime;
        };

        window.isTokenExpiringInOneMinute = function() {
            if (!window.auth.tokenExpireTime) return false;
            const oneMinuteInMs = 60 * 1000;
            const timeLeft = window.auth.tokenExpireTime - new Date().getTime();
            return timeLeft > 0 && timeLeft < oneMinuteInMs;
        };
    }

    // 초기화
    checkAuthFromUrlParams();
    highlightCurrentPage();
    initDropdowns();
    initLogoutButton();

    // 인증 상태 확인 및 UI 업데이트
    if (!window.auth.accessToken) {
        manualInitAuth();
    }
    updateUIBasedOnAuthState();
    setupTokenRefreshTimer();

    // Firebase 메시징 설정
    setupFirebaseMessaging();

    // 인증 상태 변경 이벤트 리스너
    document.addEventListener('authStateChanged', function(e) {
        updateUIBasedOnAuthState();
        if (e.detail.isLoggedIn) {
            setTimeout(() => registerFCMToken(), 2000);
        }
    });

    // 기존 로그인 상태에서 FCM 토큰 등록
    if (window.auth && window.auth.accessToken) {
        checkFCMTokenStatus().then(needsRegistration => {
            if (needsRegistration) {
                setTimeout(() => registerFCMToken(), 3000);
            }
        });
    }
});

// 드롭다운 초기화
function initDropdowns() {
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationToggle = document.getElementById('notification-dropdown-toggle');
    const notificationDropdown = document.getElementById('notification-dropdown');

    // 프로필 드롭다운
    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.toggle('active');
            if (notificationDropdown) {
                notificationDropdown.classList.remove('active');
            }
        });
    }

    // 알림 드롭다운
    if (notificationToggle && notificationDropdown) {
        notificationToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpening = !notificationDropdown.classList.contains('active');
            
            notificationDropdown.classList.toggle('active');
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }
            
            // 드롭다운 열릴 때 알림 로드
            if (isOpening && window.auth?.accessToken) {
                loadNotificationsOnDropdownOpen();
                // 무한 스크롤 설정 (드롭다운이 열릴 때)
                setTimeout(() => setupNotificationInfiniteScroll(), 100);
            }
        });
    }

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
        if (profileToggle && profileDropdown && 
            !profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
        if (notificationToggle && notificationDropdown && 
            !notificationToggle.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.remove('active');
        }
    });
}

// 로그아웃 버튼 초기화
function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 로그아웃 함수 호출 시도
            if (typeof window.authLogout === 'function') {
                window.authLogout();
            } else if (typeof window.logout === 'function') {
                window.logout();
            } else {
                // 직접 로그아웃 처리
                window.auth.accessToken = null;
                window.auth.tokenExpireTime = null;

                Promise.all([
                    fetch('/api/user/logout', { method: 'POST', credentials: 'include' }).catch(() => {}),
                    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
                ]).finally(() => {
                    window.location.href = '/page/auth';
                });
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

// URL 파라미터에서 인증 정보 확인
function checkAuthFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('auth_success') === 'true') {
        const token = urlParams.get('token');
        const expireTime = urlParams.get('expire');

        if (token && expireTime) {
            window.auth.accessToken = token;
            window.auth.tokenExpireTime = parseInt(expireTime);
            window.auth.isInitialized = true;

            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: true }
            }));

            // URL 정리
            const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
}

// 인증 초기화
async function manualInitAuth() {
    if (window.auth.refreshInProgress) return false;
    window.auth.refreshInProgress = true;

    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
            window.auth.isInitialized = true;

            updateUIBasedOnAuthState();
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: true }
            }));

            window.auth.refreshInProgress = false;
            return true;
        }
    } catch (error) {
        console.error('토큰 갱신 오류:', error);
    }

    window.auth.refreshInProgress = false;
    return false;
}

// 토큰 자동 갱신 타이머
function setupTokenRefreshTimer() {
    const tokenCheckInterval = setInterval(async function() {
        if (!window.auth?.accessToken) return;

        if (isTokenExpiringInOneMinute() || isTokenExpired()) {
            const success = await refreshAccessToken();
            if (!success && isTokenExpired()) {
                window.auth.accessToken = null;
                window.auth.tokenExpireTime = null;
                updateUIBasedOnAuthState();
            }
        }
    }, 10000);

    window.addEventListener('beforeunload', function() {
        clearInterval(tokenCheckInterval);
    });
}

// 토큰 갱신
async function refreshAccessToken() {
    if (window.auth.refreshInProgress) return false;
    window.auth.refreshInProgress = true;

    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();
            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
            window.auth.refreshInProgress = false;
            return true;
        }
    } catch (error) {
        console.error('토큰 갱신 오류:', error);
    }

    window.auth.refreshInProgress = false;
    return false;
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
    const isUserLoggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!window.auth?.accessToken;
    const userProfile = document.getElementById('user-profile');
    const authButtons = document.getElementById('auth-buttons');
    const notificationIcon = document.getElementById('notification-icon');

    if (isUserLoggedIn) {
        if (userProfile) userProfile.style.display = 'block';
        if (notificationIcon) notificationIcon.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        if (userProfile) userProfile.style.display = 'none';
        if (notificationIcon) notificationIcon.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
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

        // 토큰 갱신
        const tokenResponse = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include'
        });

        if (!tokenResponse.ok) throw new Error('토큰 갱신 실패');

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.accessToken;

        window.auth.accessToken = accessToken;
        window.auth.tokenExpireTime = new Date(tokenData.accessTokenExpireTime).getTime();
        window.auth.isInitialized = true;

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

// 인증 상태 변경 이벤트 리스너 (백업)
document.addEventListener('authStateChanged', function(event) {
    updateUIBasedOnAuthState();
    if (event.detail.isLoggedIn && typeof fetchUserInfo === 'function') {
        fetchUserInfo();
    }
});

// 1초 후 인증 상태 확인 (백업)
setTimeout(function() {
    if (!window.auth?.accessToken) {
        manualInitAuth().then(success => {
            updateUIBasedOnAuthState();
        });
    } else {
        updateUIBasedOnAuthState();
    }
}, 1000);

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
                const refreshSuccess = await refreshAccessToken();
                if (refreshSuccess) {
                    return await fetchNotifications(pivot);
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