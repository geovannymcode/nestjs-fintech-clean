import { Module } from '@nestjs/common';
import { DisbursementController } from './presentation/controllers/disbursement.controller';
import { CreateDisbursementUseCase } from './application/use-cases/create-disbursement.use-case';
import { DisbursementRepositoryImpl } from './infrastructure/repositories/disbursement.repository.impl';
import { ComplianceServiceImpl } from './infrastructure/services/compliance.service.impl';

@Module({
  controllers: [DisbursementController],
  providers: [
    // Use Case
    CreateDisbursementUseCase,
    // Repository
    {
      provide: 'DisbursementRepository',
      useClass: DisbursementRepositoryImpl,
    },
    // Services
    {
      provide: 'ComplianceService',
      useClass: ComplianceServiceImpl,
    },
  ],
})
export class DisbursementModule {}