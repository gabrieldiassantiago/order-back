import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { WhatsappModule } from './zap/zap.module';
import { NeighborhoodModule } from './bairros/bairros.module';

@Module({
  imports: [PrismaModule, ProductModule, OrderModule, WhatsappModule, NeighborhoodModule ],

})
export class AppModule {}
