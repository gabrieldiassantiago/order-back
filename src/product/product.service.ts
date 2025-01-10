import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


interface Product {
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  availability: boolean;
  additionIds?: string[];
}


@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(data: Product) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        availability: data.availability,
        category: {
          connect: {
            id: data.categoryId,
          },
        },
        additions: {
          connect: data.additionIds?.map((id) => ({ id })),
        },
      },
    });
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

  async getProductById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  async updateProduct(id: string, data: Product) {
    const updateData: any = {
      name: data.name,
      price: data.price,
      stock: data.stock,
      availability: data.availability,
    };
    
    if (data.categoryId) {
      updateData.category = {
        connect: {
          id: data.categoryId,
        },
      };
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