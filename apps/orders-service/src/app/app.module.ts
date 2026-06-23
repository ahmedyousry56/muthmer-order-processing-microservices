import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule, PrismaModule, AppI18nModule } from '@libs/shared';
import { AuthModule } from './auth/auth.module';
import * as path from 'path';

@Module({
  imports: [
    AppConfigModule.forRoot('orders-service'),
    PrismaModule,
    AuthModule,
    AppI18nModule.forRoot({
      appI18nPath: path.join(__dirname, 'i18n'),
      typesOutputPath: path.join(
        process.cwd(),
        'apps/orders-service/src/i18n/i18n-types.ts',
      ),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
