import { useEffect, useRef, useCallback, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getAccessToken } from '../api/chat.api';
import type { Message } from '../types/chat.types';

interface UseWebSocketOptions {
  chatRoomId: number | null;
  onMessage: (message: Message) => void;
  enabled?: boolean;
}

export function useWebSocket({ chatRoomId, onMessage, enabled = true }: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onMessageRef = useRef(onMessage);

  // 최신 콜백 유지
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // WebSocket 연결
  useEffect(() => {
    if (!enabled || chatRoomId === null) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('/stomp/chats'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('[STOMP]', str);
        }
      },
    });

    client.onConnect = () => {
      setIsConnected(true);
      setError(null);

      // 채팅방 구독
      client.subscribe(`/sub/chats/${chatRoomId}`, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          const normalizedMessage: Message = {
            senderId: data.senderId,
            message: data.message || data.text || '',
            createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
          };
          onMessageRef.current(normalizedMessage);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      setError(frame.headers['message'] || 'WebSocket connection error');
      setIsConnected(false);
    };

    client.onDisconnect = () => {
      setIsConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [chatRoomId, enabled]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (message: string) => {
      if (!clientRef.current?.connected || chatRoomId === null) {
        throw new Error('WebSocket not connected');
      }

      try {
        const accessToken = await getAccessToken();

        clientRef.current.publish({
          destination: `/pub/chats/${chatRoomId}`,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message }),
        });
      } catch (e) {
        console.error('Failed to send message:', e);
        throw e;
      }
    },
    [chatRoomId]
  );

  return {
    isConnected,
    error,
    sendMessage,
  };
}
