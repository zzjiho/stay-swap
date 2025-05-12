/**
 * StaySwap 인증 공통 JavaScript
 * 모든 페이지에서 인증 상태를 관리합니다.
 */

// 전역 변수 (메모리에만 저장)
let accessToken = null;
let tokenExpireTime = null;
let isAuthInitialized = false;

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    // URL에 code 파라미터가 있는지 확인 (카카오 로그인 콜백)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (code) {
        // 카카오 로그인 콜백 처리
        handleKakaoCallback(code);
    } else {
        // 일반적인 인증 초기화
        initializeAuth();
    }
});

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
        isAuthInitialized = true;
        
        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();
        
        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(true);
        
        // URL에서 code 파라미터 제거하고 페이지 리로드
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url);
        
        // 리디렉션 URL이 있으면 해당 URL로 이동
        const redirectUrl = url.searchParams.get("redirect");
        if (redirectUrl) {
            window.location.replace(redirectUrl);
        }
    } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        alert('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        window.location.href = "/page/auth";
    }
}

/**
 * 인증 초기화 함수
 * 페이지 로드 시 자동으로 실행되어 토큰 상태를 확인하고 갱신합니다.
 */
async function initializeAuth() {
    // 이미 초기화되었거나 토큰이 유효하면 스킵
    if (isAuthInitialized && accessToken && !isTokenExpired()) {
        return true;
    }
    
    try {
        // 서버에 토큰 갱신 요청
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함
        });
        
        if (!response.ok) {
            // 로그인 상태가 아님
            isAuthInitialized = true;
            return false;
        }
        
        const data = await response.json();
        
        // 메모리에 accessToken 저장
        accessToken = data.accessToken;
        tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        isAuthInitialized = true;
        
        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();
        
        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(true);
        
        return true;
    } catch (error) {
        console.error('인증 초기화 중 오류:', error);
        isAuthInitialized = true;
        
        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(false);
        
        return false;
    }
}

/**
 * 로그인 상태 변경 이벤트 발생
 */
function dispatchLoginEvent(isLoggedIn) {
    const event = new CustomEvent('authStateChanged', {
        detail: { isLoggedIn }
    });
    document.dispatchEvent(event);
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
 * 현재 로그인 상태 확인
 */
function isLoggedIn() {
    return accessToken !== null && !isTokenExpired();
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
        
        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(true);
        
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
    // 메모리의 토큰 삭제
    accessToken = null;
    tokenExpireTime = null;
    
    try {
        // 서버에 로그아웃 요청 (쿠키 삭제)
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(false);
    } catch (error) {
        console.error('로그아웃 중 오류:', error);
    }
}

/**
 * 인증이 필요한 API 요청 래퍼 함수
 */
async function fetchWithAuth(url, options = {}) {
    // 인증 초기화가 필요한 경우
    if (!isAuthInitialized || !accessToken || isTokenExpired()) {
        const initialized = await initializeAuth();
        if (!initialized || !accessToken) {
            // 로그인 페이지로 리다이렉트
            window.location.href = `/page/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
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
                // 로그인 페이지로 리다이렉트
                window.location.href = `/page/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
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