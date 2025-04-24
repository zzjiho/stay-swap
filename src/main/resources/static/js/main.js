document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 토글 기능 (필요시 구현)

    // 현재 페이지 활성화
    highlightCurrentPage();
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