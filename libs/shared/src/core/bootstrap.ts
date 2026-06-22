import { Logger, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from '../lib/config';

export async function bootstrap<T = any>(AppModule: Type<T>) {
  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);
  const globalPrefix = appConfigService.app.prefix;
  app.setGlobalPrefix(globalPrefix);
  const port = appConfigService.app.port;
  await app.listen(port);
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}
