document.addEventListener('DOMContentLoaded', function() {
    // auth 객체가 없으면 생성
    if (!window.auth) {
        window.auth = {
            accessToken: null,
            tokenExpireTime: null,
            isInitialized: false,
            refreshInProgress: false
        };
    }

    // isLoggedIn 함수가 없으면 생성
    if (typeof window.isLoggedIn !== 'function') {
        window.isLoggedIn = function() {
            return !!window.auth.accessToken && !isTokenExpired();
        };

        // isTokenExpired 함수가 없으면 생성
        if (typeof window.isTokenExpired !== 'function') {
            window.isTokenExpired = function() {
                return !window.auth.tokenExpireTime || new Date().getTime() > window.auth.tokenExpireTime;
            };
        }

        // 토큰 만료 시간이 1분 이내인지 확인하는 함수
        if (typeof window.isTokenExpiringInOneMinute !== 'function') {
            window.isTokenExpiringInOneMinute = function() {
                if (!window.auth.tokenExpireTime) return false;
                const oneMinuteInMs = 60 * 1000;
                const timeLeft = window.auth.tokenExpireTime - new Date().getTime();
                return timeLeft > 0 && timeLeft < oneMinuteInMs;
            };
        }
    }

    // URL 파라미터에서 인증 토큰 확인
    checkAuthFromUrlParams();

    // 현재 페이지 활성화
    highlightCurrentPage();

    // 프로필 드롭다운 토글 기능
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.toggle('active');
        });

        // 드롭다운 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }

    // 로그아웃 버튼 이벤트
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('로그아웃 버튼 클릭됨');

            // window에 있는 로그아웃 함수를 찾아서 호출
            if (typeof window.authLogout === 'function') {
                console.log('auth.js의 logout 함수 호출');
                window.authLogout();
            } else if (typeof window.logout === 'function') {
                console.log('auth-common.js의 logout 함수 호출');
                window.logout();
            } else if (typeof logout === 'function') {
                console.log('전역 logout 함수 호출');
                logout();
            } else {
                console.log('로그아웃 함수를 찾을 수 없습니다. 직접 로그아웃 처리합니다.');
                // 로그아웃 함수가 없는 경우 직접 처리
                auth.accessToken = null;
                auth.tokenExpireTime = null;

                // 두 가지 로그아웃 API 모두 호출
                Promise.all([
                    fetch('/api/user/logout', {
                        method: 'POST',
                        credentials: 'include'
                    }).catch(e => console.error('사용자 로그아웃 API 오류:', e)),

                    fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    }).catch(e => console.error('쿠키 로그아웃 API 오류:', e))
                ]).finally(() => {
                    // 로그인 페이지로 리디렉션
                    window.location.href = '/page/auth';
                });
            }
        });
    }

    // URL 파라미터에서 토큰을 가져오지 않았다면 refreshToken을 확인
    if (!window.auth.accessToken) {
        // 수동으로 refreshToken 확인 및 인증 초기화
        manualInitAuth();
    }

    // 로그인 상태에 따라 UI 업데이트
    updateUIBasedOnAuthState();

    // 토큰 자동 갱신 타이머 설정
    setupTokenRefreshTimer();

    // Firebase 메시징 초기 설정 (포그라운드 메시지 핸들러 등록)
    setupFirebaseMessaging().then(success => {
        if (success) {
            console.log('Firebase 메시징 초기 설정 완료');
        } else {
            console.warn('Firebase 메시징 초기 설정 실패');
        }
    });

    // 인증 상태 변경 이벤트 리스너 추가
    document.addEventListener('authStateChanged', function(e) {
        console.log('authStateChanged 이벤트 발생!', e.detail);

        try {
            if (e.detail.isLoggedIn) {
                // 로그인 상태가 되면 FCM 토큰 등록 시도
                // 약간의 지연을 두어 페이지가 완전히 로드된 후 실행
                console.log('로그인 상태 감지: FCM 토큰 등록 예약됨');
                setTimeout(function() {
                    console.log('예약된 FCM 토큰 등록 시작');
                    registerFCMToken();
                }, 2000);
            } else {
                console.log('로그인되지 않은 상태로 변경됨');
            }
        } catch (error) {
            console.error('authStateChanged 이벤트 처리 중 오류:', error);
        }
    });

    // 페이지 로드 직후 auth.accessToken이 있는지 확인하고 FCM 토큰 등록 시도
    console.log('현재 인증 상태 확인:', window.auth);
    if (window.auth && window.auth.accessToken) {
        console.log('이미 로그인된 상태: FCM 토큰 등록 여부 확인');

        // 이미 등록된 토큰이 있는지, 유효한지 확인 후 필요한 경우에만 등록
        checkFCMTokenStatus().then(needsRegistration => {
            if (needsRegistration) {
                console.log('FCM 토큰 등록이 필요합니다.');
                setTimeout(function() {
                    console.log('기존 로그인 상태에서 FCM 토큰 등록 시도');
                    registerFCMToken();
                }, 3000);
            } else {
                console.log('FCM 토큰이 이미 유효하게 등록되어 있습니다.');
            }
        });
    }
});

