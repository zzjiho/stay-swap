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

    // 초기화 순서 정리
    initializeMainComponents();
});

async function initializeMainComponents() {
    try {
        // 1. UI 초기화 (Firebase와 독립적으로 먼저 실행)
        highlightCurrentPage();
        initDropdowns();
        initLogoutButton();
        initAuthRequiredLinks();

        // 2. 인증 상태 변경 이벤트 리스너 (auth-common.js 이벤트에만 의존)
        setupAuthEventListeners();

        // 3. Firebase 및 토큰 설정 (비동기로 백그라운드에서 실행)
        setupFirebaseMessaging().catch(error => {
            console.warn('Firebase 메시징 설정 실패:', error);
        });

        // 4. Firebase 준비 상태 로깅
        // setTimeout(() => {
        //     console.log('🔍 초기화 완료 후 Firebase 상태:', {
        //         firebaseExists: typeof firebase !== 'undefined',
        //         messagingExists: typeof firebase !== 'undefined' && typeof firebase.messaging === 'function',
        //         vapidKey: window.vapidKey ? '설정됨' : '없음'
        //     });
        // }, 1000);

    } catch (error) {
        console.error('Main 컴포넌트 초기화 실패:', error);
    }
}

function setupAuthEventListeners() {
    // 인증 상태 변경 이벤트 리스너 (auth-common.js 이벤트에만 의존)
    if (!window.authEventListenerAdded) {
        window.authEventListenerAdded = true;
        
        document.addEventListener('authStateChanged', function(e) {
            
            // 로그아웃 시 알림 체크 플래그 리셋
            if (!e.detail.isLoggedIn) {
                window.notificationCheckedOnce = false;
            }
            
            updateUIBasedOnAuthState();
            if (e.detail.isLoggedIn) {
                // Firebase 초기화를 충분히 기다린 후 FCM 등록
                setTimeout(async () => {
                    await registerFCMToken();
                }, 3000);
            }
        });
    }
}

// 로그인 필요 체크 및 리다이렉트 함수
function requireLogin(action = '') {
    if (typeof window.isLoggedIn === 'function' && window.isLoggedIn()) {
        return true; // 로그인 상태
    }
    
    // 친근한 메시지와 함께 리다이렉트
    const messages = [
        '로그인하고 더 많은 기능을 이용해보세요! 🌟',
        '회원만의 특별한 특별한 서비스가 기다리고 있어요! ✨',
        '로그인하면 더 편리하게 이용할 수 있어요! 🚀',
        '잠깐! 로그인 후 이용 가능한 서비스예요 😊',
        '로그인하고 멋진 여행을 시작해보세요! 🎒'
    ];
    
    const actionMessages = {
        '숙소 등록': '나만의 특별한 숙소를 등록하려면 로그인이 필요해요! 🏠✨',
        '교환 관리': '교환 내역을 확인하려면 로그인해주세요! 🔄',
        '프로필': '내 정보를 보려면 로그인이 필요해요! 👤',
        '알림': '알림을 확인하려면 로그인해주세요! 🔔'
    };
    
    const message = actionMessages[action] || messages[Math.floor(Math.random() * messages.length)];
    
    // 현재 페이지 URL을 저장 (로그인 후 돌아올 수 있도록)
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    
    // 친근한 알림 메시지
    if (typeof alert !== 'undefined') {
        alert(message);
    }
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '/page/auth';
    return false;
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
    
    // 기존 초기화 플래그 리셋
    window.apiFlags.initializingDropdowns = false;
    
    // 헤더 요소들의 이벤트 리스너 상태 리셋
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const notificationToggle = document.getElementById('notification-dropdown-toggle');
    
    
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
    
    // 인증 필요 링크들도 다시 초기화
    initAuthRequiredLinks();
    
}

