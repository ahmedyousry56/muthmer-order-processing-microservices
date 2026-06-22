import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`; // forces an actual connection attempt
      this.logger.log('✅ SQL Database connected successfully');
    } catch (err) {
      this.logger.error('❌ Failed to connect to the SQL database', err);
      process.exit(1);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
      .then(() => this.logger.log('✅ SQL Database connection closed'))
      .catch((err: Error) =>
        this.logger.error(
          '❌ Error while disconnecting from the SQL database',
          err,
        ),
      );
  }

  get client(): PrismaClient {
    return this;
  }
}
