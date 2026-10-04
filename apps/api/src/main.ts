import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

function validateSecrets(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaults = {
    JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
    VIDEO_TOKEN_SECRET: 'change-in-production',
    VIDEO_WATERMARK_HMAC_SECRET: 'change-in-production',
  };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = process.env[key];
    if (!value || value === defaultValue) {
      const msg = `❌ SECURITY ERROR: ${key} is not set or uses default value. Refusing to start.`;
      if (isProduction) {
        console.error(msg);
        process.exit(1);
      } else {
        console.warn(`⚠️  ${msg} (allowed in development)`);
      }
    }
  }
}

async function bootstrap() {
  validateSecrets();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Health endpoints
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API is running on http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
  console.log(`🔌 Ready: http://localhost:${port}/api/ready`);
}

bootstrap();
