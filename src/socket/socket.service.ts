import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;
  private rooms: string[] = [];

  constructor() {}

  setSocket(server: Server) {
    this.server = server;
  }

  createRoom(room: string) {
    if (this.rooms.includes(room)) return;

    this.rooms.push(room);
    setInterval(() => {
      this.server.to(room).emit('data', `data for ${room}`);
    }, 3000);
  }
}
