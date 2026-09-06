import { Test, TestingModule } from '@nestjs/testing';
import { PaymentSourcesController } from '../controllers/payment-sources.controller';
import { PaymentSourceService } from '../services/payment-sources.service';

const USER = { id: 'user-1' };

describe('PaymentSourcesController', () => {
  let controller: PaymentSourcesController;
  let service: jest.Mocked<
    Pick<PaymentSourceService, 'findAll' | 'create' | 'update' | 'remove'>
  >;

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentSourcesController],
      providers: [{ provide: PaymentSourceService, useValue: service }],
    }).compile();
    controller = module.get(PaymentSourcesController);
  });

  it('GET / delegates to service.findAll with the user id', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll(USER);
    expect(service.findAll).toHaveBeenCalledWith('user-1');
  });

  it('POST / delegates to service.create', async () => {
    const dto = { alias: 'visa 8943' } as any;
    service.create.mockResolvedValue({ id: 'ps-1' } as any);
    await controller.create(USER, dto);
    expect(service.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('PATCH /:id delegates to service.update', async () => {
    const dto = { alias: 'visa gold' } as any;
    service.update.mockResolvedValue({ id: 'ps-1' } as any);
    await controller.update(USER, 'ps-1', dto);
    expect(service.update).toHaveBeenCalledWith('user-1', 'ps-1', dto);
  });

  it('DELETE /:id delegates to service.remove and returns a message', async () => {
    service.remove.mockResolvedValue(undefined);
    const result = await controller.remove(USER, 'ps-1');
    expect(service.remove).toHaveBeenCalledWith('user-1', 'ps-1');
    expect(result).toEqual({ message: 'Payment source deleted' });
  });
});
