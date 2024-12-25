
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaileysService } from './zap.service';

@Module({
  providers: [PrismaService, BaileysService],
  exports: [BaileysService],
})
export class WhatsappModule {}
