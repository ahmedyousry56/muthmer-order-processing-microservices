import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppConfigService } from '@libs/shared';

async function bootstrap() {
  // Create a temporary app context to access AppConfigService
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(AppConfigService);

  const broker = configService.kafka.broker;
  const groupId = configService.kafka.inventoryGroupId;

  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [broker],
          allowAutoTopicCreation: true,
        },
        consumer: {
          groupId,
          allowAutoTopicCreation: true,
          sessionTimeout: 30000,
          heartbeatInterval: 3000,
          rebalanceTimeout: 60000,
        },
      },
    },
  );

  await app.listen();
  Logger.log(
    `Inventory Service is running via Kafka (broker: ${broker}, group: ${groupId})`,
  );
}

bootstrap().catch((err) => {
  Logger.error('Failed to start the application', err, 'Bootstrap');
  process.exit(1);
});
