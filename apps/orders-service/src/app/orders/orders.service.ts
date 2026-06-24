import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@libs/shared';
import { ClientKafka } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { customers, order_status } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../../i18n/i18n-types';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly PrismaService: PrismaService,
    @Inject('KAFKA_SERVICE') private readonly KafkaClient: ClientKafka,
    private readonly I18nService: I18nService<I18nTranslations>,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    customer: customers,
    idempotencyKey: string,
  ) {
    // REST-level idempotency: if a key was provided, check if we already processed it
    if (idempotencyKey) {
      const existingEvent =
        await this.PrismaService.processed_events.findUnique({
          where: { id: idempotencyKey },
        });

      if (existingEvent && existingEvent.order_id) {
        this.logger.log(
          `Idempotency key ${idempotencyKey} already used, returning existing order.`,
        );
        return this.getOrder(existingEvent.order_id);
      }
    }

    const itemIds = createOrderDto.items.map((i) => i.item_id);
    const dbItems = await this.PrismaService.items.findMany({
      where: { id: { in: itemIds } },
    });

    const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));
    const missingItems = itemIds.filter((id) => !dbItemMap.has(id));
    if (missingItems.length > 0) {
      throw new BadRequestException(
        this.I18nService.t('orders.items_not_found', {
          args: { missingItems: missingItems.join(', ') },
        }),
      );
    }

    const orderItemsData = createOrderDto.items.map((reqItem) => {
      const dbItem = dbItemMap.get(reqItem.item_id)!;
      return {
        item_id: reqItem.item_id,
        quantity: reqItem.quantity,
        unit_price: dbItem.price,
      };
    });

    const order = await this.PrismaService.orders.create({
      data: {
        customer_id: customer.id,
        status: order_status.PENDING,
        order_items: {
          create: orderItemsData,
        },
      },
      include: {
        order_items: true,
      },
    });

    // Record the idempotency key so the same request won't create another order
    if (idempotencyKey) {
      await this.PrismaService.processed_events.create({
        data: {
          id: idempotencyKey,
          topic: 'order.create.rest',
          order_id: order.id,
        },
      });
    }

    this.logger.log(`Order created: ${order.id}`);

    const eventId = randomUUID();
    this.KafkaClient.emit('order.created', {
      eventId,
      orderId: order.id,
      customerId: order.customer_id,
      items: order.order_items.map((oi) => ({
        item_id: oi.item_id,
        quantity: oi.quantity,
      })),
    });

    return order;
  }

  async getOrder(id: string) {
    const order = await this.PrismaService.orders.findUnique({
      where: { id },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException(
        this.I18nService.t('orders.order_not_found', {
          args: { id },
        }),
      );
    }

    return order;
  }

  async updateOrderStatus(
    eventId: string,
    orderId: string,
    status: order_status,
    failureReason?: string,
  ) {
    // Guard: skip if no eventId
    if (!eventId) {
      this.logger.warn(
        `Skipping status update without eventId for order ${orderId}`,
      );
      return;
    }

    // Idempotency check
    const existingEvent = await this.PrismaService.processed_events.findUnique({
      where: { id: eventId },
    });

    if (existingEvent) {
      this.logger.log(
        `Event ${eventId} already processed, skipping duplicate.`,
      );
      return;
    }

    // Atomically update order status and record the event
    const [updatedOrder] = await this.PrismaService.$transaction([
      this.PrismaService.orders.update({
        where: { id: orderId },
        data: {
          status,
          failure_reason: failureReason,
        },
      }),
      this.PrismaService.processed_events.create({
        data: {
          id: eventId,
          topic:
            status === order_status.CONFIRMED
              ? 'order.confirmed'
              : 'order.failed',
          order_id: orderId,
        },
      }),
    ]);

    this.logger.log(`Order ${orderId} status updated to ${status}`);
    return updatedOrder;
  }
}
