import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:4173'];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Controle de Ponto API')
    .setDescription('API para o sistema de controle de ponto')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticação')
    .addTag('companies', 'Empresas')
    .addTag('users', 'Usuários')
    .addTag('employees', 'Colaboradores')
    .addTag('work-schedules', 'Jornadas de Trabalho')
    .addTag('time-records', 'Registros de Ponto')
    .addTag('attendance', 'Frequência')
    .addTag('qrcode', 'QR Code')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
