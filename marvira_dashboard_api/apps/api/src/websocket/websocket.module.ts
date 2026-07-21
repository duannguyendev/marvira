import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [JwtModule.register({}), forwardRef(() => AnalyticsModule)],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
