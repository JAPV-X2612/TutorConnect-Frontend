import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api')
  .replace('/api', '');

export interface ChatMessage {
  id: number;
  content: string;
  sentAt: string;
  fromMe: boolean;
  sender: { id: number; firstName: string; lastName: string };
}

/**
 * Manages a real-time Socket.io connection to the /messages namespace for a
 * specific channel. Handles auth, reconnection, and message delivery.
 *
 * @param channelId - The channel to join. Pass null to stay disconnected.
 * @param onMessage - Called whenever a new message arrives from the server.
 */
export function useChat(
  channelId: number | null,
  onMessage: (msg: ChatMessage) => void,
) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!channelId) return;

    let socket: Socket;

    const connect = async () => {
      const token = await getToken().catch(() => null);

      socket = io(`${SOCKET_URL}/messages`, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        socket.emit('join', { channelId });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('message:new', (msg: ChatMessage) => {
        handlerRef.current(msg);
      });
    };

    void connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [channelId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current?.connected || !channelId) return;
      socketRef.current.emit('message:send', { channelId, content });
    },
    [channelId],
  );

  return { connected, sendMessage };
}
