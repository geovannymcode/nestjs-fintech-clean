export class CreateDisbursementCommand {
  constructor(
    public readonly loanId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly recipientBankCode: string,
    public readonly recipientAccount: string,
    public readonly accountType: string,
    public readonly concept: string,
    public readonly requestedBy: string,
  ) {}
}