import { DomainEvent } from '@shared/domain/domain-event';

export class DisbursementRejectedEvent extends DomainEvent {
  constructor(
    public readonly disbursementId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {
    super('DisbursementRejected');
  }

  getAggregateId(): string {
    return this.disbursementId;
  }
}