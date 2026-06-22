import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';
import { envSchema } from './env.schema';

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(appName: string): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: envSchema,
          envFilePath: [
            '.env',
            `apps/${appName}/.env`,
          ],
        }),
      ],
      providers: [AppConfigService],
      exports: [AppConfigService],
    };
  }
}