// 전역에서 접근 가능하도록 노출
window.reinitializeDropdowns = reinitializeDropdowns;
window.requireLogin = requireLogin;

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
    
    e.preventDefault();
    
    // 로그인 체크
    if (!requireLogin('알림')) {
        return; // 로그인하지 않은 경우 리다이렉트됨
    }
    
    const profileDropdown = document.getElementById('profile-dropdown');
    const notificationDropdown = document.getElementById('notification-dropdown');
    
    
    if (!notificationDropdown) {
        console.error('🔍 알림 드롭다운 요소를 찾을 수 없음');
        return;
    }
    
    const isOpening = !notificationDropdown.classList.contains('active');
    
    // 드롭다운이 닫힐 때 무한 스크롤 설정 초기화
    if (!isOpening) {
        const notificationList = document.querySelector('.notification-list');
        if (notificationList) {
            notificationList.dataset.infiniteScrollSetup = 'false';
            if (window.notificationState) {
                window.notificationState.infiniteScrollSetup = false;
            }
        }
    }
    
    notificationDropdown.classList.toggle('active');
    if (profileDropdown) {
        profileDropdown.classList.remove('active');
    }

    // 드롭다운 열릴 때 알림 로드
    if (isOpening && window.isLoggedIn()) {
        loadNotificationsOnDropdownOpen();
    } else if (isOpening && !window.isLoggedIn()) {
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
        // 알림 드롭다운이 열려있었다면 무한 스크롤 설정 초기화
        if (notificationDropdown.classList.contains('active')) {
            const notificationList = document.querySelector('.notification-list');
            if (notificationList) {
                notificationList.dataset.infiniteScrollSetup = 'false';
                if (window.notificationState) {
                    window.notificationState.infiniteScrollSetup = false;
                }
            }
        }
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

// 로그인이 필요한 링크들 초기화
function initAuthRequiredLinks() {
    // 숙소 등록 링크
    const newListingLinks = document.querySelectorAll('a[href="/page/new"]');
    newListingLinks.forEach(link => {
        if (!link.dataset.authInitialized) {
            link.dataset.authInitialized = 'true';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (requireLogin('숙소 등록')) {
                    window.location.href = '/page/new';
                }
            });
        }
    });

    // 교환 관리 링크
    const exchangeLinks = document.querySelectorAll('a[href="/page/exchanges"]');
    exchangeLinks.forEach(link => {
        if (!link.dataset.authInitialized) {
            link.dataset.authInitialized = 'true';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (requireLogin('교환 관리')) {
                    window.location.href = '/page/exchanges';
                }
            });
        }
    });

    // 프로필 관련 링크
    const profileLinks = document.querySelectorAll('a[href="/page/profile"]');
    profileLinks.forEach(link => {
        if (!link.dataset.authInitialized) {
            link.dataset.authInitialized = 'true';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (requireLogin('프로필')) {
                    window.location.href = '/page/profile';
                }
            });
        }
    });
}

