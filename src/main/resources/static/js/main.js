document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 토글 기능 (필요시 구현)

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
            if (typeof logout === 'function') {
                logout();
            }
        });
    }

    // URL에서 코드 파라미터를 확인하는 부분 유지
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

// 로그인 후 토큰 가져오기를 위해 자동으로 initializeAuth 호출
async function initializeAuth() {
    // 이미 유효한 토큰이 있는 경우
    if (auth.isInitialized && auth.accessToken && !isTokenExpired()) {
        return true;
    }
    
    try {
        // 토큰 갱신 API 호출
        const response = await fetch('/api/token/refresh', {
            method: 'GET',
            credentials: 'include' // 쿠키 포함
        });
        
        if (!response.ok) {
            auth.isInitialized = true;
            dispatchLoginEvent(false);
            return false;
        }
        
        const data = await response.json();
        auth.accessToken = data.accessToken;
        auth.tokenExpireTime = new Date(data.accessTokenExpireTime).getTime();
        auth.isInitialized = true;
        
        setupTokenRenewal();
        dispatchLoginEvent(true);
        
        return true;
    } catch (error) {
        console.error('인증 초기화 중 오류:', error);
        auth.isInitialized = true;
        dispatchLoginEvent(false);
        return false;
    }
}

console.log(window.auth.accessToken);