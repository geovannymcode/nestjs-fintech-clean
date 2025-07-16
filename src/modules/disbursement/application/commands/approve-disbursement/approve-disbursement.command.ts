export class ApproveDisbursementCommand {
  constructor(
    public readonly disbursementId: string,
    public readonly approvedBy: string,
  ) {}
}
