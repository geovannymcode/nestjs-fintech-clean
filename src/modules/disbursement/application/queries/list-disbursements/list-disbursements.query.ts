export class ListDisbursementsQuery {
  constructor(
    public readonly filters?: {
      loanId?: string;
      status?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    public readonly pagination?: {
      page: number;
      limit: number;
    },
  ) {}
}