import { Controller, Post, Body, Put, Param, Delete, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('orders') @Controller('orders')
@Controller('orders')
export class OrderController {
  
  constructor(private readonly orderService: OrderService) {}
  
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Put(':id')
  async updateOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(id);
  }

  @Get()
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
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