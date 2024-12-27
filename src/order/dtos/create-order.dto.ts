import { IsArray, IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Define a DTO para os extras
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

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];

  @IsString()
  address: string;

  @IsString()
  paymentMethod: string;

  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  status?: 'PENDENTE' | 'PREPARANDO' | 'ENVIADO' | 'CANCELADO';


  @IsOptional()
  @IsNumber()
  changeFor?: number;
  
  @IsString()
  deliveryMethod: string;

  @IsString()
  @IsOptional()
  neighborhoodId?: string;
}