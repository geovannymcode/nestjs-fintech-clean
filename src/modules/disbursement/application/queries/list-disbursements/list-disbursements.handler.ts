import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ListDisbursementsQuery } from './list-disbursements.query';
import { Result } from '@shared/domain/result';

export interface DisbursementListItemDto {
  id: string;
  loanId: string;
  amount: number;
  currency: string;
  recipientBank: string;
  status: string;
  createdAt: Date;
}

export interface PaginatedDisbursementsDto {
  items: DisbursementListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@QueryHandler(ListDisbursementsQuery)
export class ListDisbursementsHandler
  implements IQueryHandler<ListDisbursementsQuery>
{
  private readonly logger = new Logger(ListDisbursementsHandler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    query: ListDisbursementsQuery,
  ): Promise<Result<PaginatedDisbursementsDto>> {
    this.logger.log('Listing disbursements with filters', query.filters);

    try {
      const page = query.pagination?.page || 1;
      const limit = query.pagination?.limit || 10;
      const offset = (page - 1) * limit;

      // Construir query dinámicamente
      let sqlQuery = `
        SELECT 
          d.id,
          d.loan_id as "loanId",
          d.amount,
          d.currency,
          d.recipient_bank_code as "recipientBank",
          d.status,
          d.created_at as "createdAt"
        FROM disbursements d
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Aplicar filtros
      if (query.filters?.loanId) {
        sqlQuery += ` AND d.loan_id = $${paramIndex}`;
        params.push(query.filters.loanId);
        paramIndex++;
      }

      if (query.filters?.status) {
        sqlQuery += ` AND d.status = $${paramIndex}`;
        params.push(query.filters.status);
        paramIndex++;
      }

      if (query.filters?.fromDate) {
        sqlQuery += ` AND d.created_at >= $${paramIndex}`;
        params.push(query.filters.fromDate);
        paramIndex++;
      }

      if (query.filters?.toDate) {
        sqlQuery += ` AND d.created_at <= $${paramIndex}`;
        params.push(query.filters.toDate);
        paramIndex++;
      }

      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM (${sqlQuery}) as subquery`;
      const countResult = await this.dataSource.query(countQuery, params);
      const total = parseInt(countResult[0].total, 10);

      // Aplicar paginación
      sqlQuery += ` ORDER BY d.created_at DESC`;
      sqlQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      // Ejecutar query
      const items = await this.dataSource.query(sqlQuery, params);

      const result: PaginatedDisbursementsDto = {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return Result.ok(result);
    } catch (error) {
      this.logger.error('Error listing disbursements', error);
      return Result.fail('Error al listar desembolsos');
    }
  }
}