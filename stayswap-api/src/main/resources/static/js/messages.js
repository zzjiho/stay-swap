document.addEventListener('DOMContentLoaded', function () {
    let stompClient = null;
    let currentChatroomId = null;
    let currentUserId = null;
    let currentPage = 0;
    let hasMoreMessages = true;
    let isLoadingMessages = false;

    // DOM 요소
    const chatListContainer = document.getElementById('chat-list-container');
    const messageList = document.getElementById('message-list');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    // welcomeScreen, conversationScreen 등은 UI에 맞게 필요시 추가

    // 초기화 함수
    function initializeMessages() {
        if (!window.isLoggedIn()) {
            chatListContainer.innerHTML = '<p>로그인이 필요합니다.</p>';
            return;
        }
        fetchWithAuth('/api/user/me').then(response => response.json()).then(result => {
            currentUserId = result.data.id;
            loadChatRooms();
            connectWebSocket();
        }).catch(error => {
            chatListContainer.innerHTML = '<p>사용자 정보를 가져오는 데 실패했습니다.</p>';
        });
    }

    // 웹소켓 연결
    async function connectWebSocket() {
        const socket = new SockJS('/stomp/chats');
        stompClient = Stomp.over(socket);
        
        // 먼저 사용자 정보를 가져와서 WebSocket 연결 시 사용할 수 있도록 준비
        try {
            const userResponse = await fetchWithAuth('/api/user/me');
            const userResult = await userResponse.json();
            currentUserId = userResult.data.id;
            
            // WebSocket 연결 (HttpOnly 쿠키는 자동으로 포함됨)
            stompClient.connect({}, function (frame) {
                // 전체 채팅방 목록 실시간 갱신 (메시지 전송 시마다 호출되지 않도록 주석 처리)
                // stompClient.subscribe('/sub/chats/updates', function (message) {
                //     loadChatRooms();
                // });
            }, function(error) {
                console.error('WebSocket 연결 실패:', error);
            });
        } catch (error) {
            console.error('사용자 정보 조회 실패:', error);
        }
    }

    // 채팅방 목록 로드
    function loadChatRooms() {
        chatListContainer.innerHTML = '<div class="loader-container"><div class="loading-spinner"></div></div>';
        fetchWithAuth('/api/chats')
            .then(response => response.json())
            .then(result => {
                if (result.httpStatus === 'OK') {
                    renderChatRoomList(result.data.content);
                } else {
                    chatListContainer.innerHTML = '<p>채팅방을 불러오는데 실패했습니다.</p>';
                }
            })
            .catch(error => {
                chatListContainer.innerHTML = '<p>채팅방을 불러오는데 실패했습니다.</p>';
            });
    }

    // 채팅방 목록 렌더링
    function renderChatRoomList(chatrooms) {
        chatListContainer.innerHTML = '';
        if (!chatrooms || chatrooms.length === 0) {
            chatListContainer.innerHTML = '<p>대화중인 채팅방이 없습니다.</p>';
            return;
        }
        chatrooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('chat-list-item');
            roomElement.dataset.chatroomId = room.id;
            
            const partner = room.partnerNickname || '상대방';
            const profileUrl = room.partnerProfileUrl || '/images/profile.png';
            const lastMsg = room.lastMessage || '';
            const lastTime = room.lastMessageCreatedAt || room.createdAt;
            const unread = room.unreadCount || 0;
            
            roomElement.innerHTML = `
                <img src="${profileUrl}" class="chat-list-avatar" />
                <div class="chat-list-info">
                    <div class="chat-list-name-time">
                        <span class="chat-list-name">${partner}</span>
                        <span class="chat-list-time">${formatTime(lastTime)}</span>
                    </div>
                    <div class="chat-list-lastmsg">${lastMsg}</div>
                </div>
                ${unread > 0 ? `<span class="chat-list-unread">${unread}</span>` : ''}
            `;
            roomElement.addEventListener('click', () => selectChatRoom(room.id));
            chatListContainer.appendChild(roomElement);
        });
    }

    // 채팅방 선택
    function selectChatRoom(chatroomId) {
        if (currentChatroomId === chatroomId) return;
        currentChatroomId = chatroomId;
        currentPage = 0; // 채팅방 변경 시 페이지 초기화
        hasMoreMessages = true; // 채팅방 변경 시 메시지 더 있음으로 초기화
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatroomId == currentChatroomId) {
                item.classList.add('active');
            }
        });
        messageList.innerHTML = '<div class="loader-container"><div class="loading-spinner"></div></div>';
        loadMessages(chatroomId); // 첫 페이지 로드
        subscribeToChatRoom(chatroomId);
    }

    // 메시지 목록 로드
    function loadMessages(chatroomId, page = 0, size = 20, append = false) {
        if (isLoadingMessages) return;
        isLoadingMessages = true;
        if (!append) {
            messageList.innerHTML = '<div class="loader-container"><div class="loading-spinner"></div></div>';
        }

        fetchWithAuth(`/api/chats/${chatroomId}/messages?page=${page}&size=${size}`)
            .then(response => response.json())
            .then(result => {
                if (result.httpStatus === 'OK' && result.data && Array.isArray(result.data.content)) {
                    let messagesToRender = result.data.content; // 백엔드에서 최신 순서로 준다 (DESC)
                    // 항상 reverse해서 오래된 메시지가 위에 오도록
                    messagesToRender = messagesToRender.reverse();
                    hasMoreMessages = !result.data.last;
                    currentPage = result.data.number;
                    renderMessages(messagesToRender, append);
                } else {
                    if (!append) {
                        messageList.innerHTML = '<p>메시지를 불러오지 못했습니다.</p>';
                    }
                    console.error('메시지 로드 실패: 유효하지 않은 응답 데이터', result);
                }
            })
            .catch(error => {
                console.error('메시지 로드 실패:', error.name, error.message, error.stack);
                if (!append) {
                    messageList.innerHTML = '<p>메시지를 불러오지 못했습니다.</p>';
                }
            })
            .finally(() => {
                isLoadingMessages = false;
            });
    }

    // 메시지 렌더링
    function renderMessages(messages, append = false) {
        if (!append) {
            messageList.innerHTML = '';
        }
        if (!Array.isArray(messages) || messages.length === 0) {
            if (!append) {
                messageList.innerHTML = '<p>메시지가 없습니다.</p>';
            }
            return;
        }

        const fragment = document.createDocumentFragment();
        messages.forEach(msg => {
            const messageElement = createMessageElement(msg);
            fragment.appendChild(messageElement);
        });

        if (append) {
            // 기존 메시지들 앞에 새로운 메시지들을 삽입 (시간순 유지)
            const firstChild = messageList.firstChild;
            if (firstChild) {
                messageList.insertBefore(fragment, firstChild);
            } else {
                messageList.appendChild(fragment);
            }
            // 스크롤 위치는 그대로 유지하지 않고 새로 추가된 메시지로 이동
        } else {
            messageList.appendChild(fragment);
            requestAnimationFrame(() => {
                messageList.scrollTop = messageList.scrollHeight;
            });
        }
    }

    // 개별 메시지 요소 생성
    function createMessageElement(message) {
        const isMine = message.senderId === currentUserId;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-bubble');
        messageElement.classList.add(isMine ? 'my-message' : 'partner-message');
        messageElement.innerHTML = `
            <div class="message-content">${escapeHtml(message.message || message.text)}</div>
            <div class="message-meta">${formatTime(message.createdAt || message.timestamp)}</div>
        `;
        return messageElement;
    }

    // 개별 메시지 추가 (새 메시지 수신 시)
    function appendMessage(message) {
        const messageElement = createMessageElement(message);
        messageList.appendChild(messageElement);
        requestAnimationFrame(() => {
            messageList.scrollTop = messageList.scrollHeight;
        });
    }

    // 채팅방 구독
    function subscribeToChatRoom(chatroomId) {
        if (stompClient && stompClient.connected) {
            stompClient.unsubscribe && stompClient.unsubscribe('chatroom');
            stompClient.subscribe(`/sub/chats/${chatroomId}`, function (message) {
                const newMessage = JSON.parse(message.body);
                appendMessage(newMessage);
                messageList.scrollTop = messageList.scrollHeight;
            }, { id: 'chatroom' });
        }
    }

    // 메시지 전송
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (text && currentChatroomId && stompClient) {
            try {
                // 서버에서 accessToken 가져오기
                const tokenResponse = await fetchWithAuth('/api/auth/token');
                const tokenData = await tokenResponse.json();
                
                if (tokenData.accessToken) {
                    stompClient.send(
                        `/pub/chats/${currentChatroomId}`,
                        { 'Authorization': `Bearer ${tokenData.accessToken}` },
                        JSON.stringify({ message: text })
                    );
                    messageInput.value = '';
                } else {
                    console.error('서버에서 토큰을 가져올 수 없습니다.');
                    alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
                }
            } catch (error) {
                console.error('토큰 가져오기 실패:', error);
                alert('인증 오류가 발생했습니다. 다시 로그인해주세요.');
            }
        }
    }

    // 이벤트 리스너
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 무한 스크롤 이벤트 리스너
    messageList.addEventListener('scroll', function() {
        // 스크롤이 맨 위로 도달했는지 확인 (오차 범위 1px)
        if (messageList.scrollTop <= 1 && hasMoreMessages && !isLoadingMessages) {
            loadMessages(currentChatroomId, currentPage + 1, 20, true);
        }
    });

    // 시간 포맷팅 함수
    function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // HTML 이스케이프
    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/[&<>"]/g, function (c) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
        });
    }

    // 인증 상태 확인 후 초기화
    document.addEventListener('authStateChanged', (e) => {
        if (e.detail.isLoggedIn) {
            initializeMessages();
        } else {
            if (stompClient) stompClient.disconnect();
            chatListContainer.innerHTML = '<p>로그인이 필요합니다.</p>';
            messageList.innerHTML = '';
        }
    });

    if (window.authInitialized) {
        initializeMessages();
    }
});