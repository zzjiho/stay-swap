/**
 * StaySwap 인증 공통 JavaScript
 * 모든 페이지에서 인증 상태를 관리합니다.
 */

// window.auth 전역 객체가 없으면 생성
window.auth = window.auth || {};

// 전역 상태를 이 객체에만 저장
auth.accessToken = null;
auth.tokenExpireTime = null;
auth.isInitialized = false;

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
document.addEventListener('DOMContentLoaded', () => {
    // 먼저 임시 토큰 쿠키 확인
    if (handleTempAccessToken()) {
        return; // 임시 토큰이 있으면 나머지 초기화 과정 스킵
    }
    
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

/* ───────── 카카오 로그인 콜백 ───────── */
async function handleKakaoCallback(code) {
    try {
        const r = await fetch('/api/oauth/login', {
            method:'POST',
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${code}`},
            body:JSON.stringify({userType:'KAKAO'}),
            credentials:'include'
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        auth.accessToken     = d.accessToken;
        auth.tokenExpireTime = new Date(d.accessTokenExpireTime).getTime();
        auth.isInitialized   = true;
        setupTokenRenewal();
        dispatchLoginEvent(true);

        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({},document.title,url);

        const redirect = url.searchParams.get('redirect');
        if (redirect) window.location.replace(redirect);
    } catch {
        window.location.href = '/page/auth';
    }
}

/* ───────── 초기화 & 토큰 교환 ───────── */
async function initializeAuth() {
    if (auth.isInitialized && auth.accessToken && !isTokenExpired()) return true;
    try {
        const r = await fetch('/api/token/refresh',{credentials:'include'});
        if (!r.ok) { auth.isInitialized=true; dispatchLoginEvent(false); return false; }
        const d = await r.json();
        auth.accessToken     = d.accessToken;
        auth.tokenExpireTime = new Date(d.accessTokenExpireTime).getTime();
        auth.isInitialized   = true;
        setupTokenRenewal();
        dispatchLoginEvent(true);
        if (typeof fetchUserInfo==='function') fetchUserInfo();
        return true;
    } catch {
        auth.isInitialized = true; dispatchLoginEvent(false); return false;
    }
}

/* ───────── 유틸 ───────── */
function dispatchLoginEvent(isLoggedIn){
    document.dispatchEvent(new CustomEvent('authStateChanged',{detail:{isLoggedIn}}));
}
function setupTokenRenewal(){
    if(!auth.tokenExpireTime) return;
    const delay=Math.max(0, auth.tokenExpireTime-Date.now()-5*60*1000);
    setTimeout(refreshAccessToken, delay);
}
function getAuthHeader(){ return auth.accessToken?{Authorization:`Bearer ${auth.accessToken}`} : {}; }
function isTokenExpired(){ return !auth.tokenExpireTime || Date.now()>auth.tokenExpireTime; }
function isLoggedIn(){ return !!auth.accessToken && !isTokenExpired(); }

/* ───────── 토큰 갱신 ───────── */
async function refreshAccessToken(){
    try{
        const r=await fetch('/api/token/refresh',{credentials:'include'});
        if(!r.ok) throw new Error();
        const d=await r.json();
        auth.accessToken=d.accessToken;
        auth.tokenExpireTime=new Date(d.accessTokenExpireTime).getTime();
        setupTokenRenewal();
        dispatchLoginEvent(true);
        return true;
    }catch{ logout(); return false; }
}

/* ───────── 로그아웃 ───────── */
async function logout(){
    auth.accessToken=null; auth.tokenExpireTime=null;
    try{ await fetch('/api/logout',{method:'POST',credentials:'include'}); }
    finally{ dispatchLoginEvent(false); window.location.href='/page/auth'; }
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
