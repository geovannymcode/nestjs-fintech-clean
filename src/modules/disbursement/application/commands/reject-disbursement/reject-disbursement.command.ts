export class RejectDisbursementCommand {
  constructor(
    public readonly disbursementId: string,
    public readonly rejectedBy: string,
    public readonly reason: string,
  ) {}
}