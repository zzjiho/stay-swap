/**
 * StaySwap 인증 관련 JavaScript
 * accessToken은 메모리에 저장하고, refreshToken은 HttpOnly 쿠키로 관리합니다.
 */

// 전역 변수 (메모리에만 저장)
let accessToken = null;
let tokenExpireTime = null;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    // 현재 페이지 URL 확인
    const currentPath = window.location.pathname;
    
    // URL 파라미터 처리
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get("redirect");
    const code = urlParams.get("code");
    
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

    // URL에 code 파라미터가 있으면 카카오 콜백 처리
    if (code) {
        handleKakaoCallback(code);
    } else {
        // 이미 로그인 상태인지 확인 (페이지 새로고침 시)
        checkLoginStatus();
    }
});

/**
 * 로그인 상태 확인 및 토큰 갱신
 */
async function checkLoginStatus() {
    try {
        // 서버에 토큰 갱신 요청 (refreshToken은 쿠키로 자동 전송됨)
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함
        });

        if (!response.ok) {
            // 로그인 상태가 아님
            return;
        }

        const data = await response.json();
        
        // 메모리에 accessToken 저장
        accessToken = data.accessToken;
        tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        
        // 로그인 성공 후 처리 (예: 리디렉션)
        const redirectUrl = new URLSearchParams(window.location.search).get("redirect");
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else if (window.location.pathname === '/page/auth') {
            // 로그인 페이지에 있으면 홈으로 리다이렉트
            window.location.href = '/';
        }
        
        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();
    } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
    }
}

/**
 * 카카오 로그인 처리 함수
 */
function handleKakaoLogin() {
    // 백엔드에서 제공하는 /kakao 엔드포인트 호출
    window.location.href = "/kakao";
}

/**
 * 카카오 로그인 콜백 처리 함수
 */
async function handleKakaoCallback(code) {
    try {
        // 백엔드에서 카카오 토큰을 받은 후, 우리 서비스의 JWT 토큰으로 교환
        const response = await fetch('/api/oauth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${code}` // 인가 코드를 Authorization 헤더에 전달
            },
            body: JSON.stringify({
                userType: 'KAKAO'
            }),
            credentials: 'include' // 쿠키를 받기 위해 필요
        });

        if (!response.ok) {
            throw new Error('로그인 처리 중 오류가 발생했습니다.');
        }

        const data = await response.json();
        
        // accessToken만 메모리에 저장 (refreshToken은 쿠키로 관리)
        accessToken = data.accessToken;
        tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        
        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();
        
        // 리디렉션 URL이 있으면 해당 URL로, 없으면 홈으로 리다이렉트
        const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "/";
        
        window.location.replace(redirectUrl);
    } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        alert('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        window.location.href = "/page/auth";
    }
}

/**
 * 토큰 만료 전에 자동 갱신 설정
 */
function setupTokenRenewal() {
    if (!tokenExpireTime) return;
    
    // 토큰 만료 5분 전에 갱신
    const timeUntilExpiry = tokenExpireTime - Date.now();
    const renewalTime = Math.max(0, timeUntilExpiry - (5 * 60 * 1000));
    
    setTimeout(async () => {
        await refreshAccessToken();
    }, renewalTime);
}

/**
 * API 요청 시 사용할 인증 헤더 생성 함수
 */
function getAuthHeader() {
    return accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};
}

/**
 * 토큰 만료 확인 함수
 */
function isTokenExpired() {
    if (!tokenExpireTime) return true;
    return Date.now() > tokenExpireTime;
}

/**
 * 액세스 토큰 갱신 함수
 */
async function refreshAccessToken() {
    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함
        });
        
        if (!response.ok) {
            throw new Error('토큰 갱신 실패');
        }
        
        const data = await response.json();
        accessToken = data.accessToken;
        tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        
        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();
        
        return true;
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
        logout();
        return false;
    }
}

/**
 * 로그아웃 함수
 */
async function logout() {
    console.log('여기타냐');
    // 메모리의 토큰 삭제
    accessToken = null;
    tokenExpireTime = null;
    
    try {
        // 서버에 로그아웃 요청 (쿠키 삭제)
        await fetch('/api/user/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // 쿠키 기반 로그아웃 API도 호출
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('로그아웃 중 오류:', error);
    } finally {
        window.location.href = '/page/auth';
    }
}

// 전역에서 접근할 수 있도록 window 객체에 등록
window.authLogout = logout;

/**
 * 인증이 필요한 API 요청 래퍼 함수
 */
async function fetchWithAuth(url, options = {}) {
    // 토큰이 만료되었으면 갱신 시도
    if (isTokenExpired()) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
            return null;
        }
    }
    
    // 인증 헤더 추가
    const headers = {
        ...options.headers,
        ...getAuthHeader()
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include' // 쿠키 포함
        });
        
        // 401 응답이면 토큰 갱신 후 재시도
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                return null;
            }
            
            // 토큰 갱신 후 재시도
            return fetchWithAuth(url, options);
        }
        
        return response;
    } catch (error) {
        console.error('API 요청 중 오류:', error);
        return null;
    }
}
