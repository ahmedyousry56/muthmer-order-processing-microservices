import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            processOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('handleOrderCreated', () => {
    it('should call processOrder on AppService', async () => {
      const message = { eventId: '123', orderId: '456', items: [] };
      await appController.handleOrderCreated(message);
      expect(appService.processOrder).toHaveBeenCalledWith(message);
    });
  });
});
