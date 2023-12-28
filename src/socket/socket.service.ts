import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { pairs } from './constants/pair.const';
import { OHLCDataType, ConsumeResult } from './types/ohlc-data.type';
import { SubscribeData } from './types/subscribe-data.type';

class OHLCDataSource {
  constructor(public readonly pair: string) {}

  private current: OHLCDataType = {
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    timestamp: 0,
  };

  consume(price: number, timestamp: number = Date.now()): ConsumeResult {
    let result: ConsumeResult = { status: 'skip' };
    if (!this.current.timestamp || timestamp - this.current.timestamp > 60000) {
      const time = new Date(timestamp);
      time.setSeconds(0);
      time.setMilliseconds(0);
      if (this.current.timestamp) {
        result = {
          status: 'update',
          data: this.current,
        };
      }

      this.current = {
        open: price,
        high: price,
        low: price,
        close: price,
        timestamp: time.getTime(),
      };
    } else {
      if (price > this.current.high) {
        this.current.high = price;
      }
      if (price < this.current.low) {
        this.current.low = price;
      }
      this.current.close = price;
    }
    return result;
  }
}

@Injectable()
export class SocketService {
  private server: Server;
  private rooms: string[] = [];
  private subscribeMap: Map<string, Set<string>> = new Map();
  private ohlcMap: Map<string, OHLCDataSource> = new Map();
  private ws: WebSocket;
  private logger: Logger = new Logger('SocketService');

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
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

    const pair = message.channel.replace('live_trades_', '');
    if (!this.rooms.includes(pair)) return;

    if (!this.ohlcMap.has(pair)) {
      this.ohlcMap.set(pair, new OHLCDataSource(pair));
    }
    const { price, timestamp } = message.data;
    const ohlc = this.ohlcMap.get(pair);
    const result = ohlc.consume(price, Number(timestamp) * 1000);
    if (result.status === 'update') {
      const pairKey = `ohlc:${pair}:${result.data.timestamp}`;
      this.cacheManager.set(pairKey, result, { ttl: 15 * 60 } as any);
    }
    this.server.to(pair).emit('trade', price);
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
