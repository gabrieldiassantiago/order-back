import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(@Body() body: { name: string }) {
    return this.categoryService.createCategory(body);
  }

  @Get()
  async getAllCategories() {
    return this.categoryService.getAllCategories();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoryService.getCategoryById(id);
  }

  @Put(':id')
  async updateCategory(@Param('id') id: string, @Body() body: { name: string }) {
    return this.categoryService.updateCategory(id, body);
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }

    @Delete()
    async deleteAllCategories() {
    return this.categoryService.deleteAllCategories();
    }
    
}