// Firebase 초기화 및 포그라운드 메시지 핸들러 설정
async function setupFirebaseMessaging() {
    try {
        // Firebase 초기화
        const initialized = await initFirebase();
        if (!initialized) {
            throw new Error('Firebase 초기화에 실패했습니다.');
        }

        // 알림 권한 확인 및 요청
        if (!('Notification' in window)) {
            throw new Error('브라우저가 알림을 지원하지 않습니다.');
        }

        // 현재 알림 권한 로깅
        console.log('현재 알림 권한 상태:', Notification.permission);

        if (Notification.permission !== 'granted') {
            console.log('알림 권한 요청 중...');
            const permission = await Notification.requestPermission();
            console.log('알림 권한 요청 결과:', permission);
            if (permission !== 'granted') {
                throw new Error('알림 권한이 허용되지 않았습니다.');
            }
        }

        // 메시징 인스턴스 가져오기
        const messaging = firebase.messaging();

        // 서비스 워커 등록 (localhost가 아닌 경우)
        if (window.location.hostname !== 'localhost') {
            try {
                // 서비스 워커 직접 등록
                console.log('서비스 워커 등록 시도...');
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/firebase-cloud-messaging-push-scope'
                });
                console.log('서비스 워커 등록 성공:', registration);

                // 서비스 워커 설정
                messaging.useServiceWorker(registration);
            } catch (swError) {
                console.warn('서비스 워커 등록 실패, 기본 서비스 워커를 사용합니다:', swError);
            }
        } else {
            console.log('로컬 개발 환경에서는 기본 서비스 워커를 사용합니다.');
        }

        // 포그라운드 메시지 처리 핸들러 설정
        messaging.onMessage((payload) => {
            console.log('포그라운드 메시지 수신:', payload);

            // 포그라운드에서는 자동으로 알림이 표시되지 않으므로 직접 처리
            if (payload.notification) {
                // 웹 푸시 알림 설정
                const notificationTitle = payload.notification.title || '새로운 알림';
                const notificationOptions = {
                    body: payload.notification.body || '',
                    icon: '/img/logo.png',
                    tag: 'notification-' + Date.now(),  // 알림 그룹화를 위한 태그
                    requireInteraction: true,  // 사용자가 상호작용할 때까지 알림 유지
                    data: payload.data || {}
                };

                // 포그라운드 상태에서 알림 직접 표시
                if (Notification.permission === 'granted') {
                    try {
                        // 알림 생성 - 더 자세한 로깅 추가
                        console.log('웹 푸시 알림 생성 시도:', {
                            title: notificationTitle,
                            options: notificationOptions
                        });

                        const notification = new Notification(notificationTitle, notificationOptions);
                        console.log('웹 푸시 알림 생성 성공:', notification);

                        // 알림 클릭 이벤트
                        notification.onclick = function(event) {
                            console.log('알림 클릭됨:', event);
                            window.focus();
                            const url = payload.data?.url || '/';
                            window.location.href = url;
                            notification.close();
                        };

                        // 알림 닫기 이벤트
                        notification.onclose = function(event) {
                            console.log('알림 닫힘:', event);
                        };

                        // 알림 에러 이벤트
                        notification.onerror = function(event) {
                            console.error('알림 오류:', event);
                        };
                    } catch (notificationError) {
                        console.error('웹 푸시 알림 생성 실패:', notificationError);
                    }
                } else {
                    console.warn('알림 권한이 없어 웹 푸시 알림을 표시할 수 없습니다.');
                }

                // 토스트 메시지 표시 (선택적으로 비활성화 가능)
                // 웹 푸시 알림만 원한다면 아래 줄을 주석 처리하세요
                // showToastNotification(payload);
            }
        });

        console.log('Firebase 메시징 포그라운드 핸들러 등록 완료');
        return true;
    } catch (error) {
        console.error('Firebase 메시징 설정 실패:', error.message);
        return false;
    }
}

