import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { CategoryTimelineData, CategorySpendingSummary } from '@nueink/core';

/**
 * Analytics API Client
 *
 * Client-side API for analytics and insights operations.
 * All requests are authenticated with Cognito credentials.
 */
export class AnalyticsApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new AnalyticsApi();

  /**
   * Get category spending timeline
   * GET /analytics/category-timeline/:organizationId/:category?startDate=...&endDate=...&highlightTransactionId=...
   */
  public getCategoryTimeline = async (
    organizationId: string,
    category: string,
    startDate: Date,
    endDate: Date,
    highlightTransactionId?: string
  ): Promise<CategoryTimelineData> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());
    if (highlightTransactionId) {
      params.append('highlightTransactionId', highlightTransactionId);
    }

    const url = `/analytics/category-timeline/${organizationId}/${encodeURIComponent(category)}?${params.toString()}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as CategoryTimelineData;
  };

  /**
   * Get category spending summaries for a period
   * GET /analytics/category-summaries/:organizationId?startDate=...&endDate=...
   */
  public getCategorySummaries = async (
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategorySpendingSummary[]> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate.toISOString());
    params.append('endDate', endDate.toISOString());

    const url = `/analytics/category-summaries/${organizationId}?${params.toString()}`;
    const response = await this.api.get(url).response;
    return (await response.body.json()) as unknown as CategorySpendingSummary[];
  };
}
