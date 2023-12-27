import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
