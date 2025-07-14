import { ValueObject } from '@shared/domain/value-object';
import { Result } from '@shared/domain/result';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static create(amount: number, currency: string): Result<Money> {
    if (amount < 0) {
      return Result.fail<Money>('Amount cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      return Result.fail<Money>('Invalid currency code');
    }

    return Result.ok<Money>(new Money({ amount, currency: currency.toUpperCase() }));
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(money: Money): Result<Money> {
    if (this.currency !== money.currency) {
      return Result.fail<Money>('Cannot add money with different currencies');
    }

    return Money.create(this.amount + money.amount, this.currency);
  }

  subtract(money: Money): Result<Money> {
    if (this.currency !== money.currency) {
      return Result.fail<Money>('Cannot subtract money with different currencies');
    }

    if (this.amount < money.amount) {
      return Result.fail<Money>('Insufficient amount');
    }

    return Money.create(this.amount - money.amount, this.currency);
  }

  isGreaterThan(money: Money): boolean {
    return this.currency === money.currency && this.amount > money.amount;
  }

  isLessThan(money: Money): boolean {
    return this.currency === money.currency && this.amount < money.amount;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}