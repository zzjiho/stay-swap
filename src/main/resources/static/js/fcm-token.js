// FCM 토큰 관리 모듈
// Firebase Cloud Messaging 토큰을 발급받고 서버에 등록하는 기능을 제공합니다.

console.log('🔍 fcm-token.js 로드됨');

// 종속성 확인
if (typeof jQuery === 'undefined') {
    console.error('❌ jQuery가 로드되지 않았습니다. FCM 토큰 모듈을 초기화할 수 없습니다.');
    if (window.fcmDebug) {
        window.fcmDebug.errors.push('jQuery가 로드되지 않음');
    }
} else {
    console.log('✅ jQuery 로드됨');
}

// FCM 초기화 및 토큰 발급 함수
function initFCM() {
    console.log('🔍 initFCM 함수 호출됨');
    
    // jQuery 확인
    if (typeof jQuery === 'undefined') {
        console.error('❌ jQuery가 로드되지 않았습니다.');
        return Promise.reject(new Error('jQuery가 로드되지 않았습니다.'));
    }
    
    // Firebase 초기화 상태 확인
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase가 로드되지 않았습니다.');
        return Promise.reject(new Error('Firebase가 로드되지 않았습니다.'));
    }
    
    // Firebase 초기화 확인
    try {
        firebase.app();
        console.log('✅ Firebase가 초기화되었습니다.');
    } catch (error) {
        console.error('❌ Firebase가 초기화되지 않았습니다:', error);
        return Promise.reject(new Error('Firebase가 초기화되지 않았습니다.'));
    }
    
    // VAPID 키 확인
    if (!window.vapidKey) {
        console.error('❌ VAPID 키가 설정되지 않았습니다.');
        return Promise.reject(new Error('VAPID 키가 설정되지 않았습니다.'));
    }
    
    return new Promise(function(resolve, reject) {
        // 알림 권한 요청
        console.log('🔍 알림 권한 요청 중...');
        Notification.requestPermission()
            .then(function(permission) {
                console.log('✅ 알림 권한 응답:', permission);
                if (permission !== 'granted') {
                    console.log('❌ 알림 권한이 거부되었습니다.');
                    resolve(null);
                    return;
                }

                console.log('✅ 알림 권한이 허용되었습니다.');
                console.log('🔍 FCM 토큰 요청 중...');
                
                // 웹 푸시 인증서 키로 FCM 토큰 발급
                firebase.messaging().getToken({
                    vapidKey: window.vapidKey
                })
                .then(function(token) {
                    console.log('✅ FCM 토큰 획득 성공:', token);
                    
                    // 토큰을 서버에 등록
                    console.log('🔍 서버에 토큰 등록 시도 중...');
                    registerTokenToServer(token)
                        .then(function() {
                            console.log('✅ 토큰 등록 완료, 리스너 설정 중...');
                            // 토큰 갱신 리스너 설정
                            setupTokenRefreshListener();
                            
                            // 메시지 수신 리스너 설정
                            setupMessageListener();
                            
                            resolve(token);
                        })
                        .catch(function(error) {
                            console.error('❌ 토큰 등록 중 오류:', error);
                            resolve(token); // 토큰 등록 실패해도 토큰은 반환
                        });
                })
                .catch(function(error) {
                    console.error('❌ 토큰 요청 중 오류:', error);
                    reject(error);
                });
            })
            .catch(function(error) {
                console.error('❌ 알림 권한 요청 중 오류:', error);
                reject(error);
            });
    });
}

