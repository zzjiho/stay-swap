window.debugTools = {

    // 수동으로 Firebase 설정 로드
    loadFirebaseConfig: function() {

        return fetch('/api/config/firebase')
            .then(response => {
                if (!response.ok) {
                    throw new Error('API 호출 실패: ' + response.status);
                }
                return response.json();
            })
            .then(config => {
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

    // 알림 권한 확인
    checkNotificationPermission: function() {
        if (!('Notification' in window)) {
            console.error('❌ 이 브라우저는 알림을 지원하지 않습니다.');
            return Promise.resolve('not-supported');
        }

        if (Notification.permission === 'default') {
            return Notification.requestPermission().then(permission => {
                return permission;
            });
        }
        
        return Promise.resolve(Notification.permission);
    },
    

    // 서버에 토큰 등록
    sendTokenToServer: function(token) {
        if (!window.isLoggedIn()) {
            console.error('❌ 인증 토큰이 없습니다. 로그인 상태가 아닙니다.');
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceInfo),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error('FCM 토큰 서버 등록 실패: ' + text);
                });
            }
            
            console.log('✅ FCM 토큰이 서버에 성공적으로 등록되었습니다.');
            // HttpOnly 쿠키를 사용하므로 localStorage 업데이트는 필요 없음
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