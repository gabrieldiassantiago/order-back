import { IsArray, IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Define a DTO para os acréscimos
class AdditionDto {
  @ApiProperty({ description: 'ID do acréscimo' })
  @IsString()
  additionId: string;

  @ApiProperty({ description: 'Preço do acréscimo' })
  @IsNumber()
  price: number;
}

// Atualize a estrutura dos produtos para incluir os acréscimos
class ProductDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantidade do produto' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Acréscimos do produto', type: [AdditionDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionDto)
  @IsOptional()
  additions?: AdditionDto[];
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Array de produtos do pedido', type: [ProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];

  @ApiProperty({ description: 'Endereço de entrega' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Método de pagamento' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Nome do cliente' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Telefone do cliente' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Status do pedido', default: 'PENDENTE', required: false })
  @IsString()
  @IsOptional()
  status?: 'PENDENTE' | 'PREPARANDO' | 'ENVIADO' | 'CANCELADO';

  @ApiProperty({ description: 'Troco para determinado valor', required: false })
  @IsOptional()
  @IsNumber()
  changeFor?: number;

  @ApiProperty({ description: 'Método de entrega' })
  @IsString()
  deliveryMethod: string;

  @ApiProperty({ description: 'ID do bairro para entrega', required: false })
  @IsString()
  @IsOptional()
  neighborhoodId?: string;
}
