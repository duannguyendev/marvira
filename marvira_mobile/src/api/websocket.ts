import {io, Socket} from 'socket.io-client';
import {API_BASE_URL} from '../utils/constants';
import {storage} from '../utils/storage';

let socket: Socket | null = null;

function wsBaseUrl(): string {
  const url = new URL(API_BASE_URL);
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${url.host}`;
}

export type GameSocketHandlers = {
  onProgressUpdated?: (payload: {
    userId: string;
    eventId: string;
    currentPlaceIndex: number;
    score: number;
  }) => void;
  onPlaceUnlocked?: (payload: {
    userId: string;
    placeId: string;
    eventId: string;
  }) => void;
  onEventCompleted?: (payload: {
    userId: string;
    eventId: string;
    score: number;
  }) => void;
};

export async function connectGameSocket(
  handlers: GameSocketHandlers,
): Promise<Socket | null> {
  const token = await storage.getToken();
  if (!token) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(`${wsBaseUrl()}/ws`, {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
  });

  socket.on('event_progress_updated', payload => {
    handlers.onProgressUpdated?.(payload);
  });
  socket.on('place_unlocked', payload => {
    handlers.onPlaceUnlocked?.(payload);
  });
  socket.on('event_completed', payload => {
    handlers.onEventCompleted?.(payload);
  });

  return socket;
}

export function disconnectGameSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
