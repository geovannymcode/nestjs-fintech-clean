import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetDisbursementQuery } from './get-disbursement.query';
import { Result } from '@shared/domain/result';
import { DisbursementId } from '../../../domain/value-objects/disbursement-id.value-object';
import {
  IDisbursementRepository,
  DISBURSEMENT_REPOSITORY,
} from '../../../domain/repositories/disbursement.repository.interface';

export interface DisbursementDto {
  id: string;
  loanId: string;
  amount: number;
  currency: string;
  recipientBankCode: string;
  recipientAccountNumber: string;
  recipientAccountType: string;
  concept: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

@QueryHandler(GetDisbursementQuery)
export class GetDisbursementHandler
  implements IQueryHandler<GetDisbursementQuery>
{
  private readonly logger = new Logger(GetDisbursementHandler.name);

  constructor(
    @Inject(DISBURSEMENT_REPOSITORY)
    private readonly disbursementRepository: IDisbursementRepository,
  ) {}

  async execute(
    query: GetDisbursementQuery,
  ): Promise<Result<DisbursementDto>> {
    this.logger.log(`Getting disbursement: ${query.disbursementId}`);

    try {
      const disbursementId = DisbursementId.create(query.disbursementId);
      const disbursement = await this.disbursementRepository.findById(
        disbursementId,
      );

      if (!disbursement) {
        return Result.fail('Desembolso no encontrado');
      }

      // Mapear a DTO
      const dto: DisbursementDto = {
        id: disbursement.id.value,
        loanId: disbursement.loanId.value,
        amount: disbursement.amount.amount,
        currency: disbursement.amount.currency,
        recipientBankCode: disbursement.recipient.bankCode,
        recipientAccountNumber: disbursement.recipient.getMaskedAccountNumber(),
        recipientAccountType: disbursement.recipient.accountType,
        concept: disbursement.concept,
        status: disbursement.status,
        requestedBy: disbursement.requestedBy.value,
        approvedBy: disbursement.approvedBy?.value,
        rejectedBy: disbursement.rejectedBy?.value,
        rejectionReason: disbursement.rejectionReason,
        createdAt: disbursement['_createdAt'],
        updatedAt: disbursement['_updatedAt'],
        processedAt: disbursement.processedAt,
        completedAt: disbursement.completedAt,
      };

      return Result.ok(dto);
    } catch (error) {
      this.logger.error('Error getting disbursement', error);
      return Result.fail('Error al obtener el desembolso');
    }
  }
}