// URL 파라미터에서 인증 정보 확인
function checkAuthFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    // auth_success 파라미터가 있는지 확인
    if (urlParams.get('auth_success') === 'true') {
        const token = urlParams.get('token');
        const expireTime = urlParams.get('expire');

        if (token && expireTime) {
            // 메모리에 토큰 정보 저장
            window.auth.accessToken = token;
            window.auth.tokenExpireTime = parseInt(expireTime);
            window.auth.isInitialized = true;

            console.log('URL에서 인증 정보를 추출했습니다. 만료 시간:', new Date(window.auth.tokenExpireTime).toLocaleString());

            // 인증 이벤트 발생
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: true }
            }));

            // URL에서 인증 파라미터 제거 (히스토리 조작)
            const cleanUrl = window.location.protocol + '//' +
                window.location.host +
                window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
}

// 수동으로 인증 초기화
async function manualInitAuth() {
    // 이미 refreshToken을 확인 중이면 중복 실행 방지
    if (window.auth.refreshInProgress) {
        return false;
    }

    window.auth.refreshInProgress = true;

    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'include',
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();

            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
            window.auth.isInitialized = true;

            // UI 업데이트
            updateUIBasedOnAuthState();

            // 이벤트 발생
            if (typeof dispatchLoginEvent === 'function') {
                dispatchLoginEvent(true);
            } else {
                document.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { isLoggedIn: true }
                }));
            }

            window.auth.refreshInProgress = false;
            return true;
        }
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
    }

    window.auth.refreshInProgress = false;
    return false;
}

// 토큰이 곧 만료되는지 확인하고 필요하면 갱신하는 타이머 설정
function setupTokenRefreshTimer() {
    // 10초마다 토큰 상태 확인
    const tokenCheckInterval = setInterval(async function() {
        // 로그인 상태가 아니면 처리할 필요 없음
        if (!window.auth?.accessToken) {
            return;
        }

        // 토큰이 만료 1분 전이면 갱신
        if (isTokenExpiringInOneMinute()) {
            await refreshAccessToken();
        }
        // 토큰이 이미 만료되었다면 강제 갱신
        else if (isTokenExpired()) {
            const success = await refreshAccessToken();
            if (!success) {
                // 갱신 실패 시 로그인 페이지로 리디렉션 또는 적절한 처리
                console.log('토큰 갱신 실패, 로그인 상태 초기화');
                window.auth.accessToken = null;
                window.auth.tokenExpireTime = null;
                updateUIBasedOnAuthState();
            }
        }
    }, 10000); // 10초마다 체크

    // 페이지 언로드 시 타이머 정리
    window.addEventListener('beforeunload', function() {
        clearInterval(tokenCheckInterval);
    });
}

// 토큰 갱신 함수
async function refreshAccessToken() {
    // 이미 갱신 중이면 중복 실행 방지
    if (window.auth.refreshInProgress) {
        return false;
    }

    window.auth.refreshInProgress = true;

    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'include',
            cache: 'no-store'
        });

        if (response.ok) {
            const data = await response.json();

            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();

            console.log('토큰 갱신 성공. 만료 시간:', new Date(window.auth.tokenExpireTime).toLocaleString());

            window.auth.refreshInProgress = false;
            return true;
        }

        throw new Error('토큰 갱신 실패');
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
        window.auth.refreshInProgress = false;
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

// 로그인 상태에 따라 UI 업데이트
function updateUIBasedOnAuthState() {
    const isUserLoggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!window.auth?.accessToken;

    const userProfile = document.getElementById('user-profile');
    const authButtons = document.getElementById('auth-buttons');

    if (isUserLoggedIn) {
        // 로그인된 상태
        if (userProfile) userProfile.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        // 로그아웃된 상태
        if (userProfile) userProfile.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

// 인증 상태 변경 이벤트 리스너
document.addEventListener('authStateChanged', function(event) {
    updateUIBasedOnAuthState();
    // 로그인 상태일 때만 사용자 정보 가져오기
    if (event.detail.isLoggedIn && typeof fetchUserInfo === 'function') {
        fetchUserInfo();
    }
});

// 1초 후 인증 상태 확인
setTimeout(function() {
    if (!window.auth?.accessToken) {
        manualInitAuth().then(success => {
            updateUIBasedOnAuthState();
        });
    } else {
        updateUIBasedOnAuthState();
    }
}, 1000);

// 스크립트를 동적으로 로드하는 함수
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`스크립트 로드 성공: ${src}`);
            resolve();
        };
        script.onerror = () => {
            console.error(`스크립트 로드 실패: ${src}`);
            reject(new Error(`스크립트 로드 실패: ${src}`));
        };
        document.head.appendChild(script);
    });
}

