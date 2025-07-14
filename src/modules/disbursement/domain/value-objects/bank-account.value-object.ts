import { ValueObject } from '@shared/domain/value-object';
import { Result } from '@shared/domain/result';

interface BankAccountProps {
  bankCode: string;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CHECKING';
  isValidated: boolean;
}

export class BankAccount extends ValueObject<BankAccountProps> {
  private static readonly VALID_BANK_CODES = ['001', '002', '003', '004']; // Códigos de bancos peruanos
  private static readonly ACCOUNT_NUMBER_PATTERN = /^[0-9]{20}$/;

  private constructor(props: BankAccountProps) {
    super(props);
  }

  static create(props: {
    bankCode: string;
    accountNumber: string;
    accountType: string;
  }): Result<BankAccount> {
    // Validar código de banco
    if (!this.VALID_BANK_CODES.includes(props.bankCode)) {
      return Result.fail<BankAccount>('Invalid bank code');
    }

    // Validar número de cuenta
    if (!this.ACCOUNT_NUMBER_PATTERN.test(props.accountNumber)) {
      return Result.fail<BankAccount>('Invalid account number format');
    }

    // Validar tipo de cuenta
    if (!['SAVINGS', 'CHECKING'].includes(props.accountType)) {
      return Result.fail<BankAccount>('Invalid account type');
    }

    return Result.ok<BankAccount>(
      new BankAccount({
        bankCode: props.bankCode,
        accountNumber: props.accountNumber,
        accountType: props.accountType as 'SAVINGS' | 'CHECKING',
        isValidated: false, // Por defecto no está validada
      })
    );
  }

  markAsValidated(): BankAccount {
    return new BankAccount({
      ...this.props,
      isValidated: true,
    });
  }

  get bankCode(): string {
    return this.props.bankCode;
  }

  get accountNumber(): string {
    return this.props.accountNumber;
  }

  get accountType(): string {
    return this.props.accountType;
  }

  isValidated(): boolean {
    return this.props.isValidated;
  }

  getMaskedAccountNumber(): string {
    const visible = 4;
    const masked = this.props.accountNumber.slice(0, -visible).replace(/./g, '*');
    const lastDigits = this.props.accountNumber.slice(-visible);
    return masked + lastDigits;
  }
}