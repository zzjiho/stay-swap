// 디버깅 도구 - 스크립트 로드 확인용
console.log('🔍 debug.js 로드됨');

// 전역 디버깅 객체
window.debugTools = {
    // 스크립트 로드 상태 확인
    checkScripts: function() {
        console.log('=== 스크립트 로드 상태 ===');
        console.log('jQuery 로드 여부:', typeof jQuery !== 'undefined' ? '✅ 로드됨' : '❌ 로드되지 않음');
        console.log('Firebase 로드 여부:', typeof firebase !== 'undefined' ? '✅ 로드됨' : '❌ 로드되지 않음');
        console.log('FCM 함수 존재 여부:', typeof initFCM === 'function' ? '✅ 존재함' : '❌ 존재하지 않음');
        
        // 스크립트 태그 확인
        const scripts = document.getElementsByTagName('script');
        console.log('문서 내 스크립트 태그 수:', scripts.length);
        
        for (let i = 0; i < scripts.length; i++) {
            console.log(`스크립트 ${i+1}: ${scripts[i].src || '인라인 스크립트'}`);
        }
        
        return {
            jquery: typeof jQuery !== 'undefined',
            firebase: typeof firebase !== 'undefined',
            fcm: typeof initFCM === 'function'
        };
    },
    
    // 인증 토큰 확인
    checkAuth: function() {
        console.log('=== 인증 토큰 상태 ===');
        console.log('accessToken:', localStorage.getItem('accessToken') ? '✅ 존재함' : '❌ 없음');
        console.log('auth_token:', localStorage.getItem('auth_token') ? '✅ 존재함' : '❌ 없음');
        console.log('refreshToken:', localStorage.getItem('refreshToken') ? '✅ 존재함' : '❌ 없음');
        console.log('fcmTokenRegistered:', localStorage.getItem('fcmTokenRegistered') ? '✅ 존재함' : '❌ 없음');
        
        return {
            accessToken: localStorage.getItem('accessToken'),
            auth_token: localStorage.getItem('auth_token'),
            refreshToken: localStorage.getItem('refreshToken'),
            fcmTokenRegistered: localStorage.getItem('fcmTokenRegistered')
        };
    },
    
    // 수동으로 Firebase 설정 로드
    loadFirebaseConfig: function() {
        console.log('🔍 Firebase 설정 수동 로드 시도...');
        
        return fetch('/api/config/firebase')
            .then(response => {
                if (!response.ok) {
                    throw new Error('API 호출 실패: ' + response.status);
                }
                return response.json();
            })
            .then(config => {
                console.log('✅ Firebase 설정 로드 성공:', config);
                
                // 전역 설정 저장
                window.firebaseConfig = config;
                window.vapidKey = config.vapidKey;
                
                return config;
            })
            .catch(error => {
                console.error('❌ Firebase 설정 로드 실패:', error);
                return null;
            });
    },
    
    // 수동으로 Firebase 초기화
    initFirebase: function() {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK가 로드되지 않았습니다.');
            return Promise.reject(new Error('Firebase SDK가 로드되지 않았습니다.'));
        }
        
        if (!window.firebaseConfig) {
            return this.loadFirebaseConfig().then(config => {
                if (!config) {
                    return Promise.reject(new Error('Firebase 설정을 로드할 수 없습니다.'));
                }
                
                try {
                    firebase.initializeApp({
                        apiKey: config.apiKey,
                        authDomain: config.authDomain,
                        projectId: config.projectId,
                        storageBucket: config.storageBucket,
                        messagingSenderId: config.messagingSenderId,
                        appId: config.appId,
                        measurementId: config.measurementId
                    });
                    
                    console.log('✅ Firebase 수동 초기화 성공');
                    return firebase;
                } catch (error) {
                    console.error('❌ Firebase 초기화 오류:', error);
                    return Promise.reject(error);
                }
            });
        } else {
            try {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase 수동 초기화 성공 (캐시된 설정 사용)');
                return Promise.resolve(firebase);
            } catch (error) {
                console.error('❌ Firebase 초기화 오류:', error);
                return Promise.reject(error);
            }
        }
    },
    
    // 알림 권한 확인
    checkNotificationPermission: function() {
        if (!('Notification' in window)) {
            console.error('❌ 이 브라우저는 알림을 지원하지 않습니다.');
            return Promise.resolve('not-supported');
        }
        
        console.log('🔍 현재 알림 권한 상태:', Notification.permission);
        
        if (Notification.permission === 'default') {
            return Notification.requestPermission().then(permission => {
                console.log('✅ 알림 권한 요청 결과:', permission);
                return permission;
            });
        }
        
        return Promise.resolve(Notification.permission);
    },
    
    // FCM 토큰 수동 등록
    registerFCMToken: function() {
        if (typeof firebase === 'undefined' || typeof firebase.messaging !== 'function') {
            console.error('❌ Firebase Messaging SDK가 로드되지 않았습니다.');
            return Promise.reject(new Error('Firebase Messaging SDK가 로드되지 않았습니다.'));
        }
        
        return this.checkNotificationPermission()
            .then(permission => {
                if (permission !== 'granted') {
                    return Promise.reject(new Error('알림 권한이 거부되었습니다.'));
                }
                
                const messaging = firebase.messaging();
                return messaging.getToken({ vapidKey: window.vapidKey });
            })
            .then(token => {
                console.log('✅ FCM 토큰 획득 성공:', token);
                
                // 서버에 토큰 등록
                return this.sendTokenToServer(token);
            });
    },
    
    // 서버에 토큰 등록
    sendTokenToServer: function(token) {
        const authToken = localStorage.getItem('accessToken') || localStorage.getItem('auth_token');
        
        if (!authToken) {
            console.error('❌ 인증 토큰이 없습니다.');
            return Promise.reject(new Error('인증 토큰이 없습니다.'));
        }
        
        const deviceInfo = {
            deviceId: 'web_' + Math.random().toString(36).substring(2, 15),
            deviceType: 'WEB',
            fcmToken: token,
            deviceName: navigator.userAgent
        };
        
        console.log('🔍 서버에 등록할 기기 정보:', deviceInfo);
        
        return fetch('/api/users/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(deviceInfo)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error('FCM 토큰 서버 등록 실패: ' + text);
                });
            }
            
            console.log('✅ FCM 토큰이 서버에 성공적으로 등록되었습니다.');
            localStorage.setItem('fcmTokenRegistered', 'true');
            return true;
        })
        .catch(error => {
            console.error('❌ FCM 토큰 서버 등록 중 오류:', error);
            return Promise.reject(error);
        });
    }
};

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 디버깅 도구가 준비되었습니다. 개발자 도구에서 window.debugTools 객체를 사용하여 디버깅 할 수 있습니다.');
}); 