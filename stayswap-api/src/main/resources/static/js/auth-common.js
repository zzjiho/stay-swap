/**
 * StaySwap 인증 공통 JavaScript
 * 모든 페이지에서 인증 상태를 관리합니다.
 */

console.log('🔍 AUTH-COMMON.JS 파일 로드 시작');

// window.auth 전역 객체가 없으면 생성
window.auth = window.auth || {};

// 전역 상태를 이 객체에만 저장
auth.accessToken = null;
auth.tokenExpireTime = null;
auth.isInitialized = false;

console.log('🔍 AUTH-COMMON.JS auth 객체 초기화 완료:', window.auth);

// API 호출 중복 방지 플래그 (main.js와 공유)
window.apiFlags = window.apiFlags || {
    checkingNotifications: false,
    refreshingToken: false,
    initializingDropdowns: false
};

console.log('🔍 AUTH-COMMON.JS apiFlags 초기화 완료:', window.apiFlags);

// 쿠키에서 값을 가져오는 함수
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// 쿠키 삭제 함수
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// 임시 액세스 토큰 쿠키 처리
function handleTempAccessToken() {
    const tempToken = getCookie('temp_access_token');

    if (tempToken) {
        // 메모리에 저장
        auth.accessToken = tempToken;
        auth.tokenExpireTime = new Date().getTime() + (18 * 60 * 1000); // 약 18분 설정 (토큰 만료 전)
        auth.isInitialized = true;

        // 토큰 만료 전에 자동 갱신 설정
        setupTokenRenewal();

        // 로그인 상태 이벤트 발생
        dispatchLoginEvent(true);

        // 임시 쿠키 즉시 삭제
        deleteCookie('temp_access_token');

        return true;
    }
    return false;
}

/* ───────── 페이지 로드 시점 ───────── */
// DOMContentLoaded 대신 더 빠른 초기화 시도
function initializeAuthImmediately() {
    console.log('🔍 Auth-common.js 즉시 초기화 시작');
    
    // 중복 초기화 방지
    if (window.authCommonInitialized) {
        console.log('🔍 Auth-common.js 이미 초기화됨');
        return;
    }
    window.authCommonInitialized = true;

    // 먼저 임시 토큰 쿠키 확인
    if (handleTempAccessToken()) {
        console.log('🔍 임시 토큰으로 로그인 처리됨');
        return; // 임시 토큰이 있으면 나머지 초기화 과정 스킵
    }

    // URL에 code 파라미터가 있는지 확인 (카카오 로그인 콜백)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
        console.log('🔍 카카오 로그인 콜백 처리');
        // 카카오 로그인 콜백 처리
        handleKakaoCallback(code);
    } else {
        console.log('🔍 일반 인증 초기화 시작');
        // 일반적인 인증 초기화
        setTimeout(() => {
            initializeAuth();
        }, 50); // 약간의 지연을 두어 다른 스크립트 로드 완료 대기
    }
}

// 즉시 실행과 DOMContentLoaded 둘 다 대응
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthImmediately);
} else {
    // DOM이 이미 로드된 경우 즉시 실행
    setTimeout(initializeAuthImmediately, 10);
}

