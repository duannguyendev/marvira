import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'] },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async afterInit(server: Server) {
    if (process.env.REDIS_DISABLED === 'true') {
      return;
    }
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { default: Redis } = await import('ioredis');
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const pubClient = new Redis(redisUrl, { maxRetriesPerRequest: null });
      const subClient = pubClient.duplicate();
      server.adapter(createAdapter(pubClient, subClient));
      this.logger.log('Socket.IO Redis adapter enabled');
    } catch (error) {
      this.logger.warn(`Socket.IO Redis adapter not configured: ${error}`);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      const userId = payload.sub;
      client.data.userId = userId;
      await client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} user=${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitPlaceUnlocked(userId: string, placeId: string, eventId: string) {
    this.server.to(`user:${userId}`).emit('place_unlocked', { userId, placeId, eventId });
  }

  emitProgressUpdated(
    userId: string,
    eventId: string,
    currentPlaceIndex: number,
    score: number,
  ) {
    this.server
      .to(`user:${userId}`)
      .emit('event_progress_updated', { userId, eventId, currentPlaceIndex, score });
  }

  emitEventCompleted(userId: string, eventId: string, score: number) {
    this.server.to(`user:${userId}`).emit('event_completed', { userId, eventId, score });
  }
}
