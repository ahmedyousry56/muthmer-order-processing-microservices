import { HttpStatus, Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';
import { AppConfigService } from '@libs/shared';
import { I18nValidationPipe } from 'nestjs-i18n';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);
  const globalPrefix = appConfigService.app.prefix;
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      stopAtFirstError: false,
    }),
  );
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle('Muthmer Order Processing API')
    .setDescription('Muthmer Order Processing API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Orders')
    .addGlobalParameters({
      name: 'x-custom-lang',
      in: 'header',
      required: false,
      schema: { type: 'string', default: 'en' },
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory);

  const port = appConfigService.app.port;

  app.connectMicroservice(
    appConfigService.getKafkaMicroserviceOptions(
      appConfigService.kafka.ordersGroupId,
    ),
  );

  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start the application', err, 'Bootstrap');
  process.exit(1);
});
