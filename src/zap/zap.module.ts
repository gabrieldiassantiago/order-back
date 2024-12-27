
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaileysService } from './zap.service';
import { BaileysController } from './zap.controller';

@Module({
  providers: [PrismaService, BaileysService],
  exports: [BaileysService],
  controllers: [BaileysController],
  
})
export class WhatsappModule {}
