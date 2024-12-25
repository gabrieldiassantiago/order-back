import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  emitOrderUpdate(order: any) {
    this.server.emit('orderUpdated', order);
  }

  emitProductUpdate(product: any) {
    this.server.emit('productUpdated', product);
  }
}