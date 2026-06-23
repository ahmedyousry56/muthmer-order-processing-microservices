import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';

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
    };
  }
}
