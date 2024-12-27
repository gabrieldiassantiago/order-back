import { Controller, Post, Get, Body } from '@nestjs/common';
import { BaileysService } from './zap.service';

@Controller('')
export class BaileysController {
  constructor(private readonly baileysService: BaileysService) {}

  @Post('pairing-code')
  async getPairingCode(@Body('phoneNumber') phoneNumber: string) {
    const message = await this.baileysService.generatePairingCode(phoneNumber);
    return { message };
  }

  @Get('connection-status')
  async getConnectionStatus() {
    const status = await this.baileysService.getConnectionStatus();
    return { status };
  }

  @Post('disconnect')
  async disconnect() {
    await this.baileysService.disconnect();
    return { message: 'Disconnected successfully' };
  }
}