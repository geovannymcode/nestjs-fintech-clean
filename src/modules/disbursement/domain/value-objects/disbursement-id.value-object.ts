import { ValueObject } from '@shared/domain/value-object';
import { v4 as uuidv4 } from 'uuid';

export class DisbursementId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(id?: string): DisbursementId {
    return new DisbursementId(id || uuidv4());
  }

  get value(): string {
    return this.props;
  }

  toString(): string {
    return this.props;
  }
}