import { BankAccount } from '../value-objects/bank-account.value-object';

export interface AccountValidationResult {
  isValid: boolean;
  accountHolderName?: string;
  accountHolderDocument?: string;
  validationErrors?: string[];
}

export interface TransferRequest {
  fromAccount: string;
  toAccount: BankAccount;
  amount: number;
  currency: string;
  concept: string;
  reference: string;
}

export interface TransferResult {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IInterbankApiService {
  validateAccount(account: BankAccount): Promise<AccountValidationResult>;
  initiateTransfer(request: TransferRequest): Promise<TransferResult>;
  getTransferStatus(transactionId: string): Promise<TransferResult>;
}

export const INTERBANK_API_SERVICE = Symbol('IInterbankApiService');