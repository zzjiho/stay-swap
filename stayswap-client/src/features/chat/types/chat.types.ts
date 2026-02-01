// 채팅방 타입
export interface ChatRoom {
  id: number;
  partnerNickname: string;
  partnerProfileUrl: string | null;
  lastMessage: string | null;
  lastMessageCreatedAt: string | null;
  createdAt: string;
  unreadCount: number;
}

// 메시지 타입
export interface Message {
  id?: number;
  senderId: number;
  message: string;
  text?: string; // API 응답에서 사용될 수 있음
  createdAt: string;
  timestamp?: string; // API 응답에서 사용될 수 있음
}

// 메시지 전송 요청 타입
export interface SendMessageRequest {
  chatRoomId: number;
  message: string;
}

// 채팅방 생성 응답 타입
export interface CreateChatRoomResponse {
  chatRoomId: number;
  isNew: boolean;
}

// 페이지네이션 응답 타입
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  empty: boolean;
}

// Slice 응답 타입 (무한 스크롤용)
export interface SliceResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  first: boolean;
  empty: boolean;
  numberOfElements: number;
}
