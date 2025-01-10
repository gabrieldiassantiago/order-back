import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(data: { name: string }) {
    return this.prisma.category.create({
      data,
    });
  }

  async getAllCategories() {
    return this.prisma.category.findMany();
  }


  async getCategoryById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async updateCategory(id: string, data: { name: string }) {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
 async deleteAllCategories() {
    return this.prisma.category.deleteMany();
  }
  
}