/* ───────── 카카오 로그인 콜백 ───────── */
async function handleKakaoCallback(code) {
    try {
        console.log('🔍 카카오 로그인 API 호출 시작');
        const r = await fetch('/api/oauth/login', {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${code}`},
            body:JSON.stringify({userType:'KAKAO'}),
            credentials:'include'
        });
        if (!r.ok) {
            throw new Error('카카오 로그인 API 실패');
        }
        const d = await r.json();
        auth.accessToken     = d.accessToken;
        auth.tokenExpireTime = new Date(d.accessTokenExpireTime).getTime();
        auth.isInitialized   = true;

        console.log('🔍 카카오 로그인 성공, 이벤트 발생');
        setupTokenRenewal();
        dispatchLoginEvent(true);

        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({},document.title,url);

        const redirect = url.searchParams.get('redirect');
        if (redirect) window.location.replace(redirect);
    } catch (error) {
        console.error('🔍 카카오 로그인 실패:', error);
        window.location.href = '/page/auth';
    }
}

/* ───────── 초기화 & 토큰 교환 ───────── */
async function initializeAuth() {
    console.log('🔍 initializeAuth 시작');
    
    if (auth.isInitialized && auth.accessToken && !isTokenExpired()) {
        console.log('🔍 이미 유효한 토큰 존재');
        // 토큰이 이미 유효한 경우 이벤트 발행은 한 번만
        setTimeout(() => dispatchLoginEvent(true), 50);
        return true;
    }

    // 중복 호출 방지
    if (window.apiFlags.refreshingToken) {
        console.log('🔍 토큰 갱신 이미 진행 중');
        return false;
    }

    window.apiFlags.refreshingToken = true;

    try {
        console.log('🔍 토큰 갱신 API 호출');
        const r = await fetch('/api/token/refresh',{
            method: 'GET',
            credentials:'include'
        });

        if (!r.ok) {
            console.log('🔍 토큰 갱신 실패 - 로그아웃 상태');
            auth.isInitialized=true;
            dispatchLoginEvent(false);
            return false;
        }

        const d = await r.json();
        console.log('🔍 토큰 갱신 성공');

        auth.accessToken     = d.accessToken;
        auth.tokenExpireTime = new Date(d.accessTokenExpireTime).getTime();
        auth.isInitialized   = true;

        setupTokenRenewal();
        dispatchLoginEvent(true);

        return true;
    } catch (error) {
        console.error('🔍 토큰 갱신 오류:', error);
        auth.isInitialized = true;
        dispatchLoginEvent(false);
        return false;
    } finally {
        window.apiFlags.refreshingToken = false;
    }
}

// authStateChanged 이벤트 중복 방지를 위한 이전 상태 캐시 (전역 재선언 오류 방지)
window._prevLoginState = window._prevLoginState ?? null;

function dispatchLoginEvent(isLoggedIn){
    // 상태 변화가 없으면 이벤트 발행 생략 (더 엄격한 체크)
    if (window._prevLoginState === isLoggedIn) {
        console.log('🔍 authStateChanged 이벤트 발행 생략 (상태 변화 없음):', isLoggedIn);
        return;
    }
    
    // 이벤트 발행 쿨다운 적용 (100ms 내 중복 발행 방지)
    const now = Date.now();
    if (window._lastEventDispatchTime && (now - window._lastEventDispatchTime) < 100) {
        console.log('🔍 authStateChanged 이벤트 발행 생략 (쿨다운)');
        return;
    }
    
    // 로그인 상태를 로컬스토리지에 저장 (새로고침 시 참조용)
    localStorage.setItem('stayswap_last_login_state', isLoggedIn.toString());
    console.log('🔍 로그인 상태 로컬스토리지 저장:', isLoggedIn);
    
    window._prevLoginState = isLoggedIn;
    window._lastEventDispatchTime = now;

    console.log('🔍 authStateChanged 이벤트 발생:', isLoggedIn);
    document.dispatchEvent(new CustomEvent('authStateChanged',{detail:{isLoggedIn}}));
}

function setupTokenRenewal(){
    if(!auth.tokenExpireTime) return;
    const delay=Math.max(0, auth.tokenExpireTime-Date.now()-5*60*1000);
    setTimeout(refreshAccessToken, delay);
}

function getAuthHeader(){
    return auth.accessToken?{Authorization:`Bearer ${auth.accessToken}`} : {};
}

function isTokenExpired(){
    return !auth.tokenExpireTime || Date.now()>auth.tokenExpireTime;
}

function isLoggedIn(){
    return !!auth.accessToken && !isTokenExpired();
}

/* ───────── 토큰 갱신 ───────── */
async function refreshAccessToken(){
    // 중복 호출 방지
    if (window.apiFlags.refreshingToken) {
        return false;
    }

    window.apiFlags.refreshingToken = true;

    try{
        const r=await fetch('/api/token/refresh',{credentials:'include'});
        if(!r.ok) {
            throw new Error();
        }
        const d=await r.json();

        auth.accessToken=d.accessToken;
        auth.tokenExpireTime=new Date(d.accessTokenExpireTime).getTime();
        setupTokenRenewal();
        dispatchLoginEvent(true);
        return true;
    }catch(error){
        logout();
        return false;
    } finally {
        window.apiFlags.refreshingToken = false;
    }
}

/* ───────── 로그아웃 ───────── */
async function logout(){
    // 로컬 상태 초기화
    auth.accessToken = null;
    auth.tokenExpireTime = null;
    
    // 로컬스토리지 정리
    localStorage.removeItem('stayswap_last_login_state');
    localStorage.removeItem('fcmTokenRegistered');
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('fcmTokenExpiry');
    console.log('🔍 로그아웃 - 로컬스토리지 정리 완료');

    try {
        // 1. 사용자 로그아웃 API 호출 - 리프레시 토큰 만료 처리
        if (auth.isInitialized) {
            try {
                await fetch('/api/user/logout', {
                    method: 'POST',
                    headers: getAuthHeader(),
                    credentials: 'include'
                });
                console.log('사용자 로그아웃 API 호출 성공');
            } catch (err) {
                console.error('사용자 로그아웃 API 호출 실패:', err);
            }
        }

        // 2. 쿠키 기반 로그아웃 API 호출 - 쿠키 삭제
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        console.log('쿠키 로그아웃 API 호출 성공');
    } catch (err) {
        console.error('로그아웃 중 오류:', err);
    } finally {
        // 상태 업데이트 및 로그인 페이지로 리디렉션
        auth.isInitialized = true;
        dispatchLoginEvent(false);
        console.log('로그아웃 완료, 로그인 페이지로 이동');
        window.location.href = '/page/auth';
    }
}

/* ───────── 인증 요청 래퍼 ───────── */
async function fetchWithAuth(url,opt={}){
    if(!auth.isInitialized||!auth.accessToken||isTokenExpired()){
        const ok=await initializeAuth(); if(!ok) return null;
    }

    const res=await fetch(url,{...opt,headers:{...opt.headers,...getAuthHeader()},credentials:'include'});
    if(res.status===401){
        const ok=await refreshAccessToken(); if(!ok) return null;
        return fetchWithAuth(url,opt);
    }
    return res;
}

// window 객체에 등록 (main.js와의 호환성)
window.logout = logout;
window.refreshAccessToken = refreshAccessToken;
window.initializeAuth = initializeAuth;
window.setupTokenRenewal = setupTokenRenewal;
window.isLoggedIn = isLoggedIn;
window.isTokenExpired = isTokenExpired;
window.fetchWithAuth = fetchWithAuth;  // 추가: fetchWithAuth 전역 노출
