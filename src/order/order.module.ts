import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappModule } from 'src/zap/zap.module';
import { OrdersGateway } from './order.gateway';

@Module({
  imports: [WhatsappModule],
  providers: [OrderService, PrismaService, OrdersGateway],
  controllers: [OrderController],
})
export class OrderModule {}