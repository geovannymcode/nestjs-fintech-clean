export class GetDisbursementReportQuery {
  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy: 'day' | 'week' | 'month',
  ) {}
}