// Firebase 초기화 함수
async function initFirebase() {
    console.log('Firebase 초기화 시도');

    try {
        // Firebase SDK가 로드되었는지 확인
        if (typeof firebase === 'undefined') {
            console.log('Firebase SDK가 로드되지 않았습니다. 동적으로 로드합니다.');

            // Firebase SDK 동적 로드
            await Promise.all([
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js'),
                loadScript('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js')
            ]);

            // 로드 확인
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK 로드 실패');
            }

            console.log('Firebase SDK 동적 로드 성공');
        }

        // 이미 초기화되었는지 확인
        try {
            firebase.app();
            console.log('Firebase가 이미 초기화되어 있습니다.');
            return true;
        } catch (e) {
            // 초기화되지 않음, 계속 진행
        }

        // API에서 Firebase 설정 가져오기
        const response = await fetch('/api/config/firebase');
        if (!response.ok) {
            throw new Error(`Firebase 설정 로드 실패: ${response.status}`);
        }

        const config = await response.json();
        console.log('Firebase 설정 로드 성공');

        // Firebase 초기화
        firebase.initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            appId: config.appId,
            measurementId: config.measurementId
        });

        // VAPID 키 저장
        window.vapidKey = config.vapidKey;

        console.log('Firebase 초기화 성공');

        return true;
    } catch (error) {
        console.error('Firebase 초기화 실패:', error.message);
        return false;
    }
}

// FCM 토큰 상태 확인 함수
async function checkFCMTokenStatus() {
    // 토큰 등록 여부 확인
    const tokenRegistered = localStorage.getItem('fcmTokenRegistered') === 'true';
    const tokenValue = localStorage.getItem('fcmToken');
    const tokenExpiry = localStorage.getItem('fcmTokenExpiry');

    console.log('FCM 토큰 상태 확인:', {
        tokenRegistered,
        hasTokenValue: !!tokenValue,
        tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toLocaleString() : 'none'
    });

    // 토큰이 등록되지 않았으면 등록 필요
    if (!tokenRegistered || !tokenValue) {
        return true;
    }

    // 토큰 만료 여부 확인 (14일마다 갱신 권장)
    if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry);
        // 만료 시간이 지났거나 1일 이내로 남았으면 갱신 필요
        if (Date.now() > expiryTime || Date.now() > expiryTime - 24 * 60 * 60 * 1000) {
            console.log('FCM 토큰이 만료되었거나 곧 만료됩니다.');
            return true;
        }
    } else {
        // 만료 시간 정보가 없으면 갱신 필요
        return true;
    }

    console.log('FCM 토큰이 유효합니다.');
    return false;
}

// FCM 토큰 가져오기 함수
async function getFCMToken() {
    console.log('FCM 토큰 요청');

    try {
        // Firebase 초기화 확인
        if (typeof firebase === 'undefined' || !firebase.messaging) {
            console.log('Firebase가 초기화되지 않았습니다. 초기화를 시도합니다.');
            const initialized = await initFirebase();
            if (!initialized) {
                throw new Error('Firebase 초기화에 실패했습니다.');
            }
        }

        // VAPID 키 확인
        if (!window.vapidKey) {
            throw new Error('VAPID 키가 설정되지 않았습니다.');
        }

        // 알림 권한 확인
        if (!('Notification' in window)) {
            throw new Error('브라우저가 알림을 지원하지 않습니다.');
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('알림 권한이 허용되지 않았습니다.');
            }
        }

        // 메시징 인스턴스 가져오기
        const messaging = firebase.messaging();

        // 토큰 가져오기
        console.log('FCM 토큰 요청 중...');

        // 토큰 옵션 설정
        const tokenOptions = { vapidKey: window.vapidKey };

        // 로컬 개발 환경에서는 서비스 워커 설정 조정
        if (window.location.hostname === 'localhost') {
            console.log('로컬 환경에서는 토큰 옵션 조정');
            // localhost에서는 serviceWorkerRegistration 옵션 생략
        }

        const token = await messaging.getToken(tokenOptions);

        if (token) {
            console.log('FCM 토큰 획득 성공:', token.substring(0, 10) + '...');
            return token;
        } else {
            throw new Error('토큰을 가져올 수 없습니다.');
        }
    } catch (error) {
        console.error('FCM 토큰 요청 실패:', error.message);

        // 개발 환경에서는 가짜 토큰 생성 (로컬 테스트용)
        if (window.location.hostname === 'localhost') {
            console.log('개발 환경용 가짜 FCM 토큰 생성');
            const fakeToken = 'fake-fcm-token-' + Math.random().toString(36).substring(2, 15);
            return fakeToken;
        }

        return null;
    }
}

