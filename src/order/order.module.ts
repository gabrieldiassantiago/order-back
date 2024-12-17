import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappModule } from 'src/zap/zap.module';

@Module({
  imports: [WhatsappModule],
  providers: [OrderService, PrismaService],
  controllers: [OrderController],
})
export class OrderModule {}
