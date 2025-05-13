document.addEventListener('DOMContentLoaded', function() {
    // auth 객체가 없으면 생성
    if (!window.auth) {
        window.auth = {
            accessToken: null,
            tokenExpireTime: null,
            isInitialized: false,
            refreshInProgress: false
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
        
        // 토큰 만료 시간이 1분 이내인지 확인하는 함수
        if (typeof window.isTokenExpiringInOneMinute !== 'function') {
            window.isTokenExpiringInOneMinute = function() {
                if (!window.auth.tokenExpireTime) return false;
                const oneMinuteInMs = 60 * 1000;
                const timeLeft = window.auth.tokenExpireTime - new Date().getTime();
                return timeLeft > 0 && timeLeft < oneMinuteInMs;
            };
        }
    }
    
    // URL 파라미터에서 인증 토큰 확인
    checkAuthFromUrlParams();

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

    // URL 파라미터에서 토큰을 가져오지 않았다면 refreshToken을 확인
    if (!window.auth.accessToken) {
        // 수동으로 refreshToken 확인 및 인증 초기화
        manualInitAuth();
    }
    
    // 로그인 상태에 따라 UI 업데이트
    updateUIBasedOnAuthState();
    
    // 토큰 자동 갱신 타이머 설정
    setupTokenRefreshTimer();
});

// URL 파라미터에서 인증 정보 확인
function checkAuthFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // auth_success 파라미터가 있는지 확인
    if (urlParams.get('auth_success') === 'true') {
        const token = urlParams.get('token');
        const expireTime = urlParams.get('expire');
        
        if (token && expireTime) {
            // 메모리에 토큰 정보 저장
            window.auth.accessToken = token;
            window.auth.tokenExpireTime = parseInt(expireTime);
            window.auth.isInitialized = true;
            
            console.log('URL에서 인증 정보를 추출했습니다. 만료 시간:', new Date(window.auth.tokenExpireTime).toLocaleString());
            
            // 인증 이벤트 발생
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { isLoggedIn: true }
            }));
            
            // URL에서 인증 파라미터 제거 (히스토리 조작)
            const cleanUrl = window.location.protocol + '//' + 
                            window.location.host + 
                            window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
}

// 수동으로 인증 초기화
async function manualInitAuth() {
    // 이미 refreshToken을 확인 중이면 중복 실행 방지
    if (window.auth.refreshInProgress) {
        return false;
    }
    
    window.auth.refreshInProgress = true;
    
    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'include',
            cache: 'no-store'
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
            
            window.auth.refreshInProgress = false;
            return true;
        }
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
    }
    
    window.auth.refreshInProgress = false;
    return false;
}

// 토큰이 곧 만료되는지 확인하고 필요하면 갱신하는 타이머 설정
function setupTokenRefreshTimer() {
    // 10초마다 토큰 상태 확인
    const tokenCheckInterval = setInterval(async function() {
        // 로그인 상태가 아니면 처리할 필요 없음
        if (!window.auth?.accessToken) {
            return;
        }
        
        // 토큰이 만료 1분 전이면 갱신
        if (isTokenExpiringInOneMinute()) {
            await refreshAccessToken();
        } 
        // 토큰이 이미 만료되었다면 강제 갱신
        else if (isTokenExpired()) {
            const success = await refreshAccessToken();
            if (!success) {
                // 갱신 실패 시 로그인 페이지로 리디렉션 또는 적절한 처리
                console.log('토큰 갱신 실패, 로그인 상태 초기화');
                window.auth.accessToken = null;
                window.auth.tokenExpireTime = null;
                updateUIBasedOnAuthState();
            }
        }
    }, 10000); // 10초마다 체크

    // 페이지 언로드 시 타이머 정리
    window.addEventListener('beforeunload', function() {
        clearInterval(tokenCheckInterval);
    });
}

// 토큰 갱신 함수
async function refreshAccessToken() {
    // 이미 갱신 중이면 중복 실행 방지
    if (window.auth.refreshInProgress) {
        return false;
    }
    
    window.auth.refreshInProgress = true;
    
    try {
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache' },
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            window.auth.accessToken = data.accessToken;
            window.auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
            
            console.log('토큰 갱신 성공. 만료 시간:', new Date(window.auth.tokenExpireTime).toLocaleString());
            
            window.auth.refreshInProgress = false;
            return true;
        }
        
        throw new Error('토큰 갱신 실패');
    } catch (error) {
        console.error('토큰 갱신 중 오류:', error);
        window.auth.refreshInProgress = false;
        return false;
    }
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