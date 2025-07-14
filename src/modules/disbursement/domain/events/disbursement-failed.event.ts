import { DomainEvent } from '@shared/domain/domain-event';

export class DisbursementFailedEvent extends DomainEvent {
  constructor(
    public readonly disbursementId: string,
    public readonly reason: string,
  ) {
    super('DisbursementFailed');
  }

  getAggregateId(): string {
    return this.disbursementId;
  }
}