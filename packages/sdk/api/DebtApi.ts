import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Debt, DebtPayoffPlan } from '@nueink/core';

/**
 * Request body for creating a debt
 */
export interface CreateDebtRequest {
  organizationId: string;
  accountId: string;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  originalBalance: number;
  currentBalance: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: number;
  financialAccountId?: string;
}

/**
 * Request body for generating payoff plans
 */
export interface GeneratePayoffPlansRequest {
  organizationId: string;
  accountId: string;
  monthlyPayment?: number;  // Optional - defaults to minimums + 10%
}

/**
 * Response from generating payoff plans
 */
export interface GeneratePayoffPlansResponse {
  plans: DebtPayoffPlan[];
  count: number;
}

/**
 * Debt API Client
 *
 * Client-side API for debt management and payoff planning.
 * All requests are authenticated with Cognito credentials.
 */
export class DebtApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new DebtApi();

  /**
   * Get all debts for an organization
   * GET /debt/organization/:organizationId
   */
  public getByOrganization = async (
    organizationId: string
  ): Promise<{ debts: Debt[]; count: number }> => {
    const url = `/debt/organization/${organizationId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as { debts: Debt[]; count: number };
  };

  /**
   * Get active debts for an organization
   * GET /debt/active/:organizationId
   */
  public getActiveDebts = async (
    organizationId: string
  ): Promise<{ debts: Debt[]; count: number }> => {
    const url = `/debt/active/${organizationId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as { debts: Debt[]; count: number };
  };

  /**
   * Get debt by ID
   * GET /debt/:debtId
   */
  public getById = async (debtId: string): Promise<Debt> => {
    const url = `/debt/${debtId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as Debt;
  };

  /**
   * Create a new debt
   * POST /debt
   */
  public create = async (request: CreateDebtRequest): Promise<Debt> => {
    const url = '/debt';
    const response = await this.api.post(url, request).response;
    return (await response.body.json()) as unknown as Debt;
  };

  /**
   * Update a debt
   * PUT /debt/:debtId
   */
  public update = async (debtId: string, updates: Partial<Debt>): Promise<Debt> => {
    const url = `/debt/${debtId}`;
    const response = await this.api.put(url, updates).response;
    return (await response.body.json()) as unknown as Debt;
  };

  /**
   * Delete a debt
   * DELETE /debt/:debtId
   */
  public delete = async (debtId: string): Promise<void> => {
    const url = `/debt/${debtId}`;
    await this.api.del(url).response;
  };

  /**
   * Generate debt payoff plans
   * POST /debt/payoff-plans
   *
   * Returns multiple payoff strategies (avalanche, snowball)
   */
  public generatePayoffPlans = async (
    request: GeneratePayoffPlansRequest
  ): Promise<GeneratePayoffPlansResponse> => {
    const url = '/debt/payoff-plans';
    const response = await this.api.post(url, request).response;
    return (await response.body.json()) as unknown as GeneratePayoffPlansResponse;
  };
}
