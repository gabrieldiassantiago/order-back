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
      if (!productOrder) return sum;

      const productTotal = product.price * productOrder.quantity;
      const additionsTotal = productOrder.additions?.reduce((addSum, addition) => addSum + addition.price, 0) || 0;
      return sum + productTotal + additionsTotal;
    }, 0) + (neighborhood ? neighborhood.value : 0);

    const order = await this.prisma.order.create({
      data: {
        products: {
          create: data.products.map(product => ({
            productId: product.productId,
            quantity: product.quantity,
            additions: {
              create: product.additions?.map(addition => ({
                additionId: addition.additionId,
                price: addition.price,
              })) || [],
            },
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
        changeFor: data.changeFor || null,
      },
      include: {
        products: {
          include: {
            product: true,
            additions: {
              include: {
                addition: true,
              },
            },
          },
        },
      },
    });

    this.ordersGateway.emitOrderUpdate(order);

    this.logger.log(`Pedido criado: ${JSON.stringify(order)}`);

    const orderDetails = `
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━📦 *Detalhes do Pedido* 📦━━━━━━━━━━━━━━━━━━━━━━━━━┓

    🧑‍💼 *Nome:* ${data.name}
    🏠 *Endereço:* ${data.address}
    ${neighborhood ? `🏘️ *Bairro:* ${neighborhood.name}` : ''}
    💳 *Método de Pagamento:* ${data.paymentMethod}
    🚚 *Método de Entrega:* ${data.deliveryMethod}
    ${data.changeFor ? `💵 *Troco para:* R$${data.changeFor.toFixed(2)}` : ''}
    💰 *Total:* R$${total.toFixed(2)}

    🛒 *Itens do Pedido:*
    ${products.map(product => {
      const productOrder = order.products.find(p => p.productId === product.id);
      const additionsDetails = productOrder?.additions?.map(addition => `  - ${addition.addition.name} (R$${addition.price.toFixed(2)})`).join('\n') || '';
      return `- ${product.name} (x${productOrder ? productOrder.quantity : 0}): R$${(product.price * (productOrder ? productOrder.quantity : 0)).toFixed(2)}\n${additionsDetails}`
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

    let total: number | undefined;
    let updateMessage = 'Seu pedido foi atualizado. Alterações:\n';

    if (data.products) {
      const productIds = data.products.map(p => p.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      total = products.reduce((sum, product) => {
        const productOrder = data.products.find(p => p.productId === product.id);
        return sum + product.price * (productOrder ? productOrder.quantity : 0);
      }, 0);

      updateMessage += `🔄 Produtos atualizados.\n`;
    }

    if (data.neighborhoodId) {
      const neighborhood = await this.prisma.entregasBairros.findUnique({
        where: { id: data.neighborhoodId },
      });
      

      if (!neighborhood) {
        throw new Error('Bairro não encontrado');
      }
      

      total = (total || existingOrder.total) + neighborhood.value;
      updateMessage += `🏘️ Bairro atualizado.\n`;
    }

    const updateData: any = {
      total,
      name: data.name || existingOrder.name,
      phone: data.phone || existingOrder.phone,
      address: data.address || existingOrder.address,
      neighborhoodId: data.neighborhoodId || existingOrder.neighborhoodId,
      paymentMethod: data.paymentMethod || existingOrder.paymentMethod,
      deliveryMethod: data.deliveryMethod || existingOrder.deliveryMethod,
      status: data.status || existingOrder.status,
    };

    if (data.address) updateMessage += `🏠 Endereço atualizado.\n`;
    if (data.paymentMethod) updateMessage += `💳 Método de pagamento atualizado.\n`;
    if (data.deliveryMethod) updateMessage += `🚚 Método de entrega atualizado.\n`;
    if (data.status) updateMessage += `🔔 Status atualizado para ${data.status}.\n`;

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

    try {
      await this.baileysService.sendOrderConfirmation(order.phone, updateMessage);
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

    await this.prisma.productOrder.deleteMany({
      where: { orderId: id },
    });

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

    this.ordersGateway.emitOrderUpdate(order);

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
    include: {
      products: {
        include: {
          product: true,
          additions: {
            include: {
              addition: true,
            },
          },
        },
      },
    },
  });

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    
  const productOrders = await this.prisma.productOrder.findMany({
    where: { orderId: order.id },
    include: {
      product: true,
      additions: {
        include: {
          addition: true,
        },
      },
    },
  });


    const neighborhood = order.neighborhoodId ? await this.prisma.entregasBairros.findUnique({
      where: { id: order.neighborhoodId },
    }) : null;
  

    return { ...order, products: productOrders, neighborhood };
  }

  async deleteAllOrders() {
    try {
      await this.prisma.productOrder.deleteMany({});

      const deletedOrders = await this.prisma.order.deleteMany({});

      this.logger.log(`Todos os pedidos foram deletados com sucesso.`);
      return deletedOrders;
    } catch (error) {
      this.logger.error(`Erro ao deletar todos os pedidos: ${error.message}`);
      throw new Error('Erro ao deletar todos os pedidos');
    }
  }

   async getOrderStatus(phone: string) {
    const orders = await this.prisma.order.findMany({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      include: { products: { include: { product: true } } },
    });

    if (!orders.length) {
      throw new Error('Pedido não encontrado');
    }

    return orders;
  }
}