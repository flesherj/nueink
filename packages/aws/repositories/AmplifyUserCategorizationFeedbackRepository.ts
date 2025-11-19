import type { AmplifyDataClient } from './types';
import { UserCategorizationFeedbackEntity, SplitData } from '../models';

export interface UserCategorizationFeedbackRepository {
  save: (feedback: UserCategorizationFeedbackEntity) => Promise<UserCategorizationFeedbackEntity>;
  findByAccount: (accountId: string, limit?: number) => Promise<UserCategorizationFeedbackEntity[]>;
  findByOrganization: (
    organizationId: string,
    limit?: number
  ) => Promise<UserCategorizationFeedbackEntity[]>;
  findByMerchant: (
    accountId: string,
    merchantName: string
  ) => Promise<UserCategorizationFeedbackEntity[]>;
}

export class AmplifyUserCategorizationFeedbackRepository
  implements UserCategorizationFeedbackRepository
{
  constructor(private dbClient: AmplifyDataClient) {}

  public save = async (
    feedback: UserCategorizationFeedbackEntity
  ): Promise<UserCategorizationFeedbackEntity> => {
    const response = await this.dbClient.models.UserCategorizationFeedback.create({
      feedbackId: feedback.feedbackId,
      transactionId: feedback.transactionId,
      organizationId: feedback.organizationId,
      accountId: feedback.accountId,
      merchantName: feedback.merchantName,
      amount: feedback.amount,
      originalSplits: feedback.originalSplits as any,
      correctedSplits: feedback.correctedSplits as any,
      feedbackType: feedback.feedbackType,
      createdAt: feedback.createdAt,
      profileOwner: feedback.profileOwner,
    });

    if (!response.data) {
      throw new Error(
        'Failed to create UserCategorizationFeedback: response.data is null'
      );
    }
    return this.toFeedback(response.data);
  };

  public findByAccount = async (
    accountId: string,
    limit: number = 100
  ): Promise<UserCategorizationFeedbackEntity[]> => {
    const response =
      await this.dbClient.models.UserCategorizationFeedback.listUserCategorizationFeedbackByAccountId(
        { accountId },
        { limit }
      );
    return response.data.map((item: any) => this.toFeedback(item));
  };

  public findByOrganization = async (
    organizationId: string,
    limit: number = 100
  ): Promise<UserCategorizationFeedbackEntity[]> => {
    const response =
      await this.dbClient.models.UserCategorizationFeedback.listUserCategorizationFeedbackByOrganizationId(
        { organizationId },
        { limit }
      );
    return response.data.map((item: any) => this.toFeedback(item));
  };

  public findByMerchant = async (
    accountId: string,
    merchantName: string
  ): Promise<UserCategorizationFeedbackEntity[]> => {
    const response =
      await this.dbClient.models.UserCategorizationFeedback.listUserCategorizationFeedbackByMerchantName(
        { merchantName }
      );
    // Filter by accountId client-side since we can't do compound query on merchantName index
    return response.data
      .filter((item: any) => item.accountId === accountId)
      .map((item: any) => this.toFeedback(item));
  };

  /**
   * Convert Amplify UserCategorizationFeedback entity to UserCategorizationFeedbackEntity
   */
  private toFeedback = (data: any): UserCategorizationFeedbackEntity => {
    return {
      feedbackId: data.feedbackId,
      transactionId: data.transactionId,
      organizationId: data.organizationId,
      accountId: data.accountId,
      merchantName: data.merchantName ?? undefined,
      amount: data.amount,
      originalSplits: data.originalSplits as SplitData[],
      correctedSplits: data.correctedSplits as SplitData[],
      feedbackType: data.feedbackType,
      createdAt: data.createdAt,
      profileOwner: data.profileOwner ?? undefined,
    };
  };
}
