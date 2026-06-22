import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from '@libs/shared';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);
  const globalPrefix = appConfigService.app.prefix;
  app.setGlobalPrefix(globalPrefix);
  const port = appConfigService.app.port;
  await app.listen(port);
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start the application', err, 'Bootstrap');
  process.exit(1);
});
