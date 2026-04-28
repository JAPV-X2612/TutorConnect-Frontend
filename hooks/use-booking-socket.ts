import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useProfile } from './use-profile';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api')
  .replace('/api', '');

type BookingUpdatedHandler = (booking: Record<string, unknown>) => void;

/**
 * Connects to the /bookings Socket.io namespace and calls `onBookingUpdated`
 * whenever the server emits a `booking:updated` event for this user.
 *
 * The socket joins the user's private room (`learner:<clerkId>` or
 * `tutor:<clerkId>`) after connecting, so only relevant events are received.
 */
export function useBookingSocket(onBookingUpdated: BookingUpdatedHandler) {
  const { getToken, userId } = useAuth();
  const { profile } = useProfile();
  const socketRef = useRef<Socket | null>(null);
  const handlerRef = useRef(onBookingUpdated);
  handlerRef.current = onBookingUpdated;

  useEffect(() => {
    if (!userId || !profile?.role) return;

    let socket: Socket;

    const connect = async () => {
      const token = await getToken();

      socket = io(`${SOCKET_URL}/bookings`, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join', { clerkId: userId, role: profile.role });
      });

      socket.on('booking:updated', (data: Record<string, unknown>) => {
        handlerRef.current(data);
      });
    };

    void connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [userId, profile?.role]);
}
