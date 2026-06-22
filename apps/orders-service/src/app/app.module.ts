import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule, PrismaModule } from '@libs/shared';

@Module({
  imports: [AppConfigModule.forRoot('orders-service'), PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
