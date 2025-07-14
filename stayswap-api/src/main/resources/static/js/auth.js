/**
 * 소셜 로그인 버튼 처리만 담당 (auth-common.js에 의존)
 */

console.log('🔍 AUTH.JS 파일 로드 시작');

// 중복 초기화 방지 플래그
let authPageInitialized = false;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    console.log('🔍 Auth.js DOMContentLoaded 시작');
    
    // 중복 초기화 방지
    if (authPageInitialized) return;
    authPageInitialized = true;
    
    // URL 파라미터 처리
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    
    // 카카오 로그인 버튼 이벤트 핸들러 추가
    const kakaoLoginBtn = document.querySelector(".kakao-login");
    if (kakaoLoginBtn) {
        kakaoLoginBtn.addEventListener("click", function(e) {
            e.preventDefault();
            handleKakaoLogin();
        });
    }

    // 다른 소셜 로그인 버튼에 리디렉션 URL 추가
    if (redirectUrl) {
        const otherSocialButtons = document.querySelectorAll(".social-button:not(.kakao-login)");
        otherSocialButtons.forEach((button) => {
            const currentHref = button.getAttribute("href");
            button.setAttribute("href", `${currentHref}?redirect_uri=${encodeURIComponent(redirectUrl)}`);
        });
    }

    // auth-common.js의 인증 상태 변경 이벤트 구독
    document.addEventListener('authStateChanged', function(e) {
        console.log('🔍 Auth.js가 authStateChanged 이벤트 수신:', e.detail.isLoggedIn);
        
        if (e.detail.isLoggedIn) {
            // 로그인 성공 시 리디렉션 처리
            const redirectUrl = new URLSearchParams(window.location.search).get("redirect");
            if (redirectUrl) {
                console.log('🔍 리디렉션 URL로 이동:', redirectUrl);
                window.location.href = redirectUrl;
            } else if (window.location.pathname === '/page/auth') {
                // 로그인 페이지에 있으면 홈으로 리다이렉트
                console.log('🔍 홈으로 리디렉션');
                window.location.href = '/';
            }
        }
    });
    
    console.log('🔍 Auth.js 초기화 완료');
});

// 로그인 상태 확인은 auth-common.js에서 담당

/**
 * 카카오 로그인 처리 함수
 */
function handleKakaoLogin() {
    console.log('🔍 카카오 로그인 버튼 클릭');
    // 백엔드에서 제공하는 /kakao 엔드포인트 호출
    window.location.href = "/kakao";
}

// 카카오 로그인 콜백 처리는 auth-common.js에서 담당

// 토큰 관련 함수들은 auth-common.js에서 담당
// 필요한 함수들은 window 객체에서 가져와서 사용