// Firebase 메시징 설정
async function setupFirebaseMessaging() {
    try {
        
        // Firebase SDK 로딩 대기 (짧은 시간)
        const firebaseReady = await waitForFirebase(2000);
        if (!firebaseReady) {
            console.warn('Firebase SDK가 로드되지 않았거나 메시징을 사용할 수 없습니다.');
            return false;
        }

        // Firebase App 초기화 확인 및 수행
        try {
            if (!firebase.apps.length) {
                let configToUse = window.firebaseConfig;
                
                // firebaseConfig가 없으면 하드코딩된 설정 사용
                if (!configToUse) {
                    console.warn('⚠️ window.firebaseConfig가 없어서 하드코딩된 설정 사용');
                    configToUse = {
                        apiKey: "AIzaSyD5HvXq5LensKV4jTMNnrXavRIw8whDvh4",
                        authDomain: "stay-swap.firebaseapp.com",
                        projectId: "stay-swap",
                        storageBucket: "stay-swap.firebasestorage.app",
                        messagingSenderId: "448255567490",
                        appId: "1:448255567490:web:5c517e8ec4590e3f8d369b",
                        measurementId: "G-WC7EQWH9Z9"
                    };
                }
                
                
                firebase.initializeApp(configToUse);
                
            } else {
                
            }
        } catch (initError) {
            console.error('❌ Firebase App 초기화 실패:', initError);
            return false;
        }

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

    
    // 현재 body 클래스 확인
    const currentClass = document.body.className;
    const targetClass = isUserLoggedIn ? 'auth-logged-in' : 'auth-logged-out';
    
    if (currentClass === targetClass) {
        
        // 상태가 같더라도 로그인 상태일 때는 알림 확인
        if (isUserLoggedIn && !window.notificationCheckedOnce) {
            window.notificationCheckedOnce = true;
            setTimeout(() => checkNewNotifications(), 200);
        }
        return;
    }

    
    // body 클래스 변경으로 CSS가 자동으로 UI 업데이트
    document.body.className = targetClass;

    if (isUserLoggedIn) {
        // 로그인 상태일 때 새 알림 확인 (페이지당 1회만)
        if (!window.notificationCheckedOnce) {
            window.notificationCheckedOnce = true;
            setTimeout(() => checkNewNotifications(), 200);
        }
    } else {
        // 로그아웃 상태일 때 배지 숨기기
        updateNotificationBadge(false);

        // 로그아웃 시 플래그 초기화 (다음 로그인에서 다시 한 번만 호출되도록)
        window.notificationCheckedOnce = false;
    }
}

// Firebase 초기화 (layout.html에서 이미 처리되므로 여기서는 제거)
// async function initFirebase() { ... }

// 스크립트 로드 (layout.html에서 이미 처리되므로 여기서는 제거)
// function loadScript(src) { ... }

// FCM 토큰 상태 확인 (HttpOnly 쿠키 사용으로 클라이언트에서 직접 판단 어려움)
async function checkFCMTokenStatus() {
    // 서버에 FCM 토큰 등록 여부 및 유효성 확인 API를 호출하는 것이 더 정확합니다.
    // 여기서는 단순히 항상 갱신이 필요하다고 가정하여 FCM 토큰을 다시 요청하도록 함.
    return true;
}

// 동적으로 Firebase SDK 로드하는 함수
async function loadFirebaseSDK() {
    
    try {
        // Firebase App SDK 로드
        if (typeof firebase === 'undefined') {
            await new Promise((resolve, reject) => {
                const script1 = document.createElement('script');
                script1.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js';
                script1.onload = resolve;
                script1.onerror = reject;
                document.head.appendChild(script1);
            });
            
        }
        
        // Firebase Messaging SDK 로드
        if (typeof firebase.messaging === 'undefined') {
            await new Promise((resolve, reject) => {
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js';
                script2.onload = resolve;
                script2.onerror = reject;
                document.head.appendChild(script2);
            });
            
        }
        
        return true;
    } catch (error) {
        console.error('❌ Firebase SDK 동적 로딩 실패:', error);
        return false;
    }
}

// Firebase SDK 로딩 대기 함수
async function waitForFirebase(maxWaitTime = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        if (typeof firebase !== 'undefined' && 
            typeof firebase.messaging === 'function') {
            
            // VAPID 키는 별도로 체크 (없어도 계속 진행)
            if (window.vapidKey) {
                
            } else {
                console.warn('⚠️ VAPID 키가 없지만 계속 진행');
            }
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.warn('⚠️ Firebase SDK 기본 로딩 실패 - 동적 로딩 시도');
    
    // 동적 로딩 시도
    const dynamicLoadSuccess = await loadFirebaseSDK();
    if (dynamicLoadSuccess) {
        
        // 동적 로딩 후에는 초기화하지 않음 (setupFirebaseMessaging에서 처리)
        
        return true;
    }
    
    console.error('❌ Firebase SDK 로딩 완전 실패 - FCM 기능 비활성화');
    return false;
}

// FCM 토큰 가져오기
async function getFCMToken() {
    
    try {
        // 1. Firebase SDK 로딩 대기
        const firebaseReady = await waitForFirebase();
        if (!firebaseReady) {
            console.error('❌ Firebase SDK가 로드되지 않았거나 메시징을 사용할 수 없습니다.');
            return null;
        }
        
        // 2. Firebase SDK 체크
        
        // Firebase App 초기화 확인
        if (!firebase.apps.length) {
            let configToUse = window.firebaseConfig;
            
            // firebaseConfig가 없으면 하드코딩된 설정 사용
            if (!configToUse) {
                console.warn('⚠️ window.firebaseConfig가 없어서 하드코딩된 설정 사용');
                configToUse = {
                    apiKey: "AIzaSyD5HvXq5LensKV4jTMNnrXavRIw8whDvh4",
                    authDomain: "stay-swap.firebaseapp.com",
                    projectId: "stay-swap",
                    storageBucket: "stay-swap.firebasestorage.app",
                    messagingSenderId: "448255567490",
                    appId: "1:448255567490:web:5c517e8ec4590e3f8d369b",
                    measurementId: "G-WC7EQWH9Z9"
                };
            }
            
            
            firebase.initializeApp(configToUse);
            
        }

        // VAPID 키 확인 및 설정
        if (!window.vapidKey) {
            console.warn('⚠️ window.vapidKey가 없어서 하드코딩된 VAPID 키 사용');
            window.vapidKey = "BIM4nVsLIiPtUFFZmB8Lv_sxV-yb3RZCYVDL2FZby_jlAPnAxJEvS8u8kd9y7jYQ8r2lzturlnoU5Slu1KIZ8Ww";
        }
        
        

        // 2. 알림 권한 체크
        
        if (Notification.permission !== 'granted') {
            
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                throw new Error(`알림 권한 거부됨: ${permission}`);
            }
        }

        // 3. Service Worker 등록 상태 체크
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            
            if (!registration) {
                
                await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                
            }
        }

        // 4. FCM 토큰 획득
        
        const messaging = firebase.messaging();
        const token = await messaging.getToken({ 
            vapidKey: window.vapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
        });

        if (token) {
            
            return token;
        }
        
        throw new Error('토큰이 반환되지 않음');
        
    } catch (error) {
        console.error('❌ FCM 토큰 요청 실패:', error);
        console.error('❌ 오류 상세:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // 개발 환경용 가짜 토큰 (Firebase가 정말 작동하지 않을 때만)
        
        const fakeToken = 'fake-fcm-token-' + Math.random().toString(36).substring(2, 15);
        
        return fakeToken;
    }
}

// FCM 토큰 등록
async function registerFCMToken() {
    try {
        const needsRegistration = await checkFCMTokenStatus();
        if (!needsRegistration) return true;

        // FCM 토큰 획득
        const token = await getFCMToken();
        if (!token) throw new Error('FCM 토큰 획득 실패');

        const deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
        const deviceInfo = {
            deviceId: deviceId,
            deviceType: 'WEB',
            deviceModel: navigator.userAgent,
            fcmToken: token
        };

        // 서버 등록 (fetchWithAuth 사용)
        const response = await window.fetchWithAuth('/api/users/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceInfo),
        });

        if (!response || !response.ok) { // fetchWithAuth에서 null 반환 가능성 고려
            const errorText = response ? await response.text() : 'Unknown error';
            throw new Error(`FCM 토큰 등록 실패 (${response?.status}): ${errorText}`);
        }

        // 성공시 localStorage에 저장
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24시간
        localStorage.setItem('device_id', deviceId);
        localStorage.setItem('fcmToken', token);
        localStorage.setItem('fcmTokenExpiry', expiryTime.toString());
        localStorage.setItem('fcmTokenRegistered', 'true');
        
        

        return true;
    } catch (error) {
        console.error('FCM 토큰 등록 오류:', error);
        return false;
    }
}

