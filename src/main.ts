import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cors from 'cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do CORS para permitir solicitações de qualquer origem
  app.use(cors());

  const config = new DocumentBuilder()
    .setTitle('API de Pedidos')
    .setDescription('Documentação da API de Pedidos')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
}
bootstrap();
