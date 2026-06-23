import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppConfigService } from '@libs/shared';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'orders',
              brokers: [config.kafka.broker],
              allowAutoTopicCreation: true,
            },
            consumer: {
              groupId: config.kafka.ordersGroupId,
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
