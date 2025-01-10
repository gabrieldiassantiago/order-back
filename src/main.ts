import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as cors from 'cors';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors());
  app.use(helmet());

  // Carregar o arquivo YAML
  const yamlDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));

  const document = SwaggerModule.createDocument(app, yamlDocument);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