// 로그인 후 FCM 초기화 함수 (login.js에서 호출)
async function initFCMAfterLogin() {
    
    try {
        // Firebase SDK 로딩 대기
        
        const firebaseReady = await waitForFirebase(15000); // 15초 대기
        if (!firebaseReady) {
            console.error('❌ Firebase SDK 로딩 실패');
            return false;
        }
        
        // Service Worker 등록
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            
        }
        
        // FCM 토큰 등록
        const success = await registerFCMToken();
        
        return success;
    } catch (error) {
        console.error('❌ initFCMAfterLogin 오류:', error);
        return false;
    }
}

// 전역 함수로 노출
window.initFCMAfterLogin = initFCMAfterLogin;

// 인기 숙소 로드
function loadPopularHouses() {
    window.fetchWithAuth('/api/house/popular?limit=3', {
            method: 'GET'
        })
        .then(response => {
            if (!response) { // fetchWithAuth에서 null 반환 시
                console.warn('인기 숙소 로드 실패: 인증 필요 또는 네트워크 오류');
                return;
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(response => {
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
                                <p class="property-location">${house.cityKo} ${house.districtKo}</p>
                                <a href="/page/listing-detail?id=${house.houseId}" class="btn btn-primary btn-block">자세히 보기</a>
                            </div>
                        </div>
                    `;
                    popularHousesContainer.append(houseCard);
                });
            }
        })
        .catch(error => {
            console.error('인기 숙소 로드 실패:', error);
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
        return false;
    }

    // auth-common.js의 인증 상태 확인 함수 사용
    if (typeof window.isLoggedIn !== 'function' || !window.isLoggedIn()) {
        return false;
    }

    window.apiFlags.checkingNotifications = true;

    try {
        const response = await window.fetchWithAuth('/api/notifications/new', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response || !response.ok) { // fetchWithAuth에서 null 반환 가능성 고려
            if (response?.status === 401) {
                return false;
            }
            throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
        }

        const data = await response.json();

        if (data.httpStatus === 'OK' && data.data) {
            const hasNew = data.data.hasNew;
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
    if (!window.isLoggedIn()) {
        return { success: false, error: 'NO_TOKEN' };
    }

    try {
        window.notificationState.loading = true;
        
        let url = '/api/notifications';
        if (pivot) {
            url += `?pivot=${encodeURIComponent(pivot)}`;
        }

        const response = await window.fetchWithAuth(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response || !response.ok) { // fetchWithAuth에서 null 반환 가능성 고려
            if (response?.status === 401) {
                return { success: false, error: 'UNAUTHORIZED' };
            }
            throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
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
        // 빈 목록이어도 무한 스크롤 설정
        setTimeout(() => setupNotificationInfiniteScroll(), 50);
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
    
    // 렌더링 완료 후 무한 스크롤 설정 및 초기 스크롤 체크
    if (!append) {
        // 초기 렌더링 시에만 무한 스크롤 설정
        setTimeout(() => {
            setupNotificationInfiniteScroll();
            // 초기에 스크롤이 없으면 자동으로 더 로드
            checkAndLoadMoreIfNeeded();
        }, 50);
    } else {
        // 추가 렌더링 후에도 스크롤 체크
        setTimeout(() => checkAndLoadMoreIfNeeded(), 50);
    }
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
        window.notificationState = {
            notifications: [],
            pivot: null,
            hasNext: true,
            loading: false,
            initialized: false,
            infiniteScrollSetup: false
        };
    }
    
    
    if (!window.notificationState.hasNext || window.notificationState.loading) {
        return;
    }
    
    
    const result = await fetchNotifications(window.notificationState.pivot);
    
    
    if (result.success) {
        window.notificationState.notifications.push(...result.notifications);
        window.notificationState.pivot = result.pivot;
        window.notificationState.hasNext = result.hasNext;
        
        
        renderNotifications(result.notifications, true);
    } else {
        console.error('다음 페이지 로드 실패:', result.error);
    }
}

// 스크롤이 필요한지 체크하고 필요하면 필요하면 더 로드
function checkAndLoadMoreIfNeeded() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    const { scrollHeight, clientHeight } = notificationList;
    
    
    // 스크롤이 필요하지 않고 더 로드할 데이터가 있으면 자동 로드
    // 단, 최소 알림 개수(예: 3개) 이상일 때만 자동 로드 (무한 루프 방지)
    if (scrollHeight <= clientHeight && 
        window.notificationState?.hasNext && 
        !window.notificationState?.loading &&
        (window.notificationState?.notifications?.length || 0) < 15) { // 최대 15개까지만 자동 로드
        loadMoreNotifications();
    }
}

// 무한 스크롤 설정
function setupNotificationInfiniteScroll() {
    // window.notificationState가 아직 초기화되지 않은 경우 초기화
    if (!window.notificationState) {
        window.notificationState = {
            notifications: [],
            pivot: null,
            hasNext: true,
            loading: false,
            initialized: false,
            infiniteScrollSetup: false
        };
    }
    
    // notification-list가 실제 스크롤이 일어나는 요소
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) {
        console.warn('알림 리스트를 찾을 수 없습니다.');
        return;
    }
    
    // 이미 설정되었는지 확인 (DOM 요소에 직접 체크)
    if (notificationList.dataset.infiniteScrollSetup === 'true') {
        return;
    }
    
    
    // DOM 요소에 설정 완료 표시
    notificationList.dataset.infiniteScrollSetup = 'true';
    window.notificationState.infiniteScrollSetup = true;
    
    // 스크롤 이벤트 핸들러 정의
    const scrollHandler = function() {
        const { scrollTop, scrollHeight, clientHeight } = this;
        
        
        // 스크롤이 하단 근처에 도달했을 때
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            loadMoreNotifications();
        }
    };
    
    // 기존 이벤트 리스너 제거 후 새로 추가
    notificationList.removeEventListener('scroll', scrollHandler);
    notificationList.addEventListener('scroll', scrollHandler);
    
}

// ========== 개별 알림 읽음 처리 ==========

// 알림 클릭 핸들러
async function handleNotificationClick(notification) {
    
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
        default: return 'fa-bell';
    }
}

// 개별 알림 읽음 처리 API
async function markNotificationAsRead(notificationId) {
    if (!window.isLoggedIn()) {
        console.error('인증 토큰이 없습니다.');
        return false;
    }
    
    try {
        const response = await window.fetchWithAuth(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        
        if (!response || !response.ok) {
            if (response?.status === 401) {
                return false;
            }
            throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.httpStatus === 'OK') {
            return true;
        } else {
            throw new Error(data.message || '알림 읽음 처리 실패');
        }
    } catch (error) {
        console.error('개별 알림 읽음 처리 실패:', error);
        return false;
    }
}