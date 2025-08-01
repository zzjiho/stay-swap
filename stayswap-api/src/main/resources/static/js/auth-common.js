/**
 * StaySwap 인증 공통 JavaScript
 * 모든 페이지에서 인증 상태를 관리합니다.
 */

window.auth = window.auth || {};
window.auth.isInitialized = false; // 인증 초기화 여부

window.apiFlags = window.apiFlags || {
    checkingNotifications: false,
    refreshingToken: false,
    initializingDropdowns: false
};


/* ───────── 페이지 로드 시점 ───────── */
function initializeAuthImmediately() {

    // 중복 초기화 방지
    if (window.authCommonInitialized) {
        return;
    }
    window.authCommonInitialized = true;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
        window.auth.isInitialized = true;
        dispatchLoginEvent(true); // 로그인 상태 이벤트 발생

        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url);

        const redirect = url.searchParams.get('redirect');
        if (redirect) window.location.replace(redirect);
        else window.location.replace('/');
    } else {
        setTimeout(() => {
            initializeAuth();
        }, 50);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthImmediately);
} else {
    setTimeout(initializeAuthImmediately, 10);
}

/* ───────── 초기화 & 토큰 갱신 ───────── */
// 서버에 현재 로그인 상태를 확인하고, 필요시 토큰을 갱신하도록 요청
async function initializeAuth() {

    // 중복 호출 방지
    if (window.apiFlags.refreshingToken) {
        return false;
    }

    window.apiFlags.refreshingToken = true;

    try {
        // HttpOnly 쿠키를 사용하여 인증 상태를 확인
        const r = await fetch('http://localhost:8081/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
        });

        if (!r.ok) {
            window.auth.isInitialized = true;
            dispatchLoginEvent(false);
            return false;
        }

        window.auth.isInitialized = true;
        dispatchLoginEvent(true);
        return true;
    } catch (error) {
        window.auth.isInitialized = true;
        dispatchLoginEvent(false);
        return false;
    } finally {
        window.apiFlags.refreshingToken = false;
    }
}

window._prevLoginState = window._prevLoginState ?? null;

function dispatchLoginEvent(isLoggedIn) {
    if (window._prevLoginState === isLoggedIn) {
        return;
    }

    const now = Date.now();
    if (window._lastEventDispatchTime && (now - window._lastEventDispatchTime) < 100) {
        return;
    }

    // 로그인 상태를 로컬스토리지에 저장
    localStorage.setItem('stayswap_last_login_state', isLoggedIn.toString());

    window._prevLoginState = isLoggedIn;
    window._lastEventDispatchTime = now;

    // 인증 초기화 완료 플래그 설정
    window.authInitialized = true;

    document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: {
            isLoggedIn
        }
    }));
}

/* ───────── 로그아웃 ───────── */
async function logout() {
    // 로컬스토리지 정리
    localStorage.removeItem('stayswap_last_login_state');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expire_time');
    localStorage.removeItem('fcmTokenRegistered');
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('fcmTokenExpiry');

    try {
        // 서버에 로그아웃 요청
        await fetch('http://localhost:8081/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (err) {
        console.error('🔍 로그아웃 중 오류:', err);
    } finally {
        // 상태 업데이트 및 body 클래스 즉시 변경
        document.body.className = 'auth-logged-out';
        dispatchLoginEvent(false);
        window.location.href = '/page/auth';
    }
}

/* ───────── 인증 요청 래퍼 ───────── */
// API 요청 시 HttpOnly 쿠키를 자동으로 사용하고, 401 응답 시 토큰 갱신을 시도
async function fetchWithAuth(url, opt = {}) {
    // 토큰 갱신 중복 호출 방지
    if (window.apiFlags.refreshingToken) {
        // 토큰 갱신이 완료될 때까지 대기
        let attempts = 0;
        const maxAttempts = 50;
        while (window.apiFlags.refreshingToken && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        if (attempts >= maxAttempts) {
            throw new Error('토큰 갱신 대기 시간 초과');
        }
    }

    let res;
    try {
        res = await fetch(url, {
            ...opt,
            credentials: 'include'
        });
    } catch (error) {
        throw error;
    }

    if (res.status === 401) {
        const refreshed = await initializeAuth(); // initializeAuth가 토큰 갱신 및 상태 확인을 수행
        if (refreshed) {
            // 토큰 갱신 성공 시 원래 요청을 재시도
            return fetch(url, {
                ...opt,
                credentials: 'include'
            });
        } else {
            // 토큰 갱신 실패 시 로그아웃 처리
            await logout();
            return null; // 또는 에러 반환
        }
    }
    return res;
}

window.logout = logout;
window.initializeAuth = initializeAuth;
window.fetchWithAuth = fetchWithAuth;

window.isLoggedIn = function() {
    return window._prevLoginState === true;
};
