// Firebase Cloud Messaging Service Worker
// 백그라운드에서 푸시 알림을 처리하기 위한 서비스 워커입니다.

// Firebase 라이브러리 로드
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Firebase 초기화 - 설정은 서버에서 동적으로 가져오지 못하므로 일단 기본값 사용
// 실제 값은 런타임에 설정됩니다
firebase.initializeApp({
  apiKey: "AIzaSyD5HvXq5LensKV4jTMNnrXavRIw8whDvh4",
  projectId: "stay-swap",
  messagingSenderId: "448255567490",
  appId: "1:448255567490:web:5c517e8ec4590e3f8d369b"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

  // 알림 데이터 추출
  const notificationTitle = payload.notification?.title || '새로운 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/img/logo.png',
    badge: '/img/badge.png', // 모바일 기기 알림 뱃지 아이콘 (옵션)
    tag: 'notification-' + Date.now(), // 알림 그룹화를 위한 태그 (옵션)
    data: payload.data || {} // 커스텀 데이터 저장 (알림 클릭 시 활용 가능)
  };

  // 백그라운드에서 알림 표시
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭됨:', event);

  // 알림 닫기
  event.notification.close();

  // 클릭 시 열 URL 결정
  // 1. payload.data.url이 있으면 해당 URL 사용
  // 2. 없으면 기본 URL(홈페이지) 사용
  const urlToOpen = event.notification.data?.url ||
      (new URL('/', self.location.origin).href);

  // 클라이언트 창 처리
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  })
      .then((windowClients) => {
        // 이미 열린 탭이 있는지 확인
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      });

  event.waitUntil(promiseChain);
});

// 푸시 구독 변경 이벤트 핸들러 (선택 사항)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] 푸시 구독 변경됨:', event);

  // 구독 변경 시 서버에 알리는 로직을 추가할 수 있습니다
  // 예: 새 토큰을 서버에 등록하는 등의 작업
});