import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { WhatsappModule } from './zap/zap.module';
import { NeighborhoodModule } from './bairros/bairros.module';
import { CategoryModule } from './category/category.module';
import { AdditionModule } from './addition/additio.module';
import { HealthCheckService } from './health-check.service';
import { AppController } from './app.controller'; // Adicionar importação do controlador
import { AppService } from './app.service'; // Adicionar importação do serviço

@Module({
  imports: [PrismaModule, ProductModule, OrderModule, WhatsappModule, NeighborhoodModule, CategoryModule, AdditionModule],
  controllers: [AppController], // Registrar controlador
  providers: [HealthCheckService, AppService], // Registrar serviço
})
export class AppModule {}
