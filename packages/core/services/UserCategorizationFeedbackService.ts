/**
 * UserCategorizationFeedback Service
 *
 * Tracks when users correct AI-generated categorizations.
 * This data will be used for:
 * - Personalized learning (user-specific patterns)
 * - Baseline improvement (aggregate patterns across all users)
 */
export interface SplitFeedbackData {
  category: string;
  percentage: number;
  confidence?: number;
}

export interface UserCategorizationFeedback {
  feedbackId: string;
  transactionId: string;
  organizationId: string;
  accountId: string;
  merchantName?: string;
  amount: number;
  originalSplits: SplitFeedbackData[];
  correctedSplits: SplitFeedbackData[];
  feedbackType: 'manual_edit' | 'quick_accept' | 'quick_reject';
  createdAt: Date;
  profileOwner?: string;
}

export interface UserCategorizationFeedbackRepository<TEntity> {
  save: (feedback: TEntity) => Promise<TEntity>;
  findByAccount: (accountId: string, limit?: number) => Promise<TEntity[]>;
  findByOrganization: (organizationId: string, limit?: number) => Promise<TEntity[]>;
  findByMerchant: (accountId: string, merchantName: string) => Promise<TEntity[]>;
}

export class UserCategorizationFeedbackService<TEntity> {
  constructor(private repository: UserCategorizationFeedbackRepository<TEntity>) {}

  /**
   * Track feedback when user corrects AI categorization
   */
  public trackFeedback = async (
    feedback: Omit<UserCategorizationFeedback, 'feedbackId' | 'createdAt'>
  ): Promise<UserCategorizationFeedback> => {
    const completeFeedback: UserCategorizationFeedback = {
      ...feedback,
      feedbackId: this.generateId(),
      createdAt: new Date(),
    };

    const entity = this.toEntity(completeFeedback);
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  };

  /**
   * Get feedback history for an account
   */
  public getAccountFeedback = async (
    accountId: string,
    limit?: number
  ): Promise<UserCategorizationFeedback[]> => {
    const entities = await this.repository.findByAccount(accountId, limit);
    return entities.map((e) => this.toDomain(e));
  };

  /**
   * Get feedback history for an organization
   */
  public getOrganizationFeedback = async (
    organizationId: string,
    limit?: number
  ): Promise<UserCategorizationFeedback[]> => {
    const entities = await this.repository.findByOrganization(organizationId, limit);
    return entities.map((e) => this.toDomain(e));
  };

  /**
   * Get feedback for a specific merchant (for pattern learning)
   */
  public getMerchantFeedback = async (
    accountId: string,
    merchantName: string
  ): Promise<UserCategorizationFeedback[]> => {
    const entities = await this.repository.findByMerchant(accountId, merchantName);
    return entities.map((e) => this.toDomain(e));
  };

  // Converter methods
  private toDomain = (entity: TEntity): UserCategorizationFeedback => {
    const e = entity as any;
    return {
      feedbackId: e.feedbackId,
      transactionId: e.transactionId,
      organizationId: e.organizationId,
      accountId: e.accountId,
      merchantName: e.merchantName,
      amount: e.amount,
      originalSplits: e.originalSplits,
      correctedSplits: e.correctedSplits,
      feedbackType: e.feedbackType,
      createdAt: typeof e.createdAt === 'string' ? new Date(e.createdAt) : e.createdAt,
      profileOwner: e.profileOwner,
    };
  };

  private toEntity = (domain: UserCategorizationFeedback): TEntity => {
    return {
      feedbackId: domain.feedbackId,
      transactionId: domain.transactionId,
      organizationId: domain.organizationId,
      accountId: domain.accountId,
      merchantName: domain.merchantName,
      amount: domain.amount,
      originalSplits: domain.originalSplits,
      correctedSplits: domain.correctedSplits,
      feedbackType: domain.feedbackType,
      createdAt:
        domain.createdAt instanceof Date
          ? domain.createdAt.toISOString()
          : domain.createdAt,
      profileOwner: domain.profileOwner,
    } as any;
  };

  private generateId = (): string => {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
}
