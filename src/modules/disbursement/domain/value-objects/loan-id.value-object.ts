import { ValueObject } from '@shared/domain/value-object';
import { Result } from '@shared/domain/result';

export class LoanId extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(id: string): Result<LoanId> {
    if (!id || id.trim().length === 0) {
      return Result.fail<LoanId>('Loan ID cannot be empty');
    }

    // Validar formato del ID (ejemplo: LOAN-XXXXXX)
    const pattern = /^LOAN-[A-Z0-9]{6}$/;
    if (!pattern.test(id)) {
      return Result.fail<LoanId>('Invalid loan ID format');
    }

    return Result.ok<LoanId>(new LoanId(id));
  }

  get value(): string {
    return this.props;
  }
}