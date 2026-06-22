import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { bootstrap } from '@libs/shared';

bootstrap<AppModule>(AppModule).catch((err) => {
  Logger.error('Failed to start the application', err, 'Bootstrap');
  process.exit(1);
});
