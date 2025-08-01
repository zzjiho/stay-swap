/**
 * 소셜 로그인 버튼 처리만 담당 (auth-common.js에 의존)
 */

// 중복 초기화 방지 플래그
let authPageInitialized = false;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    // 중복 초기화 방지
    if (authPageInitialized) return;
    authPageInitialized = true;
    
    // URL 파라미터 처리
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    
    // 다른 소셜 로그인 버튼에 리디렉션 URL 추가
    if (redirectUrl) {
        const otherSocialButtons = document.querySelectorAll(".social-button:not(.kakao-login)");
        otherSocialButtons.forEach((button) => {
            const currentHref = button.getAttribute("href");
            button.setAttribute("href", `${currentHref}?redirect_uri=${encodeURIComponent(redirectUrl)}`);
        });
    }
});


// 토큰 관련 함수들은 auth-common.js에서 담당