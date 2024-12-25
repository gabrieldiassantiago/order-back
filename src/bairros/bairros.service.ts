import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class entregasBairrosService {
  constructor(private readonly prisma: PrismaService) {}

  async createentregasBairros(data: { name: string; value: number }) {
    return this.prisma.entregasBairros.create({
      data,
    });
  }

  async getAllentregasBairross() {
    return this.prisma.entregasBairros.findMany();
  }

  async getentregasBairrosById(id: string) {
    return this.prisma.entregasBairros.findUnique({
      where: { id },
    });
  }

  async updateentregasBairros(id: string, data: { name?: string; value?: number }) {
    return this.prisma.entregasBairros.update({
      where: { id },
      data,
    });
  }

  async deleteentregasBairros(id: string) {
    return this.prisma.entregasBairros.delete({
      where: { id },
    });
  }

  async deleteAllentregasBairross() {
    return this.prisma.entregasBairros.deleteMany();
  }
}
