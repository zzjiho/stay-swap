// 알림 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수
    let currentFilter = 'all';
    let currentPage = 0;
    let isLoading = false;
    let hasMore = true;

    // DOM 요소
    const notificationsList = document.getElementById('notifications-list');
    const loadingSpinner = document.getElementById('notifications-loading');
    const emptyState = document.getElementById('notifications-empty');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    const clearAllBtn = document.getElementById('clear-all-btn');
    const filterTabs = document.querySelectorAll('.filter-tab');

    // 초기화
    init();

    function init() {
        // 로그인 상태 확인
        if (!window.auth?.accessToken) {
            showEmptyState('로그인이 필요합니다.');
            return;
        }

        // 이벤트 리스너 등록
        setupNotificationEventListeners();
        
        // 알림 목록 로드
        loadNotifications();
    }

    function setupNotificationEventListeners() {
        // 필터 탭 클릭
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                if (filter !== currentFilter) {
                    setActiveFilter(filter);
                    resetAndLoadNotifications();
                }
            });
        });

        // 더 보기 버튼
        loadMoreBtn.addEventListener('click', loadMoreNotifications);

        // 모두 삭제
        clearAllBtn.addEventListener('click', clearAllNotifications);
    }

    function setActiveFilter(filter) {
        currentFilter = filter;
        
        // 탭 활성화 상태 변경
        filterTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-filter') === filter) {
                tab.classList.add('active');
            }
        });
    }

    function resetAndLoadNotifications() {
        currentPage = 0;
        hasMore = true;
        notificationsList.innerHTML = '';
        loadNotifications();
    }

    async function loadNotifications() {
        if (isLoading || !hasMore) return;

        isLoading = true;
        showLoading();

        try {
            const params = new URLSearchParams({
                page: currentPage,
                size: 20,
                filter: currentFilter
            });

            const response = await fetch(`/api/notifications?${params}`, {
                headers: {
                    'Authorization': `Bearer ${window.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (currentPage === 0 && data.content.length === 0) {
                showEmptyState();
            } else {
                hideEmptyState();
                renderNotifications(data.content);
                
                hasMore = !data.last;
                currentPage++;
                
                if (hasMore) {
                    showLoadMoreButton();
                } else {
                    hideLoadMoreButton();
                }
            }

        } catch (error) {
            console.error('알림 로드 실패:', error);
            showError('알림을 불러오는 중 오류가 발생했습니다.');
        } finally {
            isLoading = false;
            hideLoading();
        }
    }

    function loadMoreNotifications() {
        loadNotifications();
    }

    function renderNotifications(notifications) {
        notifications.forEach(notification => {
            const notificationElement = createNotificationElement(notification);
            notificationsList.appendChild(notificationElement);
        });
    }

    function createNotificationElement(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? '' : 'unread'}`;
        item.dataset.id = notification.id;

        // 알림 타입에 따른 아이콘 설정
        const typeIcon = getNotificationTypeIcon(notification.type);
        
        // 프로필 이미지 또는 이니셜
        const avatarContent = notification.senderProfileImage 
            ? `<img src="${notification.senderProfileImage}" alt="${notification.senderName}" />`
            : `<div class="avatar-placeholder">${notification.senderName ? notification.senderName.charAt(0) : '?'}</div>`;

        // 액션 링크 생성
        const actionLink = notification.actionUrl 
            ? `<a href="${notification.actionUrl}" class="notification-action">자세히 보기</a>`
            : '';

        item.innerHTML = `
            <div class="notification-avatar">
                ${avatarContent}
                <div class="notification-type-icon ${typeIcon.class}">
                    <i class="fas ${typeIcon.icon}"></i>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-username">${notification.senderName || '알 수 없음'}</span>
                    <span class="notification-time">${formatTimeAgo(notification.createdAt)}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${actionLink}
            </div>
        `;

        // 클릭 이벤트 추가
        item.addEventListener('click', function(e) {
            // 링크 클릭이 아닌 경우에만 처리
            if (!e.target.closest('.notification-action')) {
                markAsRead(notification.id);
                if (notification.actionUrl) {
                    window.location.href = notification.actionUrl;
                }
            }
        });

        return item;
    }

    function getNotificationTypeIcon(type) {
        switch (type) {
            case 'LIKE':
                return { icon: 'fa-heart', class: 'like' };
            case 'BOOKING_REQUEST':
            case 'BOOKING_CONFIRMED':
            case 'BOOKING_CANCELLED':
                return { icon: 'fa-calendar', class: 'booking' };
            case 'SWAP_REQUEST':
            case 'SWAP_ACCEPTED':
            case 'SWAP_REJECTED':
                return { icon: 'fa-exchange-alt', class: 'swap' };
            case 'MESSAGE':
                return { icon: 'fa-envelope', class: 'message' };
            default:
                return { icon: 'fa-bell', class: 'default' };
        }
    }

    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffMonth > 0) {
            return `${diffMonth}개월 전`;
        } else if (diffWeek > 0) {
            return `${diffWeek}주 전`;
        } else if (diffDay > 0) {
            return `${diffDay}일 전`;
        } else if (diffHour > 0) {
            return `${diffHour}시간 전`;
        } else if (diffMin > 0) {
            return `${diffMin}분 전`;
        } else {
            return '방금 전';
        }
    }

    async function markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${window.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                // UI 업데이트
                const item = document.querySelector(`[data-id="${notificationId}"]`);
                if (item) {
                    item.classList.remove('unread');
                }
            }
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
        }
    }



    async function clearAllNotifications() {
        if (!confirm('모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }

        try {
            const response = await fetch('/api/notifications/clear-all', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${window.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                // UI 업데이트
                notificationsList.innerHTML = '';
                showEmptyState();
                showSuccessMessage('모든 알림을 삭제했습니다.');
            } else {
                throw new Error('서버 오류');
            }
        } catch (error) {
            console.error('모든 알림 삭제 실패:', error);
            showErrorMessage('알림 삭제 중 오류가 발생했습니다.');
        }
    }

    // UI 상태 관리 함수들
    function showLoading() {
        loadingSpinner.style.display = 'flex';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    function showEmptyState(message = '알림이 없습니다.') {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = message;
    }

    function hideEmptyState() {
        emptyState.style.display = 'none';
    }

    function showLoadMoreButton() {
        loadMoreContainer.style.display = 'block';
    }

    function hideLoadMoreButton() {
        loadMoreContainer.style.display = 'none';
    }

    function showError(message) {
        console.error(message);
        // 여기에 토스트 메시지나 알림 표시 로직 추가
    }

    function showSuccessMessage(message) {
        // 간단한 알림 표시 (실제로는 토스트 컴포넌트 사용 권장)
        alert(message);
    }

    function showErrorMessage(message) {
        alert(message);
    }
}); 