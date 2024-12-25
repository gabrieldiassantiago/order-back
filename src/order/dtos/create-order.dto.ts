import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsArray()
  products: {
    productId: string;
    quantity: number;
  }[];

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

  @IsString()
  deliveryMethod: string;

  @IsString()
  @IsOptional()
  neighborhoodId?: string;
}