import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(@Body() body) {
    return this.orderService.createOrder(body);
  }

  @Get()
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @Put(':id')
  async updateOrder(@Param('id') id: string, @Body() body) {
    return this.orderService.updateOrder(id, body);
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }

  @Delete()
  async deleteAllOrders() {
    return this.orderService.deleteAllOrders();
  }

  @Get('status/:phone')
  async getOrderStatus(@Param('phone') phone: string) {
    return this.orderService.getOrderStatus(phone);
  }


}
