import { IsArray, IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Define o DTO para os extras
class ExtraDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}

// Atualize a estrutura dos produtos para incluir os extras
class ProductDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraDto)
  @IsOptional()
  extras?: ExtraDto[];
}

export class UpdateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  @IsOptional()
  products?: ProductDto[];

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  status?: 'PENDENTE' | 'PREPARANDO' | 'ENVIADO' | 'CANCELADO';
  
  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsString()
  @IsOptional()
  neighborhoodId?: string;
}