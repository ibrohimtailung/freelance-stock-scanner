import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`🚀 FreelanceBot running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  Logger.error('Bootstrap failed', err);
  process.exit(1);
});