// 토스트 알림 표시 함수
function showToastNotification(payload) {
    console.log('토스트 알림 표시:', payload);

    // 토스트 알림 컨테이너가 없으면 생성
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.minWidth = '250px';
    toast.style.cursor = 'pointer';

    // 제목 요소
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.textContent = payload.notification?.title || '새로운 알림';

    // 본문 요소
    const body = document.createElement('div');
    body.textContent = payload.notification?.body || '';

    // 요소 추가
    toast.appendChild(title);
    toast.appendChild(body);

    // 클릭 이벤트 - 관련 페이지로 이동
    toast.addEventListener('click', () => {
        const url = payload.data?.url || '/';
        window.location.href = url;
    });

    // 토스트 표시
    toastContainer.appendChild(toast);

    // 5초 후 자동으로 사라지게 설정
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';

        // 애니메이션 완료 후 제거
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 500);
    }, 5000);
}

// 토큰 등록 함수
async function registerFCMToken() {
    console.log('서버에 FCM 토큰 등록 시도');

    try {
        // 이미 등록된 토큰이 있고 아직 유효한지 확인
        const needsRegistration = await checkFCMTokenStatus();
        if (!needsRegistration) {
            console.log('FCM 토큰이 이미 유효하게 등록되어 있습니다. 등록을 건너뜁니다.');
            return true;
        }

        // 먼저 /api/token/refresh를 호출하여 최신 accessToken 획득
        console.log('액세스 토큰 갱신 시도...');
        const tokenResponse = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함
        });

        if (!tokenResponse.ok) {
            throw new Error('토큰 갱신 실패: ' + tokenResponse.status);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.accessToken;

        if (!accessToken) {
            throw new Error('액세스 토큰을 획득할 수 없습니다.');
        }

        // accessToken을 window.auth에 설정
        window.auth.accessToken = accessToken;
        window.auth.tokenExpireTime = new Date(tokenData.accessTokenExpireTime).getTime();
        window.auth.isInitialized = true;

        console.log('액세스 토큰 갱신 성공:', accessToken.substring(0, 10) + '...');

        // FCM 토큰 획득
        const token = await getFCMToken();
        if (!token) {
            throw new Error('FCM 토큰을 획득할 수 없습니다.');
        }

        // FCM 토큰이 이전에 등록한 것과 동일한지 확인
        const previousToken = localStorage.getItem('fcmToken');
        if (previousToken === token && localStorage.getItem('fcmTokenRegistered') === 'true') {
            console.log('동일한 FCM 토큰이 이미 등록되어 있습니다. 서버 요청을 건너뜁니다.');

            // 토큰 만료 시간 갱신 (14일)
            const expiryTime = Date.now() + 14 * 24 * 60 * 60 * 1000;
            localStorage.setItem('fcmTokenExpiry', expiryTime.toString());

            return true;
        }

        // 기기 정보 구성
        const deviceId = localStorage.getItem('device_id') || ('web_' + Math.random().toString(36).substring(2, 15));
        localStorage.setItem('device_id', deviceId);

        const deviceInfo = {
            deviceId: deviceId,
            deviceType: 'WEB',
            deviceModel: navigator.userAgent,
            fcmToken: token
        };

        console.log('디바이스 정보 구성 완료:', deviceInfo);

        // API 요청
        console.log('서버에 FCM 토큰 등록 중...');
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

        console.log('FCM 토큰이 성공적으로 등록되었습니다!');

        // 토큰 정보 저장
        localStorage.setItem('fcmTokenRegistered', 'true');
        localStorage.setItem('fcmToken', token);

        // 토큰 만료 시간 설정 (14일)
        const expiryTime = Date.now() + 14 * 24 * 60 * 60 * 1000;
        localStorage.setItem('fcmTokenExpiry', expiryTime.toString());

        return true;
    } catch (error) {
        console.error('FCM 토큰 등록 중 오류:', error);
        return false;
    }
}

// 인기 숙소 로드 함수
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