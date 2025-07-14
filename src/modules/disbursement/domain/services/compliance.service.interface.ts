export interface ComplianceCheckRequest {
  amount: number;
  currency: string;
  recipient: string;
  concept: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons?: string[];
}

export interface IComplianceService {
  verify(request: ComplianceCheckRequest): Promise<ComplianceCheckResult>;
  reportSuspiciousActivity(data: any): Promise<void>;
}

export const COMPLIANCE_SERVICE = Symbol('IComplianceService');