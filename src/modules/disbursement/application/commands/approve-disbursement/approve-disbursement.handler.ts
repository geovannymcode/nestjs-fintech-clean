import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ApproveDisbursementCommand } from './approve-disbursement.command';
import { Result } from '@shared/domain/result';
import { DisbursementId } from '../../../domain/value-objects/disbursement-id.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  IDisbursementRepository,
  DISBURSEMENT_REPOSITORY,
} from '../../../domain/repositories/disbursement.repository.interface';

@CommandHandler(ApproveDisbursementCommand)
export class ApproveDisbursementHandler
  implements ICommandHandler<ApproveDisbursementCommand>
{
  private readonly logger = new Logger(ApproveDisbursementHandler.name);

  constructor(
    @Inject(DISBURSEMENT_REPOSITORY)
    private readonly disbursementRepository: IDisbursementRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ApproveDisbursementCommand,
  ): Promise<Result<void>> {
    this.logger.log(`Approving disbursement: ${command.disbursementId}`);

    try {
      // 1. Buscar el desembolso
      const disbursementId = DisbursementId.create(command.disbursementId);
      const disbursement = await this.disbursementRepository.findById(
        disbursementId,
      );

      if (!disbursement) {
        return Result.fail('Desembolso no encontrado');
      }

      // 2. Aprobar
      const approvalResult = disbursement.approve(
        UserId.create(command.approvedBy),
      );

      if (approvalResult.isFailure) {
        return Result.fail(approvalResult.error);
      }

      // 3. Persistir cambios
      await this.disbursementRepository.save(disbursement);

      // 4. Publicar eventos
      const events = disbursement.getUncommittedEvents();
      events.forEach((event) => {
        this.eventBus.publish(event);
      });

      this.logger.log(
        `Disbursement approved successfully: ${command.disbursementId}`,
      );

      return Result.ok();
    } catch (error) {
      this.logger.error('Error approving disbursement', error);
      return Result.fail('Error interno al aprobar el desembolso');
    }
  }
}