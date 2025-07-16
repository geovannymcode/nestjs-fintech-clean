import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RejectDisbursementCommand } from './reject-disbursement.command';
import { Result } from '@shared/domain/result';
import { DisbursementId } from '../../../domain/value-objects/disbursement-id.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  IDisbursementRepository,
  DISBURSEMENT_REPOSITORY,
} from '../../../domain/repositories/disbursement.repository.interface';

@CommandHandler(RejectDisbursementCommand)
export class RejectDisbursementHandler
  implements ICommandHandler<RejectDisbursementCommand>
{
  private readonly logger = new Logger(RejectDisbursementHandler.name);

  constructor(
    @Inject(DISBURSEMENT_REPOSITORY)
    private readonly disbursementRepository: IDisbursementRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: RejectDisbursementCommand,
  ): Promise<Result<void>> {
    this.logger.log(`Rejecting disbursement: ${command.disbursementId}`);

    try {
      // 1. Buscar el desembolso
      const disbursementId = DisbursementId.create(command.disbursementId);
      const disbursement = await this.disbursementRepository.findById(
        disbursementId,
      );

      if (!disbursement) {
        return Result.fail('Desembolso no encontrado');
      }

      // 2. Rechazar
      const rejectionResult = disbursement.reject(
        UserId.create(command.rejectedBy),
        command.reason,
      );

      if (rejectionResult.isFailure) {
        return Result.fail(rejectionResult.error);
      }

      // 3. Persistir cambios
      await this.disbursementRepository.save(disbursement);

      // 4. Publicar eventos
      const events = disbursement.getUncommittedEvents();
      events.forEach((event) => {
        this.eventBus.publish(event);
      });

      this.logger.log(
        `Disbursement rejected successfully: ${command.disbursementId}`,
      );

      return Result.ok();
    } catch (error) {
      this.logger.error('Error rejecting disbursement', error);
      return Result.fail('Error interno al rechazar el desembolso');
    }
  }
}