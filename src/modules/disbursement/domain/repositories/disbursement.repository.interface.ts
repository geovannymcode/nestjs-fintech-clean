import { Disbursement } from '../entities/disbursement.entity';
import { DisbursementId } from '../value-objects/disbursement-id.value-object';
import { LoanId } from '../value-objects/loan-id.value-object';

export interface IDisbursementRepository {
  save(disbursement: Disbursement): Promise<void>;
  findById(id: DisbursementId): Promise<Disbursement | null>;
  findByLoanId(loanId: LoanId): Promise<Disbursement[]>;
  findPendingDisbursements(): Promise<Disbursement[]>;
  exists(id: DisbursementId): Promise<boolean>;
}

export const DISBURSEMENT_REPOSITORY = Symbol('IDisbursementRepository');
