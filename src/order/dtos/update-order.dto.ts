import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsArray()
  @IsOptional()
  products?: {
    productId: string;
    quantity: number;
  }[];

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
  status?: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  
  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsString()
  @IsOptional()
  neighborhoodId?: string;
}