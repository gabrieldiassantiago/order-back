import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NeighborhoodController } from './bairros.controller';
import { entregasBairrosService } from './bairros.service';

@Module({
  providers: [entregasBairrosService, PrismaService],
  controllers: [NeighborhoodController],
})
export class NeighborhoodModule {}
