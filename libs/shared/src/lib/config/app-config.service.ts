import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private ConfigService: ConfigService<EnvConfig, true>) {}

  get app() {
    return {
      port: this.ConfigService.get('PORT', 8000),
      isProduction: this.ConfigService.get('NODE_ENV', 'development') === 'production',
      prefix: this.ConfigService.get('API_PREFIX', 'api'),
    };
  }
}
