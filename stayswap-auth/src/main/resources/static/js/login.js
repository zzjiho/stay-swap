// 로그인 처리 함수
function handleLogin(event) {
  event.preventDefault();
  
  const email = $('#email').val();
  const password = $('#password').val();
  
  $.ajax({
    url: '/api/auth/login',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ email, password }),
    success: function(data) {
      // 토큰 정보 확인
      if (!data.accessToken) {
        console.error('❌ 응답에 액세스 토큰이 없습니다:', data);
      }
      
      // 로그인 성공 처리
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('auth_token', data.accessToken);  // fcm-token.js에서 사용하는 키
      
      // FCM 토큰 등록
      if (typeof initFCMAfterLogin === 'function') {
        // 페이지 이동 전에 FCM 토큰 등록이 완료될 수 있도록 약간의 지연 추가
        setTimeout(function() {
          initFCMAfterLogin()
            .then(function(success) {
              // 로그인 성공 후 메인 페이지로 이동
              window.location.href = '/main';
            })
            .catch(function(error) {
              console.error('❌ FCM 토큰 등록 중 오류 발생:', error);
              // 오류가 발생해도 메인 페이지로 이동 (FCM은 부가 기능)
              window.location.href = '/main';
            });
        }, 500); // 0.5초 지연
      } else {
        console.error('❌ FCM 초기화 함수를 찾을 수 없습니다.');
        // FCM 초기화 함수가 없어도 메인 페이지로 이동
        window.location.href = '/main';
      }
    },
    error: function(xhr, status, error) {
      console.error('❌ 로그인 오류:', error);
      console.error('응답 상태:', xhr.status);
      console.error('응답 내용:', xhr.responseText);
      
      let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      
      if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
      }
      
      alert(errorMessage);
    }
  });
}

// 페이지 로드 시 이벤트 리스너 등록
$(document).ready(function() {
  const loginForm = $('#loginForm');
  if (loginForm.length) {
    loginForm.on('submit', handleLogin);
  } else {
    console.error('❌ 로그인 폼을 찾을 수 없습니다.');
  }
  
  
}); 