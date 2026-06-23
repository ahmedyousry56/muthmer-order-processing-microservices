import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() message: any) {
    return this.appService.processOrder(message);
  }
}
