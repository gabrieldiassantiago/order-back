// addition.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Addition, Prisma } from '@prisma/client';

@Injectable()
export class AdditionService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.AdditionCreateInput): Promise<Addition> {
    if (!data.name || !data.price) {
      throw new Error('Nome e preço são obrigatórios');
    }

    return this.prisma.addition.create({
      data,
    });
  }

  async findAll(): Promise<Addition[]> {
    return this.prisma.addition.findMany();
  }

  async findOne(id: string): Promise<Addition | null> {
    return this.prisma.addition.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.AdditionUpdateInput): Promise<Addition> {
    return this.prisma.addition.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Addition> {
    return this.prisma.addition.delete({ where: { id } });
  }
}