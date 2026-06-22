import { Module } from '@nestjs/common';
import { AppConfigModule } from './config';

@Module({
  imports: [AppConfigModule],
  exports: [AppConfigModule],
})
export class SharedModule {}
