import { Disbursement, DisbursementStatus } from '../../../domain/entities/disbursement.entity';
import { DisbursementId } from '../../../domain/value-objects/disbursement-id.value-object';
import { LoanId } from '../../../domain/value-objects/loan-id.value-object';
import { Money } from '../../../domain/value-objects/money.value-object';
import { BankAccount } from '../../../domain/value-objects/bank-account.value-object';
import { UserId } from '../../../domain/value-objects/user-id.value-object';
import { DisbursementSchema } from '../entities/disbursement.schema';

export class DisbursementMapper {
  static toDomain(schema: DisbursementSchema): Disbursement {
    // Reconstruir value objects
    const id = DisbursementId.create(schema.id);
    const loanId = LoanId.create(schema.loanId).getValue();
    const money = Money.create(Number(schema.amount), schema.currency).getValue();
    const bankAccount = BankAccount.create({
      bankCode: schema.recipientBankCode,
      accountNumber: schema.recipientAccountNumber,
      accountType: schema.recipientAccountType,
    }).getValue();

    // Si está validada, marcarla como tal
    const validatedBankAccount = schema.recipientValidated
      ? bankAccount.markAsValidated()
      : bankAccount;

    // Reconstruir la entidad usando reflection (simplificado)
    const disbursement = Object.create(Disbursement.prototype);
    
    disbursement['_id'] = id;
    disbursement['_createdAt'] = schema.createdAt;
    disbursement['_updatedAt'] = schema.updatedAt;
    disbursement['props'] = {
      loanId,
      amount: money,
      recipient: validatedBankAccount,
      requestedBy: UserId.create(schema.requestedBy),
      concept: schema.concept,
      status: schema.status as DisbursementStatus,
      approvedBy: schema.approvedBy ? UserId.create(schema.approvedBy) : undefined,
      rejectedBy: schema.rejectedBy ? UserId.create(schema.rejectedBy) : undefined,
      rejectionReason: schema.rejectionReason,
      processedAt: schema.processedAt,
      completedAt: schema.completedAt,
      failureReason: schema.failureReason,
    };
    disbursement['_domainEvents'] = [];

    return disbursement;
  }

  static toPersistence(disbursement: Disbursement): DisbursementSchema {
    const schema = new DisbursementSchema();
    
    schema.id = disbursement.id.value;
    schema.loanId = disbursement.loanId.value;
    schema.amount = disbursement.amount.amount;
    schema.currency = disbursement.amount.currency;
    schema.recipientBankCode = disbursement.recipient.bankCode;
    schema.recipientAccountNumber = disbursement.recipient.accountNumber;
    schema.recipientAccountType = disbursement.recipient.accountType;
    schema.recipientValidated = disbursement.recipient.isValidated();
    schema.concept = disbursement.concept;
    schema.status = disbursement.status;
    schema.requestedBy = disbursement.requestedBy.value;
    schema.approvedBy = disbursement.approvedBy?.value;
    schema.rejectedBy = disbursement.rejectedBy?.value;
    schema.rejectionReason = disbursement.rejectionReason;
    schema.processedAt = disbursement.processedAt;
    schema.completedAt = disbursement.completedAt;
    schema.failureReason = disbursement.failureReason;
    schema.createdAt = disbursement['_createdAt'];
    schema.updatedAt = disbursement['_updatedAt'];

    return schema;
  }
}