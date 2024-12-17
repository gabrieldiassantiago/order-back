import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BaileysService {
  private readonly logger = new Logger(BaileysService.name);
  private sock: any;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.initialize();
  }

  async initialize() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.initialize();
        }
      } else if (connection === 'open') {
        this.logger.log('Conectado ao WhatsApp');
      }

      if (qr) {
        qrcode.generate(qr, { small: true });
      }
    });

    this.sock.ev.on('messages.upsert', async (message) => {
      const msg = message.messages[0];
      this.logger.log(`Mensagem recebida: ${JSON.stringify(msg)}`);
      const text = msg.message?.conversation?.toLowerCase();
      if (text === 'quero acompanhar meu pedido') {
        this.logger.log('Comando "quero acompanhar meu pedido" recebido');
        await this.handleOrderStatusRequest(msg.key.remoteJid);
      } else if (text === 'quero cancelar meu pedido') {
        this.logger.log('Comando "quero cancelar meu pedido" recebido');
        await this.handleOrderCancelRequest(msg.key.remoteJid);
      } else if (text === '/produtos') {
        this.logger.log('Comando "/produtos" recebido');
        await this.handleProductListRequest(msg.key.remoteJid);
      }
    });
  }

  async sendOrderConfirmation(phone: string, message: string) {
    try {
      // Remover caracteres não numéricos
      phone = phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
         phone = `55${phone}`; 
        }

      await this.sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
      this.logger.log(`Mensagem enviada para ${phone}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      throw new Error('Erro ao enviar mensagem de confirmação');
    }
  }

  async handleOrderStatusRequest(remoteJid: string) {
    try {
      let phone = remoteJid.split('@')[0].replace(/\D/g, '');
      if (phone.startsWith('55')) {
        phone = phone.substring(2); 
      }
      this.logger.log(`Número de telefone extraído: ${phone}`);

      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });

      if (!order) {
        this.logger.log(`Pedido não encontrado para o número: ${phone}`);
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }

      const statusMessage = `O status do seu pedido é: ${order.status}`;
      await this.sock.sendMessage(remoteJid, { text: statusMessage });
      this.logger.log(`Status do pedido enviado para ${remoteJid}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar status do pedido: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao buscar status do pedido.' });
    }
  }

  async handleOrderCancelRequest(remoteJid: string) {
    try {
      let phone = remoteJid.split('@')[0].replace(/\D/g, '');
      if (phone.startsWith('55')) {
        phone = phone.substring(2); 
      }
      this.logger.log(`Número de telefone extraído: ${phone}`);

      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });

      if (!order) {
        this.logger.log(`Pedido não encontrado para o número: ${phone}`);
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'canceled' },
      });

      const cancelMessage = `Seu pedido foi cancelado com sucesso.`;
      await this.sock.sendMessage(remoteJid, { text: cancelMessage });
      this.logger.log(`Pedido cancelado para ${remoteJid}`);
    } catch (error) {
      this.logger.error(`Erro ao cancelar pedido: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao cancelar pedido.' });
    }
  }
  
  async handleProductListRequest(remoteJid: string) {
    try {
      const products = await this.prisma.product.findMany({
        select: {
          name: true,
          price: true,
        },
      });

      if (products.length === 0) {
        await this.sock.sendMessage(remoteJid, { text: 'Nenhum produto disponível no momento.' });
        return;
      }

      const productList = products.map(product => `${product.name}: R$${product.price}`).join('\n');
      await this.sock.sendMessage(remoteJid, { text: `Produtos disponíveis:\n${productList}` });
      this.logger.log(`Lista de produtos enviada para ${remoteJid}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar lista de produtos: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao buscar lista de produtos.' });
    }
  }

  
}
