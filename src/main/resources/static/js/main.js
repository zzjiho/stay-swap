document.addEventListener('DOMContentLoaded', function() {
    // auth 객체가 없으면 생성
    if (!window.auth) {
        window.auth = {
            accessToken: null,
            tokenExpireTime: null,
            isInitialized: false
        };
    }
    
    // isLoggedIn 함수가 없으면 생성
    if (typeof window.isLoggedIn !== 'function') {
        window.isLoggedIn = function() {
            return !!window.auth.accessToken && !isTokenExpired();
        };
        
        // isTokenExpired 함수가 없으면 생성
        if (typeof window.isTokenExpired !== 'function') {
            window.isTokenExpired = function() {
                return !window.auth.tokenExpireTime || new Date().getTime() > window.auth.tokenExpireTime;
            };
        }
    }

    // 현재 페이지 활성화
    highlightCurrentPage();
    
    // 프로필 드롭다운 토글 기능
    const profileToggle = document.getElementById('profile-dropdown-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.toggle('active');
        });
        
        // 드롭다운 외부 클릭 시 닫기
        document.addEventListener('click', (e) => {
            if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    // 로그아웃 버튼 이벤트
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('로그아웃 버튼 클릭됨');
            
            // window에 있는 로그아웃 함수를 찾아서 호출
            if (typeof window.authLogout === 'function') {
                console.log('auth.js의 logout 함수 호출');
                window.authLogout();
            } else if (typeof window.logout === 'function') {
                console.log('auth-common.js의 logout 함수 호출');
                window.logout();
            } else if (typeof logout === 'function') {
                console.log('전역 logout 함수 호출');
                logout();
            } else {
                console.log('로그아웃 함수를 찾을 수 없습니다. 직접 로그아웃 처리합니다.');
                // 로그아웃 함수가 없는 경우 직접 처리
                auth.accessToken = null;
                auth.tokenExpireTime = null;
                
                // 두 가지 로그아웃 API 모두 호출
                Promise.all([
                    fetch('/api/user/logout', {
                        method: 'POST',
                        credentials: 'include'
                    }).catch(e => console.error('사용자 로그아웃 API 오류:', e)),
                    
                    fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                    }).catch(e => console.error('쿠키 로그아웃 API 오류:', e))
                ]).finally(() => {
                    // 로그인 페이지로 리디렉션
                    window.location.href = '/page/auth';
                });
            }
        });
    }

    // 수동으로 refreshToken 확인 및 인증 초기화
    manualInitAuth();
    
    // 로그인 상태에 따라 UI 업데이트
    updateUIBasedOnAuthState();
});

// 수동으로 인증 초기화
async function manualInitAuth() {
    // 리프레시 토큰이 있는지 확인
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // 토큰 갱신 시도
    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 모든 쿠키 포함
        });
        
        if (response.ok) {
            const data = await response.json();
            
            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
            window.auth.isInitialized = true;
            
            // UI 업데이트
            updateUIBasedOnAuthState();
            
            // 이벤트 발생
            if (typeof dispatchLoginEvent === 'function') {
                dispatchLoginEvent(true);
            } else {
                document.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { isLoggedIn: true }
                }));
            }
            
            return true;
        }
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
    }
    
    return false;
}

// 현재 페이지 활성화
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        if (currentPath.endsWith(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// 로그인 상태에 따라 UI 업데이트
function updateUIBasedOnAuthState() {
    const isUserLoggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : !!window.auth?.accessToken;
    
    const userProfile = document.getElementById('user-profile');
    const authButtons = document.getElementById('auth-buttons');
    
    if (isUserLoggedIn) {
        // 로그인된 상태
        if (userProfile) userProfile.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        // 로그아웃된 상태
        if (userProfile) userProfile.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

// 인증 상태 변경 이벤트 리스너
document.addEventListener('authStateChanged', function(event) {
    updateUIBasedOnAuthState();
    // 로그인 상태일 때만 사용자 정보 가져오기
    if (event.detail.isLoggedIn && typeof fetchUserInfo === 'function') {
        fetchUserInfo();
    }
});

// 1초 후 인증 상태 확인
setTimeout(function() {
    if (!window.auth?.accessToken) {
        manualInitAuth().then(success => {
            updateUIBasedOnAuthState();
        });
    } else {
        updateUIBasedOnAuthState();
    }
}, 1000);

// 5초마다 인증 상태를 확인하고 UI 업데이트
setInterval(function() {
    fetch('/api/token/refresh', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include',
        cache: 'no-store'
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error('토큰 갱신 실패');
    })
    .then(data => {
        // 이미 로그인 상태라면 UI 변경 안함
        if (window.auth?.accessToken) return;
        
        // 액세스 토큰 설정
        window.auth.accessToken = data.accessToken;
        window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        window.auth.isInitialized = true;
        
        // UI 업데이트
        const userProfile = document.getElementById('user-profile');
        const authButtons = document.getElementById('auth-buttons');
        
        if (userProfile) userProfile.style.display = 'block';
        if (authButtons) authButtons.style.display = 'none';
    })
    .catch(err => {
        // 오류 발생 시 로그아웃 상태로 간주하고 UI 업데이트
        if (window.auth?.accessToken) {
            window.auth.accessToken = null;
            window.auth.tokenExpireTime = null;
            
            const userProfile = document.getElementById('user-profile');
            const authButtons = document.getElementById('auth-buttons');
            
            if (userProfile) userProfile.style.display = 'none';
            if (authButtons) authButtons.style.display = 'flex';
        }
    });
}, 5000);