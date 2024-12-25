import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaileysService } from 'src/zap/zap.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrdersGateway } from './order.gateway';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly baileysService: BaileysService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async createOrder(data: CreateOrderDto) {
    if (data.products.length === 0) {
      throw new Error('No products provided');
    }

    const productIds = data.products.map(product => product.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let neighborhood;
    if (data.neighborhoodId) {
      neighborhood = await this.prisma.entregasBairros.findUnique({
        where: { id: data.neighborhoodId },
      });

      if (!neighborhood) {
        throw new Error('Bairro não encontrado');
      }
    }

    const total = products.reduce((sum, product) => {
      const productOrder = data.products.find(p => p.productId === product.id);
      return sum + product.price * (productOrder ? productOrder.quantity : 0);
    }, 0) + (neighborhood ? neighborhood.value : 0);

    const order = await this.prisma.order.create({
      data: {
        products: {
          create: data.products.map(product => ({
            productId: product.productId,
            quantity: product.quantity,
          })),
        },
        total,
        address: data.address,
        neighborhoodId: data.neighborhoodId,
        paymentMethod: data.paymentMethod,
        name: data.name,
        phone: data.phone,
        deliveryMethod: data.deliveryMethod,
        status: data.status || OrderStatus.PENDENTE,
      },
      include: {
        products: true,
      },
    });

    this.ordersGateway.emitOrderUpdate(order); // Emitir evento de atualização de pedido

    this.logger.log(`Pedido criado: ${JSON.stringify(order)}`);

    const orderDetails = `
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━📦 *Detalhes do Pedido* 📦━━━━━━━━━━━━━━━━━━━━━━━━━┓

    🧑‍💼 *Nome:* ${data.name}
    🏠 *Endereço:* ${data.address}
    ${neighborhood ? `🏘️ *Bairro:* ${neighborhood.name}` : ''}
    💳 *Método de Pagamento:* ${data.paymentMethod}
    🚚 *Método de Entrega:* ${data.deliveryMethod}
    💰 *Total:* R$${total.toFixed(2)}

    🛒 *Itens do Pedido:*
    ${products.map(product => {
      const productOrder = order.products.find(p => p.productId === product.id);
      return `- ${product.name} (x${productOrder ? productOrder.quantity : 0}): R$${(product.price * (productOrder ? productOrder.quantity : 0)).toFixed(2)}`
    }).join('\n')}

    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    🔔 *Status do Pedido:* ${data.status || 'PENDENTE'}

    📅 *Data do Pedido:* ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
    🕒 *Hora do Pedido:* ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

    Muito obrigado por sua compra!
    Caso tenha alguma dúvida, entre em contato conosco.

    📞 *Telefone de Contato:* (xx) xxxx-xxxx
    📧 *Email de Contato:* suporte@empresa.com

    Esperamos que aproveite seu pedido!
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

    try {
      await this.baileysService.sendOrderConfirmation(data.phone, orderDetails);
      this.logger.log(`Mensagem de confirmação enviada para ${data.phone}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de confirmação: ${error.message}`);
    }

    return order;
  }

  async updateOrder(id: string, data: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!existingOrder) {
      throw new Error('Pedido não encontrado');
    }

    if (existingOrder.status === 'CANCELADO') {
      throw new Error('Não é possível alterar o status de um pedido confirmado ou cancelado');
    }

    let total: number | undefined;

    if (data.products) {
      const productIds = data.products.map(p => p.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      total = products.reduce((sum, product) => {
        const productOrder = data.products.find(p => p.productId === product.id);
        return sum + product.price * (productOrder ? productOrder.quantity : 0);
      }, 0);
    }

    if (data.neighborhoodId) {
      const neighborhood = await this.prisma.entregasBairros.findUnique({
        where: { id: data.neighborhoodId },
      });

      if (!neighborhood) {
        throw new Error('Bairro não encontrado');
      }

      total = (total || existingOrder.total) + neighborhood.value;
    }

    const updateData: any = {
      total,
      address: data.address,
      neighborhoodId: data.neighborhoodId,
      paymentMethod: data.paymentMethod,
      deliveryMethod: data.deliveryMethod,
      status: data.status,
    };

    if (data.products) {
      updateData.products = {
        deleteMany: {},
        create: data.products.map(product => ({
          productId: product.productId,
          quantity: product.quantity,
        })),
      };
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { products: true },
    });

    this.logger.log(`Pedido atualizado: ${JSON.stringify(order)}`);

    const statusMessage = `O status do seu pedido foi atualizado para: ${data.status}`;
    try {
      await this.baileysService.sendOrderConfirmation(order.phone, statusMessage);
      this.logger.log(`Mensagem de atualização enviada para ${order.phone}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de atualização: ${error.message}`);
    }
    this.ordersGateway.emitOrderUpdate(order);

    return order;
  }

  async deleteOrder(id: string) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!existingOrder) {
      throw new Error('Pedido não encontrado');
    }

    // Deleta todas as relações ProductOrder primeiro
    await this.prisma.productOrder.deleteMany({
      where: { orderId: id },
    });

    // Agora deleta o pedido
    const order = await this.prisma.order.delete({
      where: { id },
      include: { products: true },
    });

    const cancelMessage = `Seu pedido foi cancelado com sucesso.`;
    try {
      await this.baileysService.sendOrderConfirmation(order.phone, cancelMessage);
      this.logger.log(`Mensagem de cancelamento enviada para ${order.phone}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de cancelamento: ${error.message}`);
    }

    this.ordersGateway.emitOrderUpdate(order); // Emitir evento de atualização de pedido

    return order;
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: { products: true },
    });
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const productOrders = await this.prisma.productOrder.findMany({
          where: { orderId: order.id },
          include: { product: true },
        });
        const neighborhood = order.neighborhoodId ? await this.prisma.entregasBairros.findUnique({
          where: { id: order.neighborhoodId },
        }) : null;
        return { ...order, products: productOrders, neighborhood };
      })
    );
    return ordersWithProducts;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    const productOrders = await this.prisma.productOrder.findMany({
      where: { orderId: order.id },
      include: { product: true },
    });

    const neighborhood = order.neighborhoodId ? await this.prisma.entregasBairros.findUnique({
      where: { id: order.neighborhoodId },
    }) : null;

    return { ...order, products: productOrders, neighborhood };
  }

  // Deletar todos os pedidos
  async deleteAllOrders() {
    try {
      // Deleta todas as relações ProductOrder primeiro
      await this.prisma.productOrder.deleteMany({});

      // Agora deleta todos os pedidos
      const deletedOrders = await this.prisma.order.deleteMany({});

      this.logger.log(`Todos os pedidos foram deletados com sucesso.`);
      return deletedOrders;
    } catch (error) {
      this.logger.error(`Erro ao deletar todos os pedidos: ${error.message}`);
      throw new Error('Erro ao deletar todos os pedidos');
    }
  }

  async getOrderStatus(phone: string) {
    const order = await this.prisma.order.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      include: { products: true },
    });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    return `O status do seu pedido é: ${order.status}`;
  }
}