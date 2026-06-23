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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly PrismaService: PrismaService,
    @Inject('KAFKA_SERVICE') private readonly KafkaClient: ClientKafka,
    private readonly I18nService: I18nService<I18nTranslations>,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, customer: customers) {
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

    this.logger.log(`Order created: ${order.id}`);

    this.KafkaClient.emit('order.created', {
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
    orderId: string,
    status: order_status,
    failureReason?: string,
  ) {
    return this.PrismaService.orders.update({
      where: { id: orderId },
      data: {
        status,
        failure_reason: failureReason,
      },
    });
  }
}
