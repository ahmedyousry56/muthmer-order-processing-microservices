import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaService } from '@libs/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly prisma: PrismaService,
  ) {}

  async processOrder(message: any) {
    this.logger.log(`Received order.created: ${JSON.stringify(message)}`);
    const { eventId, orderId, items } = message;

    // Guard: skip messages without an eventId
    if (!eventId) {
      this.logger.warn(
        `Skipping order.created without eventId for order ${orderId}`,
      );
      return;
    }

    // Idempotency check: skip if this event was already processed
    const existingEvent = await this.prisma.processed_events.findUnique({
      where: { id: eventId },
    });

    if (existingEvent) {
      this.logger.log(
        `Event ${eventId} already processed, skipping duplicate.`,
      );
      return;
    }

    try {
      // Run stock check + deduction + event record atomically
      const result = await this.prisma.$transaction(async (tx) => {
        const itemIds = items.map((i: any) => i.item_id);
        const dbItems = await tx.items.findMany({
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
          // Record the event as processed before returning failure
          await tx.processed_events.create({
            data: { id: eventId, topic: 'order.created', order_id: orderId },
          });
          return {
            outcome: 'failed' as const,
            reason: `Insufficient stock: ${insufficientItems.join('; ')}`,
          };
        }

        // Deduct stock for each item
        for (const requestedItem of items) {
          await tx.items.update({
            where: { id: requestedItem.item_id },
            data: { stock: { decrement: requestedItem.quantity } },
          });
        }

        // Record the event as processed
        await tx.processed_events.create({
          data: { id: eventId, topic: 'order.created', order_id: orderId },
        });

        return { outcome: 'confirmed' as const };
      });

      // Emit the result event outside the transaction
      if (result.outcome === 'failed') {
        this.logger.warn(
          `Order ${orderId} failed stock check: ${result.reason}`,
        );
        this.kafkaClient.emit('order.failed', {
          eventId: randomUUID(),
          orderId,
          reason: result.reason,
        });
      } else {
        this.logger.log(
          `Stock deducted for order ${orderId}. Confirming order...`,
        );
        this.kafkaClient.emit('order.confirmed', {
          eventId: randomUUID(),
          orderId,
        });
      }
    } catch (error) {
      this.logger.error(`Error processing order ${orderId}: ${error}`);
      this.kafkaClient.emit('order.failed', {
        eventId: randomUUID(),
        orderId,
        reason: 'Internal error while checking inventory',
      });
    }
  }
}
