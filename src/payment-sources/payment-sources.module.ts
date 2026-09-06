import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentSource } from './entities/payment-source.entity';
import { PaymentSourceService } from './services/payment-sources.service';
import { PaymentSourcesController } from './controllers/payment-sources.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentSource])],
  providers: [PaymentSourceService],
  controllers: [PaymentSourcesController],
  exports: [PaymentSourceService],
})
export class PaymentSourcesModule {}
