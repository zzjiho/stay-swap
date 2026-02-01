import type { ChatRoom, Message, SliceResponse, CreateChatRoomResponse } from '../types/chat.types';

const API_BASE = '/api/chats';

// API 응답 파서
async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data ?? json;
}

// 채팅방 목록 조회
export async function fetchChatRooms(page = 0, size = 20): Promise<SliceResponse<ChatRoom>> {
  const response = await fetch(`${API_BASE}?page=${page}&size=${size}`, {
    credentials: 'include',
  });
  return parseResponse<SliceResponse<ChatRoom>>(response);
}

// 채팅방 메시지 조회
export async function fetchMessages(
  chatRoomId: number,
  page = 0,
  size = 20
): Promise<SliceResponse<Message>> {
  const response = await fetch(`${API_BASE}/${chatRoomId}/messages?page=${page}&size=${size}`, {
    credentials: 'include',
  });
  return parseResponse<SliceResponse<Message>>(response);
}

// 숙소 문의 채팅방 생성/조회
export async function createOrGetChatRoom(houseId: number): Promise<CreateChatRoomResponse> {
  const response = await fetch(`${API_BASE}/house/${houseId}/inquiry`, {
    method: 'POST',
    credentials: 'include',
  });
  return parseResponse<CreateChatRoomResponse>(response);
}

// 채팅방 나가기
export async function leaveChatRoom(chatRoomId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${chatRoomId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

// 메시지 읽음 처리
export async function markAsRead(chatRoomId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${chatRoomId}/read`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

// 액세스 토큰 가져오기 (WebSocket 인증용)
export async function getAccessToken(): Promise<string> {
  const response = await fetch('/api/auth/token', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to get access token');
  }
  const json = await response.json();
  return json.data?.accessToken ?? json.accessToken ?? '';
}
