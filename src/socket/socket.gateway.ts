import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { SocketService } from './socket.service';
import { pairs } from './constants/pair.const';

@WebSocketGateway({
  transports: ['websocket', 'polling', 'flashsocket'],
  cors: { origin: '*' },
  namespace: 'bitstamp',
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private socketService: SocketService) {}

  afterInit(server: Server) {
    this.logger.log(`Gateway init`);
    this.socketService.setSocket(server);
  }

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('test')
  handleEvent(@MessageBody() data: string): string {
    this.logger.log(`test: ${data}`);
    return data;
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: string[],
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof data === 'string') data = [data];
    data
      .filter((x) => pairs.includes(x))
      .slice(0, 10)
      .forEach((x) => {
        this.socketService.createRoom(x);
        client.join(x);
      });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
