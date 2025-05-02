import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin:
      process.env.ENV === 'prod'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
