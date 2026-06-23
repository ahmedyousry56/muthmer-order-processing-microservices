import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class AppConfigService {
  constructor(private ConfigService: ConfigService<EnvConfig, true>) {}

  get app() {
    return {
      port: this.ConfigService.get('PORT', 8000),
      isProduction:
        this.ConfigService.get('NODE_ENV', 'development') === 'production',
      prefix: this.ConfigService.get('API_PREFIX', 'api'),
    };
  }

  get jwt() {
    return {
      secret: this.ConfigService.get('JWT_SECRET', 'super-secret-key'),
      cookieName: this.ConfigService.get(
        'JWT_COOKIE_NAME',
        'muthmer_access_token',
      ),
    };
  }

  get bcrypt() {
    return {
      saltRound: this.ConfigService.get('BCRYPT_SALT_ROUNDS', 10),
    };
  }

  get kafka() {
    return {
      broker: this.ConfigService.get('KAFKA_BROKER', 'localhost:9092'),
      ordersGroupId: this.ConfigService.get(
        'KAFKA_ORDERS_GROUP',
        'orders-consumer-group',
      ),
      inventoryGroupId: this.ConfigService.get(
        'KAFKA_INVENTORY_GROUP',
        'inventory-consumer-group',
      ),
      clientAllowAutoTopicCreation: this.ConfigService.get(
        'KAFKA_CLIENT_ALLOW_AUTO_TOPIC_CREATION',
        true,
      ),
      consumerAllowAutoTopicCreation: this.ConfigService.get(
        'KAFKA_CONSUMER_ALLOW_AUTO_TOPIC_CREATION',
        true,
      ),
      retryInitialRetryTime: this.ConfigService.get(
        'KAFKA_RETRY_INITIAL_RETRY_TIME',
        300,
      ),
      retryRetries: this.ConfigService.get('KAFKA_RETRY_RETRIES', 5),
      sessionTimeout: this.ConfigService.get('KAFKA_SESSION_TIMEOUT', 30000),
      heartbeatInterval: this.ConfigService.get(
        'KAFKA_HEARTBEAT_INTERVAL',
        3000,
      ),
      rebalanceTimeout: this.ConfigService.get(
        'KAFKA_REBALANCE_TIMEOUT',
        60000,
      ),
    };
  }

  getKafkaMicroserviceOptions(groupId: string): MicroserviceOptions {
    return {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [this.kafka.broker],
          allowAutoTopicCreation: this.kafka.clientAllowAutoTopicCreation,
          retry: {
            initialRetryTime: this.kafka.retryInitialRetryTime,
            retries: this.kafka.retryRetries,
          },
        },
        consumer: {
          groupId,
          allowAutoTopicCreation: this.kafka.consumerAllowAutoTopicCreation,
          sessionTimeout: this.kafka.sessionTimeout,
          heartbeatInterval: this.kafka.heartbeatInterval,
          rebalanceTimeout: this.kafka.rebalanceTimeout,
        },
      },
    };
  }
}
