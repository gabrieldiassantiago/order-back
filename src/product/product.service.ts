import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

//tipagem do produto que será criado no banco de dados 
export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  availability: boolean;
};



@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: { name: string; price: number; stock: number; category: string; availability: boolean }) {
    const productData = {
      ...data,
      price: parseFloat(data.price as any),
      stock: parseInt(data.stock as any, 10),
    };

    return this.prisma.product.create({
      data: productData,
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany();
  }

  async getProductById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async updateProduct(id: string, data: { name?: string; description?: string; price?: number; stock?: number; imageUrl?: string; category?: string; availability?: boolean }) {
    const { id: _, ...updateData } = data as any;

    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }


  async deleteProduct(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async deleteAllProducts() {
    return this.prisma.product.deleteMany();
  }
}
