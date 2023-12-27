import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { pairs } from './constants/pair.const';

@Injectable()
export class SocketService {
  private server: Server;
  private rooms: string[] = [];
  private subscribeMap: Map<string, Set<string>> = new Map();

  constructor() {}

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

    this.rooms.push(room);
    setInterval(() => {
      this.server.to(room).emit('data', `data for ${room}`);
    }, 3000);
  }
}
