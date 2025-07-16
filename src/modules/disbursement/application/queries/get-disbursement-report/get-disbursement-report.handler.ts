import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GetDisbursementReportQuery } from './get-disbursement-report.query';
import { Result } from '@shared/domain/result';
import { Logger } from '@nestjs/common';

export interface DisbursementReportDto {
  period: string;
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    failed: number;
  };
}

@QueryHandler(GetDisbursementReportQuery)
export class GetDisbursementReportHandler
  implements IQueryHandler<GetDisbursementReportQuery>
{
  private readonly logger = new Logger(GetDisbursementReportHandler.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    query: GetDisbursementReportQuery,
  ): Promise<Result<DisbursementReportDto[]>> {
    this.logger.log('Generating disbursement report', query);

    try {
      const dateFormat = this.getDateFormat(query.groupBy);

      const sqlQuery = `
        WITH period_data AS (
          SELECT
            TO_CHAR(created_at, '${dateFormat}') as period,
            amount,
            status
          FROM disbursements
          WHERE created_at BETWEEN $1 AND $2
        )
        SELECT
          period,
          SUM(amount) as total_amount,
          COUNT(*) as total_count,
          AVG(amount) as average_amount,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
        FROM period_data
        GROUP BY period
        ORDER BY period
      `;

      const results = await this.dataSource.query(sqlQuery, [
        query.startDate,
        query.endDate,
      ]);

      const report: DisbursementReportDto[] = results.map((row) => ({
        period: row.period,
        totalAmount: parseFloat(row.total_amount) || 0,
        totalCount: parseInt(row.total_count, 10) || 0,
        averageAmount: parseFloat(row.average_amount) || 0,
        statusBreakdown: {
          pending: parseInt(row.pending, 10) || 0,
          approved: parseInt(row.approved, 10) || 0,
          rejected: parseInt(row.rejected, 10) || 0,
          completed: parseInt(row.completed, 10) || 0,
          failed: parseInt(row.failed, 10) || 0,
        },
      }));

      return Result.ok(report);
    } catch (error) {
      this.logger.error('Error generating report', error);
      return Result.fail('Error al generar el reporte');
    }
  }

  private getDateFormat(groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return 'YYYY-MM-DD';
      case 'week':
        return 'IYYY-IW';
      case 'month':
        return 'YYYY-MM';
      default:
        return 'YYYY-MM-DD';
    }
  }
}