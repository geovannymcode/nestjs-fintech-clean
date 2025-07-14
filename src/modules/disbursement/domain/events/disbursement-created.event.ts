import { DomainEvent } from '@shared/domain/domain-event';

export class DisbursementCreatedEvent extends DomainEvent {
  constructor(
    public readonly disbursementId: string,
    public readonly loanId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly recipientBankCode: string,
    public readonly recipientAccountNumber: string,
  ) {
    super('DisbursementCreated');
  }

  getAggregateId(): string {
    return this.disbursementId;
  }
}
