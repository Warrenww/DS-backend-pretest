import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { pairs } from './constants/pair.const';

type SubscribeData = {
  data: {
    id: number;
    timestamp: string;
    amount: number;
    amount_str: string;
    price: number;
    price_str: string;
    type: 0 | 1;
    microtimestamp: string;
    buy_order_id: number;
    sell_order_id: number;
  };
  channel: string;
  event: string;
};

@Injectable()
export class SocketService {
  private server: Server;
  private rooms: string[] = [];
  private subscribeMap: Map<string, Set<string>> = new Map();
  private ws: WebSocket;
  private logger: Logger = new Logger('SocketService');

  constructor() {
    this.ws = new WebSocket('wss://ws.bitstamp.net');
    this.ws.on('error', this.logger.error);

    this.ws.on('open', () => {
      this.logger.log('Connected to bitstamp');
    });

    this.ws.on('close', () => {
      this.logger.log('Disconnected from bitstamp');
    });

    this.ws.on('message', (data) => {
      try {
        const message: SubscribeData = JSON.parse(data.toString());
        this.handleData(message);
      } catch (e) {
        this.logger.error(e);
      }
    });
  }

  handleData(message: SubscribeData) {
    if (
      message.event !== 'trade' ||
      !message.channel.startsWith('live_trades_')
    ) {
      this.logger.log(`Unknown message: ${JSON.stringify(message)}`);
      return;
    }

    const room = message.channel.replace('live_trades_', '');
    if (!this.rooms.includes(room)) return;

    this.server.to(room).emit('trade', message.data.price);
  }

  async handleSubscribe(data: string[], client: Socket) {
    const subscribed = this.subscribeMap.get(client.id) || new Set();

    const newSub = Array.from(
      new Set([...subscribed, ...data.filter((x) => pairs.includes(x))]),
    );

    newSub.slice(0, 10).forEach((x) => {
      client.join(x);
      this.createRoom(x);
    });

    this.subscribeMap.set(client.id, new Set(newSub));

    return newSub;
  }

  async handleUnsubscribe(data: string[], client: Socket) {
    const subscribed = this.subscribeMap.get(client.id) || new Set();

    data.forEach((x) => {
      client.leave(x);
      subscribed.delete(x);
    });

    this.subscribeMap.set(client.id, subscribed);

    return Array.from(subscribed);
  }

  setSocket(server: Server) {
    this.server = server;
  }

  private createRoom(room: string) {
    if (this.rooms.includes(room)) return;
    if (this.ws.readyState !== WebSocket.OPEN) return;

    this.rooms.push(room);
    this.ws.send(
      JSON.stringify({
        event: 'bts:subscribe',
        data: {
          channel: `live_trades_${room}`,
        },
      }),
    );
  }
}
