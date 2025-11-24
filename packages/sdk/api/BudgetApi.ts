import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Budget } from '@nueink/core';

/**
 * Request body for creating a budget from analysis
 */
export interface CreateBudgetFromAnalysisRequest {
  organizationId: string;
  accountId: string;
  periodMonths?: number;  // default: 12, max: 12
  budgetName?: string;    // optional custom name
}

/**
 * Response from creating a budget
 */
export interface CreateBudgetFromAnalysisResponse {
  budget: Budget;
  analysis: {
    analysisId: string;
    periodStart: Date;
    periodEnd: Date;
    monthsAnalyzed: number;
    totalSpending: number;
    monthlyAverageSpending: number;
    categoryCount: number;
  };
}

/**
 * Budget API Client
 *
 * Client-side API for budget operations.
 * All requests are authenticated with Cognito credentials.
 */
export class BudgetApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new BudgetApi();

  /**
   * Create a baseline budget from financial analysis
   * POST /budget/from-analysis
   */
  public createFromAnalysis = async (
    request: CreateBudgetFromAnalysisRequest
  ): Promise<CreateBudgetFromAnalysisResponse> => {
    const url = '/budget/from-analysis';
    const response = await this.api.post(url, request).response;
    return (await response.body.json()) as unknown as CreateBudgetFromAnalysisResponse;
  };

  /**
   * Get active budget for an organization
   * GET /budget/active/:organizationId
   */
  public getActiveBudget = async (organizationId: string): Promise<Budget> => {
    const url = `/budget/active/${organizationId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as Budget;
  };

  /**
   * Get all budgets for an organization
   * GET /budget/organization/:organizationId
   */
  public getBudgetsByOrganization = async (
    organizationId: string
  ): Promise<{ budgets: Budget[]; count: number }> => {
    const url = `/budget/organization/${organizationId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as { budgets: Budget[]; count: number };
  };

  /**
   * Get budget by ID
   * GET /budget/:budgetId
   */
  public getBudgetById = async (budgetId: string): Promise<Budget> => {
    const url = `/budget/${budgetId}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as Budget;
  };
}
