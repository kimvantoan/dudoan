import * as dotenv from 'dotenv';
// Load .env variables before anything else
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Kích hoạt CORS để Next.js Frontend gọi được API
  app.enableCors({
    origin: true, // Cho phép tất cả origin hoặc chỉ định cụ thể url frontend
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS Backend is running on: http://localhost:${port}`);
}
bootstrap();
