import { DomainEvent } from '@shared/domain/domain-event';

export class DisbursementApprovedEvent extends DomainEvent {
  constructor(
    public readonly disbursementId: string,
    public readonly approvedBy: string,
  ) {
    super('DisbursementApproved');
  }

  getAggregateId(): string {
    return this.disbursementId;
  }
}