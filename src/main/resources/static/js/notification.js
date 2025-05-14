/**
 * Firebase Cloud Messaging 알림 처리 모듈
 * - jQuery 사용
 * - 푸시 알림 수신 및 표시 처리
 */

console.log('🔍 notification.js 로드됨');

// 페이지 로드 완료 시 실행
$(document).ready(function() {
    console.log('🔍 notification.js 초기화 시작');
    
    // 알림 컨테이너 준비
    if ($('#notification-container').length === 0) {
        $('body').append(
            '<div id="notification-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 350px;"></div>'
        );
    }
    
    // FCM 초기화 확인
    if (typeof firebase !== 'undefined' && typeof firebase.messaging === 'function') {
        try {
            const messaging = firebase.messaging();
            
            // 포그라운드 메시지 수신 리스너 설정
            messaging.onMessage(function(payload) {
                console.log('📩 포그라운드 메시지 수신:', payload);
                
                // 브라우저 알림 표시
                if (Notification.permission === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        const title = payload.notification?.title || '새로운 알림';
                        const options = {
                            body: payload.notification?.body || '',
                            icon: '/images/logo.png',
                            badge: '/images/badge.png',
                            data: payload.data || {}
                        };
                        
                        registration.showNotification(title, options);
                    });
                }
                
                // 토스트 알림 표시
                showToastNotification(payload);
            });
            
            console.log('✅ FCM 알림 리스너 등록 완료');
        } catch (error) {
            console.error('❌ FCM 알림 리스너 등록 실패:', error);
        }
    } else {
        console.error('❌ Firebase Messaging이 초기화되지 않았습니다.');
    }
    
    // 테스트 버튼 이벤트 리스너
    $('#test-notification-btn').on('click', function() {
        console.log('🔍 테스트 알림 요청 시작');
        $.ajax({
            url: '/api/notifications/test',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                title: '테스트 알림입니다',
                content: '이것은 테스트 알림 내용입니다. 알림이 잘 수신되었습니다!'
            }),
            success: function(response) {
                console.log('✅ 테스트 알림 요청 성공:', response);
            },
            error: function(xhr, status, error) {
                console.error('❌ 테스트 알림 요청 실패:', error);
                alert('테스트 알림 전송에 실패했습니다: ' + (xhr.responseJSON?.message || error));
            }
        });
    });
});

// 토스트 알림 표시 (인앱 알림)
function showToastNotification(payload) {
    // 알림 종류에 따른 아이콘 및 스타일 설정
    let icon = 'fas fa-bell';
    let bgClass = 'bg-primary';
    
    switch (payload.data?.type) {
        case 'BOOKING_REQUEST':
            icon = 'fas fa-home';
            bgClass = 'bg-info';
            break;
        case 'SWAP_REQUEST':
            icon = 'fas fa-exchange-alt';
            bgClass = 'bg-success';
            break;
        case 'TEST_NOTIFICATION':
            icon = 'fas fa-flask';
            bgClass = 'bg-warning';
            break;
    }
    
    // 토스트 요소 생성
    const toastId = 'toast-' + Date.now();
    const $toast = $(
        `<div id="${toastId}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <i class="${icon} me-2"></i>
                <strong class="me-auto">${payload.notification?.title || '새로운 알림'}</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${payload.notification?.body || ''}
            </div>
        </div>`
    );
    
    // 알림 클릭 이벤트 설정
    $toast.on('click', function(e) {
        if (!$(e.target).hasClass('btn-close')) {
            const url = payload.data?.url || '/notifications';
            window.location.href = url;
        }
    });
    
    // 닫기 버튼 이벤트 설정
    $toast.find('.btn-close').on('click', function(e) {
        e.stopPropagation();
        $toast.removeClass('show');
        setTimeout(function() { $toast.remove(); }, 500);
    });
    
    // 토스트 표시
    $('#notification-container').append($toast);
    
    // 5초 후 자동으로 사라지게 설정
    setTimeout(function() {
        $toast.removeClass('show');
        setTimeout(function() { $toast.remove(); }, 500);
    }, 5000);
} 