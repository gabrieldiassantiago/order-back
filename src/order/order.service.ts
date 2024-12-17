import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaileysService } from 'src/zap/zap.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baileysService: BaileysService,
  ) {}

  async createOrder(data: { productIds: string[]; address: string; paymentMethod: string; name: string; email: string; phone: string; status?: string }) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: data.productIds } },
    });

    const total = products.reduce((sum, product) => sum + product.price, 0);

    const order = await this.prisma.order.create({
      data: {
        productIds: data.productIds,
        total,
        address: data.address,
        paymentMethod: data.paymentMethod,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status || 'pendente',
      },
    });

    this.logger.log(`Pedido criado: ${JSON.stringify(order)}`);

    const orderDetails = `
      📦 *Detalhes do Pedido* 📦

      🧑‍💼 *Nome:* ${data.name}
      🏠 *Endereço:* ${data.address}
      💳 *Método de Pagamento:* ${data.paymentMethod}
      💰 *Total:* R$${total.toFixed(2)}

      🛒 *Itens do Pedido:*
      ${products.map(product => `- ${product.name}: R$${product.price.toFixed(2)}`).join('\n')}
    `;

    try {
      await this.baileysService.sendOrderConfirmation(data.phone, orderDetails);
      this.logger.log(`Mensagem de confirmação enviada para ${data.phone}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de confirmação: ${error.message}`);
    }

    return order;
  }

  async getAllOrders() {
    return this.prisma.order.findMany();
  }

  async getOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }

  async updateOrder(id: string, data: { productIds?: string[]; address?: string; paymentMethod?: string; status?: string }) {
    let total: number | undefined;

    if (data.productIds) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: data.productIds } },
      });

      total = products.reduce((sum, product) => sum + product.price, 0);
    }

    
    const updateData: any = {
      total,
      address: data.address,
      paymentMethod: data.paymentMethod,
      status: data.status,
    };

    if (data.productIds) {
      updateData.productIds = data.productIds;
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteOrder(id: string) {
    return this.prisma.order.delete({
      where: { id },
    });
  }

  async deleteAllOrders() {
    return this.prisma.order.deleteMany({});
  }

  async getOrderStatus(phone: string) {
    const order = await this.prisma.order.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' }, 
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    return `O status do seu pedido é: ${order.status}`;
  }

}
