import { DomainEvent } from '@shared/domain/domain-event';

export class DisbursementCompletedEvent extends DomainEvent {
  constructor(
    public readonly disbursementId: string,
    public readonly completedAt: Date,
  ) {
    super('DisbursementCompleted');
  }

  getAggregateId(): string {
    return this.disbursementId;
  }
}