// 서버에 토큰 등록
function registerTokenToServer(token) {
    // 인증 토큰 확인
    const authToken = getAuthToken();
    console.log('🔍 인증 토큰 확인:', authToken ? '유효함' : '없음');
    
    if (!authToken) {
        console.error('❌ 인증 토큰이 없습니다. 로그인 상태를 확인하세요.');
        return Promise.reject(new Error('인증 토큰이 없습니다'));
    }
    
    // 인증 토큰을 전역 변수에 저장 (없을 경우)
    if (window.auth && !window.auth.accessToken) {
        window.auth.accessToken = authToken;
        console.log('✅ 찾은 인증 토큰을 메모리에 저장했습니다.');
    }
    
    // 기기 정보 수집
    const deviceInfo = {
        deviceId: generateDeviceId(),
        deviceType: 'WEB',
        fcmToken: token,
        deviceName: navigator.userAgent
    };
    
    console.log('🔍 디바이스 정보:', deviceInfo);
    
    // jQuery를 사용한 서버 API 호출
    return $.ajax({
        url: '/api/users/devices',
        type: 'POST',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        data: JSON.stringify(deviceInfo),
        success: function(response) {
            console.log('✅ FCM 토큰이 서버에 성공적으로 등록되었습니다.', response);
            // 토큰 등록 성공 시 로컬 스토리지에 저장
            localStorage.setItem('fcmTokenRegistered', 'true');
        },
        error: function(xhr, status, error) {
            console.error('❌ FCM 토큰 서버 등록 실패:', status, error);
            console.error('응답 상태:', xhr.status);
            if (xhr.responseText) {
                console.error('응답 내용:', xhr.responseText);
            }
            throw new Error('토큰 등록 실패: ' + (xhr.responseJSON?.message || error));
        }
    });
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
    // 메모리에 있는 토큰 우선 확인
    if (window.auth && window.auth.accessToken) {
        console.log('✅ 메모리에서 인증 토큰을 찾았습니다.');
        return window.auth.accessToken;
    }
    
    // localStorage/sessionStorage에서 토큰 확인
    const localToken = localStorage.getItem('accessToken');
    if (localToken) {
        console.log('✅ localStorage(accessToken)에서 인증 토큰을 찾았습니다.');
        return localToken;
    }
    
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        console.log('✅ localStorage(auth_token)에서 인증 토큰을 찾았습니다.');
        return authToken;
    }
    
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
        console.log('✅ sessionStorage(auth_token)에서 인증 토큰을 찾았습니다.');
        return sessionToken;
    }
    
    console.log('❌ 인증 토큰을 찾을 수 없습니다.');
    return '';
}

// 토큰 갱신 리스너 설정
function setupTokenRefreshListener() {
    firebase.messaging().onTokenRefresh(function() {
        firebase.messaging().getToken({
            vapidKey: window.vapidKey
        })
        .then(function(refreshedToken) {
            console.log('토큰이 갱신되었습니다:', refreshedToken);
            return registerTokenToServer(refreshedToken);
        })
        .catch(function(error) {
            console.error('토큰 갱신 중 오류 발생:', error);
        });
    });
}

// 메시지 수신 리스너 설정
function setupMessageListener() {
    firebase.messaging().onMessage(function(payload) {
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
function initFCMAfterLogin() {
    return initFCM()
        .then(function(token) {
            return token !== null;
        })
        .catch(function(error) {
            console.error('로그인 후 FCM 초기화 실패:', error);
            return false;
        });
}

// 초기화 시도 함수
function tryInitFCM() {
    // 사용자가 로그인 상태인지 확인
    if (getAuthToken()) {
        console.log('🔍 로그인 상태 확인됨, FCM 초기화 시도');
        initFCM()
            .then(function(token) {
                console.log('✅ FCM 초기화 성공, 토큰:', token ? '획득됨' : '없음');
                if (window.fcmDebug) {
                    window.fcmDebug.initialized = true;
                }
            })
            .catch(function(error) {
                console.error('❌ FCM 초기화 오류:', error);
                if (window.fcmDebug) {
                    window.fcmDebug.errors.push('FCM 초기화 실패: ' + error.message);
                }
            });
    } else {
        console.log('⚠️ 로그인 상태가 아닙니다. FCM 초기화를 건너뜁니다.');
    }
}

// 이벤트 리스너 설정
document.addEventListener('authStateChanged', function(event) {
    console.log('🔍 인증 상태 변경 감지:', event.detail);
    if (event.detail.isLoggedIn) {
        console.log('🔍 로그인 감지됨, FCM 초기화 시도');
        tryInitFCM();
    }
});

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM 로드 완료, FCM 초기화 준비');
    
    // 약간의 지연 후 초기화 시도 (다른 스크립트가 모두 로드될 시간을 확보)
    setTimeout(tryInitFCM, 1000);
}); 