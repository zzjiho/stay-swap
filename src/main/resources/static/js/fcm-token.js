// FCM 토큰 관리 모듈
// Firebase Cloud Messaging 토큰을 발급받고 서버에 등록하는 기능을 제공합니다.

// FCM 초기화 및 토큰 발급 함수
async function initFCM() {
    try {
        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('알림 권한이 거부되었습니다.');
            return null;
        }

        // Firebase 앱이 이미 초기화되어 있다고 가정
        // 웹 푸시 인증서 키로 FCM 토큰 발급
        const token = await firebase.messaging().getToken({
            vapidKey: window.vapidKey // layout.html에서 설정된 전역 변수 사용
        });
        
        console.log('FCM 토큰:', token);
        
        // 토큰을 서버에 등록
        await registerTokenToServer(token);
        
        // 토큰 갱신 리스너 설정
        setupTokenRefreshListener();
        
        // 메시지 수신 리스너 설정
        setupMessageListener();
        
        return token;
    } catch (error) {
        console.error('FCM 초기화 중 오류 발생:', error);
        return null;
    }
}

// 서버에 토큰 등록
async function registerTokenToServer(token) {
    try {
        // 기기 정보 수집
        const deviceInfo = {
            deviceId: generateDeviceId(),
            deviceType: 'WEB',
            fcmToken: token,
            deviceName: navigator.userAgent
        };
        
        // 서버 API 호출
        const response = await fetch('/api/users/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAuthToken()
            },
            body: JSON.stringify(deviceInfo)
        });
        
        if (response.ok) {
            console.log('FCM 토큰이 서버에 성공적으로 등록되었습니다.');
            return true;
        } else {
            console.error('FCM 토큰 서버 등록 실패:', response.status);
            return false;
        }
    } catch (error) {
        console.error('FCM 토큰 서버 등록 중 오류 발생:', error);
        return false;
    }
}

// 기기 식별자 생성
function generateDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'web_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

// 인증 토큰 가져오기
function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
}

// 토큰 갱신 리스너 설정
function setupTokenRefreshListener() {
    firebase.messaging().onTokenRefresh(async () => {
        try {
            const refreshedToken = await firebase.messaging().getToken({
                vapidKey: window.vapidKey
            });
            console.log('토큰이 갱신되었습니다:', refreshedToken);
            await registerTokenToServer(refreshedToken);
        } catch (error) {
            console.error('토큰 갱신 중 오류 발생:', error);
        }
    });
}

// 메시지 수신 리스너 설정
function setupMessageListener() {
    firebase.messaging().onMessage((payload) => {
        console.log('포그라운드 메시지 수신:', payload);
        
        // 브라우저 알림 표시
        if (payload.notification) {
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/images/logo.png'
            };
            
            new Notification(notificationTitle, notificationOptions);
        }
    });
}

// 로그인 후 FCM 초기화 함수
async function initFCMAfterLogin() {
    const token = await initFCM();
    return token !== null;
}

// 페이지 로드 시 사용자가 로그인 상태라면 FCM 초기화
document.addEventListener('DOMContentLoaded', () => {
    if (getAuthToken()) {
        initFCM();
    }
}); 