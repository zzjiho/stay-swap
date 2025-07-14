document.addEventListener('DOMContentLoaded', function () {
    let stompClient = null;
    let currentChatroomId = null;
    let currentUserId = null;

    // DOM 요소
    const chatListContainer = document.getElementById('chat-list-container');
    const messageList = document.getElementById('message-list');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    // welcomeScreen, conversationScreen 등은 UI에 맞게 필요시 추가

    // 초기화 함수
    function initializeMessages() {
        if (!window.auth || !window.auth.accessToken) {
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
    function connectWebSocket() {
        const socket = new SockJS('/stomp/chats');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            // 전체 채팅방 목록 실시간 갱신 필요시 /sub/chats/updates 구독
            stompClient.subscribe('/sub/chats/updates', function (message) {
                loadChatRooms();
            });
        });
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
            roomElement.dataset.chatroomId = room.id || room.chatroomId;
            const partner = room.partnerNickname || room.partnerName || '상대방';
            const profileUrl = room.partnerProfileUrl || '/images/profile.png';
            const lastMsg = room.lastMessage || '';
            const lastTime = room.lastMessageCreatedAt || room.lastMessageTimestamp || room.updatedAt;
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
            roomElement.addEventListener('click', () => selectChatRoom(room.id || room.chatroomId));
            chatListContainer.appendChild(roomElement);
        });
    }

    // 채팅방 선택
    function selectChatRoom(chatroomId) {
        if (currentChatroomId === chatroomId) return;
        currentChatroomId = chatroomId;
        document.querySelectorAll('.chat-list-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatroomId == currentChatroomId) {
                item.classList.add('active');
            }
        });
        messageList.innerHTML = '<div class="loader-container"><div class="loading-spinner"></div></div>';
        loadMessages(chatroomId);
        subscribeToChatRoom(chatroomId);
    }

    // 메시지 목록 로드
    function loadMessages(chatroomId) {
        fetchWithAuth(`/api/chats/${chatroomId}/messages`)
            .then(response => response.json())
            .then(result => {
                if (result.httpStatus === 'OK') {
                    renderMessages(result.data.content);
                } else {
                    messageList.innerHTML = '<p>메시지를 불러오지 못했습니다.</p>';
                }
            })
            .catch(error => {
                messageList.innerHTML = '<p>메시지를 불러오지 못했습니다.</p>';
            });
    }

    // 메시지 렌더링
    function renderMessages(messages) {
        messageList.innerHTML = '';
        if (!messages || messages.length === 0) {
            messageList.innerHTML = '<p>메시지가 없습니다.</p>';
            return;
        }
        messages.forEach(msg => appendMessage(msg));
        messageList.scrollTop = messageList.scrollHeight;
    }

    // 개별 메시지 추가
    function appendMessage(message) {
        const isMine = message.senderId === currentUserId || message.nickname === window.currentUserNickname;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message-bubble');
        messageElement.classList.add(isMine ? 'my-message' : 'partner-message');
        messageElement.innerHTML = `
            <div class="message-content">${escapeHtml(message.message || message.text)}</div>
            <div class="message-meta">${formatTime(message.createdAt || message.timestamp)}</div>
        `;
        messageList.appendChild(messageElement);
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
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text && currentChatroomId && stompClient) {
            stompClient.send(
                `/pub/chats/${currentChatroomId}`,
                {},
                JSON.stringify({ message: text })
            );
            messageInput.value = '';
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
        return text.replace(/[&<>"']/g, function (c) {
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
