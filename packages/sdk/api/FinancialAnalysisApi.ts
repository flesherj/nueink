import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { FinancialAnalysis } from '@nueink/core';

/**
 * Financial Analysis API Client
 *
 * Client-side API for financial analysis operations.
 * All requests are authenticated with Cognito credentials.
 */
export class FinancialAnalysisApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new FinancialAnalysisApi();

  /**
   * Analyze spending for an organization
   * GET /financial-analysis/analyze/:organizationId/:accountId?periodMonths=12
   *
   * Returns monthly averages based on up to 12 months of data
   */
  public analyzeSpending = async (
    organizationId: string,
    accountId: string,
    periodMonths: number = 12
  ): Promise<FinancialAnalysis & { insights: string[] }> => {
    const params = new URLSearchParams();
    params.append('periodMonths', periodMonths.toString());

    const url = `/financial-analysis/analyze/${organizationId}/${accountId}?${params.toString()}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as FinancialAnalysis & { insights: string[] };
  };
}
