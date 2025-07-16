import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDisbursementRepository } from '../../../domain/repositories/disbursement.repository.interface';
import { Disbursement } from '../../../domain/entities/disbursement.entity';
import { DisbursementId } from '../../../domain/value-objects/disbursement-id.value-object';
import { LoanId } from '../../../domain/value-objects/loan-id.value-object';
import { DisbursementSchema } from '../entities/disbursement.schema';
import { DisbursementMapper } from '../mappers/disbursement.mapper';

@Injectable()
export class DisbursementRepository implements IDisbursementRepository {
  constructor(
    @InjectRepository(DisbursementSchema)
    private readonly repository: Repository<DisbursementSchema>,
  ) {}

  async save(disbursement: Disbursement): Promise<void> {
    const schema = DisbursementMapper.toPersistence(disbursement);
    await this.repository.save(schema);
    
    // Limpiar eventos después de persistir
    disbursement.clearEvents();
  }

  async findById(id: DisbursementId): Promise<Disbursement | null> {
    const schema = await this.repository.findOne({
      where: { id: id.value },
    });

    if (!schema) {
      return null;
    }

    return DisbursementMapper.toDomain(schema);
  }

  async findByLoanId(loanId: LoanId): Promise<Disbursement[]> {
    const schemas = await this.repository.find({
      where: { loanId: loanId.value },
      order: { createdAt: 'DESC' },
    });

    return schemas.map(DisbursementMapper.toDomain);
  }

  async findPendingDisbursements(): Promise<Disbursement[]> {
    const schemas = await this.repository.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
    });

    return schemas.map(DisbursementMapper.toDomain);
  }

  async exists(id: DisbursementId): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.value },
    });

    return count > 0;
  }
}