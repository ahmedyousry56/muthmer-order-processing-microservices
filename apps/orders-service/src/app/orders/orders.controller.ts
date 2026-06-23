import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { order_status } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly OrdersService: OrdersService) {}

  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Creates a new order with PENDING status and publishes an order.created event to Kafka. Use X-Idempotency-Key header to prevent duplicate orders.',
  })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    description:
      'Unique key to prevent duplicate order creation. Send the same key to get the same order back.',
    required: false,
  })
  @Post()
  @UseGuards(AuthGuard)
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: RequestWithUser,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.OrdersService.createOrder(
      createOrderDto,
      req.user,
      idempotencyKey,
    );
  }

  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Returns the order with its current status and order items',
  })
  @Get(':id')
  @UseGuards(AuthGuard)
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.OrdersService.getOrder(id);
  }

  @EventPattern('order.confirmed')
  async handleOrderConfirmed(@Payload() message: any) {
    const { eventId, orderId } = message;
    await this.OrdersService.updateOrderStatus(
      eventId,
      orderId,
      order_status.CONFIRMED,
    );
  }

  @EventPattern('order.failed')
  async handleOrderFailed(@Payload() message: any) {
    const { eventId, orderId, reason } = message;
    await this.OrdersService.updateOrderStatus(
      eventId,
      orderId,
      order_status.FAILED,
      reason,
    );
  }
}
