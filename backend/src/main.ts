import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common'; // Adicione Logger

async function bootstrap() {
  const logger = new Logger('Bootstrap'); // Crie um logger para o bootstrap
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const port = process.env.PORT || 3000; // Boa prática usar variável de ambiente
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`); // Use o logger
}

// --- CORREÇÃO AQUI ---
bootstrap().catch((error) => {
  // Loga o erro de forma mais visível se o bootstrap falhar
  console.error('Error during application bootstrap:', error);
  // É uma boa prática sair do processo se o bootstrap falhar
  process.exit(1);
});
