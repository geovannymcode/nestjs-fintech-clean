import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { CreateDisbursementCommand } from './create-disbursement.command';
import { Result } from '@shared/domain/result';
import { Disbursement } from '../../../domain/entities/disbursement.entity';
import { LoanId } from '../../../domain/value-objects/loan-id.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { BankAccount } from '../../../domain/value-objects/bank-account.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import {
  IDisbursementRepository,
  DISBURSEMENT_REPOSITORY,
} from '../../../domain/repositories/disbursement.repository.interface';
import {
  IComplianceService,
  COMPLIANCE_SERVICE,
} from '../../../domain/services/compliance.service.interface';
import {
  IInterbankApiService,
  INTERBANK_API_SERVICE,
} from '../../../domain/services/interbank-api.interface';

@CommandHandler(CreateDisbursementCommand)
export class CreateDisbursementHandler
  implements ICommandHandler<CreateDisbursementCommand>
{
  private readonly logger = new Logger(CreateDisbursementHandler.name);

  constructor(
    @Inject(DISBURSEMENT_REPOSITORY)
    private readonly disbursementRepository: IDisbursementRepository,
    @Inject(COMPLIANCE_SERVICE)
    private readonly complianceService: IComplianceService,
    @Inject(INTERBANK_API_SERVICE)
    private readonly interbankApi: IInterbankApiService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateDisbursementCommand,
  ): Promise<Result<{ disbursementId: string }>> {
    this.logger.log(`Creating disbursement for loan: ${command.loanId}`);

    try {
      // 1. Crear value objects
      const loanIdResult = LoanId.create(command.loanId);
      if (loanIdResult.isFailure) {
        return Result.fail(loanIdResult.error);
      }

      const moneyResult = Money.create(command.amount, command.currency);
      if (moneyResult.isFailure) {
        return Result.fail(moneyResult.error);
      }

      const bankAccountResult = BankAccount.create({
        bankCode: command.recipientBankCode,
        accountNumber: command.recipientAccount,
        accountType: command.accountType,
      });
      if (bankAccountResult.isFailure) {
        return Result.fail(bankAccountResult.error);
      }

      const loanId = loanIdResult.getValue();
      const money = moneyResult.getValue();
      let bankAccount = bankAccountResult.getValue();

      // 2. Verificar compliance/AML
      this.logger.log('Checking compliance...');
      const complianceResult = await this.complianceService.verify({
        amount: command.amount,
        currency: command.currency,
        recipient: command.recipientAccount,
        concept: command.concept,
      });

      if (!complianceResult.passed) {
        this.logger.warn(
          `Compliance check failed: ${complianceResult.reasons?.join(', ')}`,
        );
        
        // Reportar actividad sospechosa
        if (complianceResult.riskLevel === 'HIGH') {
          await this.complianceService.reportSuspiciousActivity({
            command,
            reasons: complianceResult.reasons,
          });
        }

        return Result.fail(
          `Transacción bloqueada por compliance: ${complianceResult.reasons?.join(', ')}`,
        );
      }

      // 3. Validar cuenta con sistema interbancario
      this.logger.log('Validating recipient account...');
      const validationResult = await this.interbankApi.validateAccount(
        bankAccount,
      );

      if (!validationResult.isValid) {
        return Result.fail(
          `Cuenta destino inválida: ${validationResult.validationErrors?.join(', ')}`,
        );
      }

      // Marcar cuenta como validada
      bankAccount = bankAccount.markAsValidated();

      // 4. Crear entidad de desembolso
      const disbursementResult = Disbursement.create({
        loanId,
        amount: money,
        recipient: bankAccount,
        requestedBy: UserId.create(command.requestedBy),
        concept: command.concept,
      });

      if (disbursementResult.isFailure) {
        return Result.fail(disbursementResult.error);
      }

      const disbursement = disbursementResult.getValue();

      // 5. Persistir
      await this.disbursementRepository.save(disbursement);

      // 6. Publicar eventos de dominio
      const events = disbursement.getUncommittedEvents();
      events.forEach((event) => {
        this.eventBus.publish(event);
      });

      this.logger.log(
        `Disbursement created successfully: ${disbursement.id.value}`,
      );

      return Result.ok({
        disbursementId: disbursement.id.value,
      });
    } catch (error) {
      this.logger.error('Error creating disbursement', error);
      return Result.fail('Error interno al crear el desembolso');
    }
  }
}