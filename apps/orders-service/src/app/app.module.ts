import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from '@libs/shared';

@Module({
  imports: [AppConfigModule.forRoot('orders-service')],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
