import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppConfigModule, PrismaModule, AppI18nModule } from '@libs/shared';
import { AuthModule } from './auth/auth.module';
import * as path from 'path';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    AppConfigModule.forRoot('orders-service'),
    AppI18nModule.forRoot({
      appI18nPath: path.join(__dirname, 'i18n'),
      typesOutputPath: path.join(
        process.cwd(),
        'apps/orders-service/src/i18n/i18n-types.ts',
      ),
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
  ],
  providers: [JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
