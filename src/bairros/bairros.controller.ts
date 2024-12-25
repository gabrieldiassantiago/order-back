import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { entregasBairrosService } from './bairros.service';

@Controller('neighborhoods')
export class NeighborhoodController {
  constructor(private readonly entregasBairrosService: entregasBairrosService) {}

  @Post()
  async createNeighborhood(@Body() body) {
    return this.entregasBairrosService.createentregasBairros(body);
  }

  @Get()
  async getAllNeighborhoods() {
    return this.entregasBairrosService.getAllentregasBairross();
  }

  @Get(':id')
  async getNeighborhoodById(@Param('id') id: string) {
    return this.entregasBairrosService.getentregasBairrosById(id);
  }

  @Put(':id')
  async updateNeighborhood(@Param('id') id: string, @Body() body) {
    return this.entregasBairrosService.updateentregasBairros(id, body);
  }

  @Delete(':id')
  async deleteNeighborhood(@Param('id') id: string) {
    return this.entregasBairrosService.deleteentregasBairros(id);
  }

  @Delete()
  async deleteAllNeighborhoods() {
    return this.entregasBairrosService.deleteAllentregasBairross();
  }
}
