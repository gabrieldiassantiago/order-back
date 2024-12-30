import { Module } from '@nestjs/common';
import { AdditionService } from './addition.service';
import { AdditionController } from './addition.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdditionController],
  providers: [AdditionService, PrismaService],
})
export class AdditionModule {}