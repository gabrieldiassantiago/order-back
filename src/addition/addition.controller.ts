// addition.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdditionService } from './addition.service';
import { Prisma } from '@prisma/client';

@Controller('addition')
export class AdditionController {
  constructor(private readonly additionService: AdditionService) {}

  @Post()
  create(@Body() createAdditionDto: Prisma.AdditionCreateInput) {
    return this.additionService.create(createAdditionDto);
  }

  @Get()
  findAll() {
    return this.additionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.additionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdditionDto: Prisma.AdditionUpdateInput) {
    return this.additionService.update(id, updateAdditionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.additionService.remove(id);
  }
}