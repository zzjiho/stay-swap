// Firebase Cloud Messaging Service Worker
// 백그라운드에서 푸시 알림을 처리하기 위한 서비스 워커입니다.

// Firebase 라이브러리 로드
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// API에서 Firebase 설정 가져오기
self.addEventListener('install', async (event) => {
  try {
    const response = await fetch('/api/config/firebase');
    if (!response.ok) {
      throw new Error('Firebase 설정을 가져오는데 실패했습니다.');
    }
    
    const firebaseConfig = await response.json();
    
    // Firebase 초기화
    firebase.initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
      measurementId: firebaseConfig.measurementId
    });
    
    // Firebase Messaging 인스턴스 가져오기
    const messaging = firebase.messaging();
    
    // 백그라운드 메시지 처리
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);
      
      // 알림 데이터 추출
      const notificationTitle = payload.notification.title || '새로운 알림';
      const notificationOptions = {
        body: payload.notification.body || '',
        icon: '/images/logo.png',
        badge: '/images/badge.png',
        data: payload.data
      };
    
      // 알림 표시
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
  } catch (error) {
    console.error('Service Worker 초기화 중 오류 발생:', error);
    
    // 오류 발생 시 메시지 표시
    self.registration.showNotification('알림 서비스 오류', {
      body: 'FCM 서비스를 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.',
      icon: '/images/logo.png'
    });
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);

  // 알림 닫기
  event.notification.close();

  // 클릭 시 이동할 URL (데이터에서 URL을 가져오거나 기본값 사용)
  const urlToOpen = event.notification.data?.url || '/notifications';

  // 동일한 URL의 창이 이미 열려있는지 확인
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // 이미 열려있는 창이 있는지 확인
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}); 