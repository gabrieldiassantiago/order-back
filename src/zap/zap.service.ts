import { Injectable, Logger } from '@nestjs/common';
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BaileysService {
  private readonly logger = new Logger(BaileysService.name);
  private sock: any;
  private awaitingNewAddress: { [key: string]: boolean } = {}; // Adiciona esta variável

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.initialize();
  }
  async initialize() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
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
      
      // Ignore mensagens enviadas pelo próprio bot
      if (msg.key.fromMe) {
        return;
      }
  
      const remoteJid = msg.key.remoteJid;
      const text = msg.message?.conversation?.toLowerCase();
  
      if (this.awaitingNewAddress[remoteJid]) {
        // Se está aguardando um novo endereço, atualiza o endereço e encerra o fluxo
        await this.handleOrderAddressUpdate(remoteJid, text);
        this.awaitingNewAddress[remoteJid] = false;
      } else {
        // Caso contrário, trata outras mensagens normalmente
        if (text === 'quero acompanhar meu pedido') {
          await this.handleOrderStatusRequest(remoteJid);
        } else if (text === 'quero cancelar meu pedido') {
          await this.handleOrderCancelRequest(remoteJid);
        } else if (text === '/produtos') {
          await this.handleProductListRequest(remoteJid);
        } else if (text === '/alterarendereco') {
          await this.handleAddressChangeRequest(remoteJid);
        }
      }
    });
  }
  async handleAddressChangeRequest(remoteJid: string) {
    try {
      let phone = remoteJid.split('@')[0].replace(/\D/g, '');
      if (phone.startsWith('55')) {
        phone = phone.substring(2); 
      }
  
      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });
  
      if (!order) {
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }
  
      // Envia o endereço atual e solicita um novo endereço
      const currentAddressMessage = `Seu endereço atual é: ${order.address}. Por favor, insira o novo endereço.`;
      await this.sock.sendMessage(remoteJid, { text: currentAddressMessage });
  
      // Marca que está aguardando um novo endereço deste usuário
      this.awaitingNewAddress[remoteJid] = true;
    } catch (error) {
      this.logger.error(`Erro ao buscar endereço atual: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao buscar endereço atual.' });
    }
  }



  async sendOrderConfirmation(phone: string, message: string) {
    try {
      // Remover caracteres não numéricos
      phone = phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
         phone = `55${phone}`; 
        }

      await this.sock.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
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

      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });

      if (!order) {
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }

      const statusMessage = `O status do seu pedido é: ${order.status}`;
      await this.sock.sendMessage(remoteJid, { text: statusMessage });
    } catch (error) {
      this.logger.error(`Erro ao buscar status do pedido: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao buscar status do pedido.' });
    }
  }

  //funcao para atualizar endereco do pedido no banco de dados 
  async handleOrderAddressUpdate(remoteJid: string, address: string) {
    try {
      let phone = remoteJid.split('@')[0].replace(/\D/g, '');
      if (phone.startsWith('55')) {
        phone = phone.substring(2); 
      }

      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });

      if (!order) {
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { address: address },
      });

      const updateMessage = `Seu endereço foi atualizado com sucesso.`;
      await this.sock.sendMessage(remoteJid, { text: updateMessage });
    } catch (error) {
      this.logger.error(`Erro ao atualizar endereço do pedido: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao atualizar endereço do pedido.' });
    }
  }

  async handleOrderCancelRequest(remoteJid: string) {
    try {
      let phone = remoteJid.split('@')[0].replace(/\D/g, '');
      if (phone.startsWith('55')) {
        phone = phone.substring(2); 
      }

      const order = await this.prisma.order.findFirst({
        where: { phone }, 
        orderBy: { createdAt: 'desc' }, 
      });

      if (!order) {
        await this.sock.sendMessage(remoteJid, { text: 'Pedido não encontrado.' });
        return;
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELADO' },
      });

      const cancelMessage = `Seu pedido foi cancelado com sucesso.`;
      await this.sock.sendMessage(remoteJid, { text: cancelMessage });
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
    } catch (error) {
      this.logger.error(`Erro ao buscar lista de produtos: ${error.message}`);
      await this.sock.sendMessage(remoteJid, { text: 'Erro ao buscar lista de produtos.' });
    }
  }
}
