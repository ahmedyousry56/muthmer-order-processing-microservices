import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ExistsConstraint } from '../validators/exists.validator';

@Global()
@Module({
  providers: [PrismaService, ExistsConstraint],
  exports: [PrismaService, ExistsConstraint],
})
export class PrismaModule {}
