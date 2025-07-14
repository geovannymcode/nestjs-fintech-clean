import { ValueObject } from '@shared/domain/value-object';

export class UserId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(id: string): UserId {
    return new UserId(id);
  }

  get value(): string {
    return this.props;
  }
}