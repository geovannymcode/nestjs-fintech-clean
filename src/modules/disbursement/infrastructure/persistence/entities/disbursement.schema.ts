import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('disbursements')
@Index(['loan_id'])
@Index(['status'])
@Index(['created_at'])
export class DisbursementSchema {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'loan_id', type: 'varchar', length: 20 })
  loanId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ name: 'recipient_bank_code', type: 'varchar', length: 3 })
  recipientBankCode: string;

  @Column({ name: 'recipient_account_number', type: 'varchar', length: 20 })
  recipientAccountNumber: string;

  @Column({ name: 'recipient_account_type', type: 'varchar', length: 10 })
  recipientAccountType: string;

  @Column({ name: 'recipient_validated', type: 'boolean', default: false })
  recipientValidated: boolean;

  @Column({ type: 'text' })
  concept: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}