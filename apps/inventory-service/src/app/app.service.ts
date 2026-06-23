import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaService } from '@libs/shared';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly prisma: PrismaService,
  ) {}

  async processOrder(message: any) {
    this.logger.log(`Received order.created: ${JSON.stringify(message)}`);
    const { orderId, items } = message;

    try {
      // Look up actual stock levels from the database
      const itemIds = items.map((i: any) => i.item_id);
      const dbItems = await this.prisma.items.findMany({
        where: { id: { in: itemIds } },
      });

      const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));

      // Check stock for each requested item
      const insufficientItems: string[] = [];
      for (const requestedItem of items) {
        const dbItem = dbItemMap.get(requestedItem.item_id);
        if (!dbItem) {
          insufficientItems.push(
            `Item ${requestedItem.item_id} not found in inventory`,
          );
          continue;
        }
        if (dbItem.stock < requestedItem.quantity) {
          insufficientItems.push(
            `${dbItem.name}: requested ${requestedItem.quantity}, available ${dbItem.stock}`,
          );
        }
      }

      if (insufficientItems.length > 0) {
        const reason = `Insufficient stock: ${insufficientItems.join('; ')}`;
        this.logger.warn(`Order ${orderId} failed stock check: ${reason}`);
        this.kafkaClient.emit('order.failed', { orderId, reason });
        return;
      }

      // Deduct stock for each item
      for (const requestedItem of items) {
        await this.prisma.items.update({
          where: { id: requestedItem.item_id },
          data: {
            stock: {
              decrement: requestedItem.quantity,
            },
          },
        });
      }

      this.logger.log(
        `Stock available and deducted for order ${orderId}. Confirming order...`,
      );
      this.kafkaClient.emit('order.confirmed', { orderId });
    } catch (error) {
      this.logger.error(`Error processing order ${orderId}: ${error}`);
      this.kafkaClient.emit('order.failed', {
        orderId,
        reason: 'Internal error while checking inventory',
      });
    }
  }
}
