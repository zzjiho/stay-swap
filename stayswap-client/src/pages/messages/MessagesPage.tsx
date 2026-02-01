import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { fetchChatRooms, fetchMessages, markAsRead } from '@/features/chat/api/chat.api';
import { useWebSocket } from '@/features/chat/hooks/useWebSocket';
import type { ChatRoom, Message } from '@/features/chat/types/chat.types';

import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Send from 'lucide-react/dist/esm/icons/send';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';

// 시간 포맷팅 (HH:MM)
function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// 날짜 포맷팅 (상대적)
function formatRelativeDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return formatTime(timestamp);
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function MessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [messagesPage, setMessagesPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMobileListView, setIsMobileListView] = useState(true);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 채팅방 목록 조회
  const { data: chatRoomsData, isLoading: chatRoomsLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => fetchChatRooms(0, 50),
  });

  const chatRooms = chatRoomsData?.content ?? [];

  // WebSocket 연결
  const handleNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => [...prev, message]);

      // 스크롤 하단으로
      requestAnimationFrame(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      });

      // 채팅방 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
    [queryClient]
  );

  const { isConnected, sendMessage } = useWebSocket({
    chatRoomId: selectedChatRoom?.id ?? null,
    onMessage: handleNewMessage,
    enabled: !!selectedChatRoom,
  });

  // 채팅방 선택 시 메시지 로드
  useEffect(() => {
    if (!selectedChatRoom) return;

    const loadInitialMessages = async () => {
      try {
        const response = await fetchMessages(selectedChatRoom.id, 0, 20);
        // 서버는 DESC 순으로 반환, 클라이언트에서 ASC로 변환
        setMessages(response.content.reverse());
        setHasMoreMessages(!response.last);
        setMessagesPage(0);

        // 읽음 처리
        await markAsRead(selectedChatRoom.id);

        // 스크롤 하단으로
        requestAnimationFrame(() => {
          if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
          }
        });
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadInitialMessages();
  }, [selectedChatRoom]);

  // 이전 메시지 로드 (무한 스크롤)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedChatRoom || !hasMoreMessages || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = messagesPage + 1;
      const response = await fetchMessages(selectedChatRoom.id, nextPage, 20);
      const olderMessages = response.content.reverse();

      // 스크롤 위치 유지
      const scrollElement = messageListRef.current;
      const previousScrollHeight = scrollElement?.scrollHeight ?? 0;

      setMessages((prev) => [...olderMessages, ...prev]);
      setHasMoreMessages(!response.last);
      setMessagesPage(nextPage);

      // 스크롤 위치 복원
      requestAnimationFrame(() => {
        if (scrollElement) {
          const newScrollHeight = scrollElement.scrollHeight;
          scrollElement.scrollTop = newScrollHeight - previousScrollHeight;
        }
      });
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedChatRoom, hasMoreMessages, isLoadingMore, messagesPage]);

  // 스크롤 감지 (무한 스크롤)
  const handleScroll = useCallback(() => {
    const scrollElement = messageListRef.current;
    if (!scrollElement) return;

    if (scrollElement.scrollTop <= 1 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // 메시지 전송
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !selectedChatRoom || !isConnected) return;

    try {
      await sendMessage(trimmedMessage);
      setMessageInput('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  }, [messageInput, selectedChatRoom, isConnected, sendMessage]);

  // Enter 키 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // 채팅방 선택
  const handleSelectChatRoom = useCallback((chatRoom: ChatRoom) => {
    // 이미 선택된 채팅방이면 무시
    if (selectedChatRoom?.id === chatRoom.id) return;

    setSelectedChatRoom(chatRoom);
    setIsMobileListView(false);
    setMessages([]);
    setMessagesPage(0);
    setHasMoreMessages(true);
  }, [selectedChatRoom?.id]);

  // 모바일 뒤로가기
  const handleBackToList = useCallback(() => {
    setIsMobileListView(true);
    setSelectedChatRoom(null);
  }, []);

  // 로딩 상태
  if (chatRoomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-gray-50">
      <div className="container mx-auto px-4 h-full max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm h-full flex overflow-hidden">
          {/* 채팅방 목록 (사이드바) */}
          <aside
            className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 flex flex-col ${
              !isMobileListView ? 'hidden md:flex' : 'flex'
            }`}
          >
            <header className="px-4 py-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                메시지
              </h2>
            </header>

            <div className="flex-1 overflow-y-auto">
              {chatRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                  <p>대화 내역이 없습니다.</p>
                  <p className="text-sm mt-1">숙소 상세 페이지에서 문의를 시작해보세요!</p>
                </div>
              ) : (
                chatRooms.map((chatRoom) => (
                  <button
                    key={chatRoom.id}
                    onClick={() => handleSelectChatRoom(chatRoom)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedChatRoom?.id === chatRoom.id ? 'bg-violet-50' : ''
                    }`}
                  >
                    <img
                      src={chatRoom.partnerProfileUrl || '/images/default-avatar.png'}
                      alt={chatRoom.partnerNickname}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{chatRoom.partnerNickname}</span>
                        {chatRoom.lastMessageCreatedAt && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatRelativeDate(chatRoom.lastMessageCreatedAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {chatRoom.lastMessage || '새로운 대화'}
                        </p>
                        {chatRoom.unreadCount > 0 && (
                          <span className="bg-violet-600 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                            {chatRoom.unreadCount > 99 ? '99+' : chatRoom.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* 메시지 영역 */}
          <main
            className={`flex-1 flex flex-col ${isMobileListView ? 'hidden md:flex' : 'flex'}`}
          >
            {!selectedChatRoom ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                <p>대화를 선택해주세요</p>
              </div>
            ) : (
              <>
                {/* 채팅 헤더 */}
                <header className="px-4 py-3 border-b flex items-center gap-3">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={selectedChatRoom.partnerProfileUrl || '/images/default-avatar.png'}
                    alt={selectedChatRoom.partnerNickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{selectedChatRoom.partnerNickname}</h3>
                    <p className="text-xs text-gray-500">
                      {isConnected ? '온라인' : '연결 중...'}
                    </p>
                  </div>
                </header>

                {/* 메시지 목록 */}
                <div
                  ref={messageListRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                >
                  {isLoadingMore && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}

                  {messages.map((message, index) => {
                    // senderId와 user.id 숫자로 비교 (타입 불일치 해결)
                    const isMyMessage = Number(message.senderId) === Number(user?.id);
                    const messageText = message.message || message.text || '';
                    const timestamp = message.createdAt || message.timestamp || '';

                    return (
                      <div
                        key={`${message.senderId}-${timestamp}-${index}`}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            isMyMessage
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p
                            className="whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{ __html: escapeHtml(messageText) }}
                          />
                          <p
                            className={`text-xs mt-1 ${
                              isMyMessage ? 'text-violet-200' : 'text-gray-400'
                            }`}
                          >
                            {formatTime(timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 메시지 입력 */}
                <footer className="px-4 py-3 border-t">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="메시지를 입력하세요..."
                      rows={1}
                      className="flex-1 resize-none border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 max-h-32"
                      style={{ minHeight: '40px' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || !isConnected}
                      className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
