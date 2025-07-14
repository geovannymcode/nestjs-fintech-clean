import { AggregateRoot } from '@shared/domain/aggregate-root';
import { Result } from '@shared/domain/result';
import { DisbursementId } from '../value-objects/disbursement-id.value-object';
import { LoanId } from '../value-objects/loan-id.value-object';
import { Money } from '../value-objects/money.value-object';
import { BankAccount } from '../value-objects/bank-account.value-object';
import { UserId } from '../value-objects/user-id.value-object';
import { DisbursementCreatedEvent } from '../events/disbursement-created.event';
import { DisbursementApprovedEvent } from '../events/disbursement-approved.event';
import { DisbursementRejectedEvent } from '../events/disbursement-rejected.event';

export enum DisbursementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

interface DisbursementProps {
  loanId: LoanId;
  amount: Money;
  recipient: BankAccount;
  requestedBy: UserId;
  concept: string;
  status: DisbursementStatus;
  approvedBy?: UserId;
  rejectedBy?: UserId;
  rejectionReason?: string;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export class Disbursement extends AggregateRoot<DisbursementId> {
  private props: DisbursementProps;

  // Reglas de negocio como constantes
  private static readonly MIN_AMOUNT = 100;
  private static readonly MAX_AMOUNT = 50000;
  private static readonly VALID_CURRENCIES = ['USD', 'PEN'];

  private constructor(id: DisbursementId, props: DisbursementProps) {
    super(id);
    this.props = props;
  }

  // Factory method con validaciones
  static create(params: {
    loanId: LoanId;
    amount: Money;
    recipient: BankAccount;
    requestedBy: UserId;
    concept: string;
  }): Result<Disbursement> {
    // Validación 1: Monto mínimo
    if (params.amount.amount < this.MIN_AMOUNT) {
      return Result.fail<Disbursement>(
        `El monto mínimo de desembolso es ${this.MIN_AMOUNT} ${params.amount.currency}`
      );
    }

    // Validación 2: Monto máximo
    if (params.amount.amount > this.MAX_AMOUNT) {
      return Result.fail<Disbursement>(
        `El monto máximo de desembolso es ${this.MAX_AMOUNT} ${params.amount.currency}`
      );
    }

    // Validación 3: Moneda válida
    if (!this.VALID_CURRENCIES.includes(params.amount.currency)) {
      return Result.fail<Disbursement>(
        `Moneda no soportada. Monedas válidas: ${this.VALID_CURRENCIES.join(', ')}`
      );
    }

    // Validación 4: Cuenta validada
    if (!params.recipient.isValidated()) {
      return Result.fail<Disbursement>(
        'La cuenta destino debe estar validada antes de realizar un desembolso'
      );
    }

    // Validación 5: Concepto no vacío
    if (!params.concept || params.concept.trim().length === 0) {
      return Result.fail<Disbursement>('El concepto del desembolso es obligatorio');
    }

    const disbursementId = DisbursementId.create();
    const disbursement = new Disbursement(disbursementId, {
      ...params,
      status: DisbursementStatus.PENDING,
    });

    // Evento de dominio
    disbursement.addDomainEvent(
      new DisbursementCreatedEvent(
        disbursementId.value,
        params.loanId.value,
        params.amount.amount,
        params.amount.currency,
        params.recipient.bankCode,
        params.recipient.accountNumber
      )
    );

    return Result.ok<Disbursement>(disbursement);
  }

  // Métodos de negocio

  approve(approvedBy: UserId): Result<void> {
    // Regla: Solo se pueden aprobar desembolsos pendientes
    if (this.props.status !== DisbursementStatus.PENDING) {
      return Result.fail<void>(
        `No se puede aprobar un desembolso en estado ${this.props.status}`
      );
    }

    // Regla: No se puede auto-aprobar
    if (approvedBy.equals(this.props.requestedBy)) {
      return Result.fail<void>('No se puede aprobar un desembolso propio');
    }

    this.props.status = DisbursementStatus.APPROVED;
    this.props.approvedBy = approvedBy;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new DisbursementApprovedEvent(
        this.id.value,
        approvedBy.value
      )
    );

    return Result.ok<void>();
  }

  reject(rejectedBy: UserId, reason: string): Result<void> {
    // Regla: Solo se pueden rechazar desembolsos pendientes
    if (this.props.status !== DisbursementStatus.PENDING) {
      return Result.fail<void>(
        `No se puede rechazar un desembolso en estado ${this.props.status}`
      );
    }

    // Validar que hay una razón
    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('Se debe proporcionar una razón para el rechazo');
    }

    this.props.status = DisbursementStatus.REJECTED;
    this.props.rejectedBy = rejectedBy;
    this.props.rejectionReason = reason;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new DisbursementRejectedEvent(
        this.id.value,
        rejectedBy.value,
        reason
      )
    );

    return Result.ok<void>();
  }

  markAsProcessing(): Result<void> {
    // Regla: Solo desembolsos aprobados pueden procesarse
    if (this.props.status !== DisbursementStatus.APPROVED) {
      return Result.fail<void>(
        'Solo se pueden procesar desembolsos aprobados'
      );
    }

    this.props.status = DisbursementStatus.PROCESSING;
    this.props.processedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok<void>();
  }

  markAsCompleted(): Result<void> {
    // Regla: Solo desembolsos en procesamiento pueden completarse
    if (this.props.status !== DisbursementStatus.PROCESSING) {
      return Result.fail<void>(
        'Solo se pueden completar desembolsos en procesamiento'
      );
    }

    this.props.status = DisbursementStatus.COMPLETED;
    this.props.completedAt = new Date();
    this._updatedAt = new Date();

    return Result.ok<void>();
  }

  markAsFailed(reason: string): Result<void> {
    // Regla: Solo desembolsos en procesamiento pueden fallar
    if (this.props.status !== DisbursementStatus.PROCESSING) {
      return Result.fail<void>(
        'Solo pueden fallar desembolsos en procesamiento'
      );
    }

    this.props.status = DisbursementStatus.FAILED;
    this.props.failureReason = reason;
    this._updatedAt = new Date();

    return Result.ok<void>();
  }

  // Getters

  get loanId(): LoanId {
    return this.props.loanId;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get recipient(): BankAccount {
    return this.props.recipient;
  }

  get status(): DisbursementStatus {
    return this.props.status;
  }

  get requestedBy(): UserId {
    return this.props.requestedBy;
  }

  get concept(): string {
    return this.props.concept;
  }

  get approvedBy(): UserId | undefined {
    return this.props.approvedBy;
  }

  get rejectedBy(): UserId | undefined {
    return this.props.rejectedBy;
  }

  get rejectionReason(): string | undefined {
    return this.props.rejectionReason;
  }

  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  // Queries de estado

  isPending(): boolean {
    return this.props.status === DisbursementStatus.PENDING;
  }

  isApproved(): boolean {
    return this.props.status === DisbursementStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.props.status === DisbursementStatus.REJECTED;
  }

  isProcessing(): boolean {
    return this.props.status === DisbursementStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.props.status === DisbursementStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.props.status === DisbursementStatus.FAILED;
  }

  canBeApproved(): boolean {
    return this.isPending();
  }

  canBeProcessed(): boolean {
    return this.isApproved();
  }
}