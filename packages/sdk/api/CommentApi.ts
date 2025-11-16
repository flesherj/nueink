import { AwsAmplifyApiFactory } from './AwsAmplifyApiFactory';
import type { Comment } from '@nueink/core';

/**
 * Comment API Client
 *
 * Client-side API for comment operations.
 * All requests are authenticated with Cognito credentials.
 */
export class CommentApi {
  private api = AwsAmplifyApiFactory.getInstance();

  public static create = () => new CommentApi();

  /**
   * Get all comments for a transaction
   * GET /comment/transaction/:transactionId
   */
  public listByTransaction = async (transactionId: string): Promise<Comment[]> => {
    const response = await this.api.get(`/comment/transaction/${transactionId}`).response;
    return (await response.body.json()) as unknown as Comment[];
  };

  /**
   * Get a specific comment by ID
   * GET /comment/:commentId
   */
  public getById = async (commentId: string): Promise<Comment> => {
    const response = await this.api.get(`/comment/${commentId}`).response;
    return (await response.body.json()) as unknown as Comment;
  };

  /**
   * Create a new comment
   * POST /comment
   */
  public create = async (comment: {
    transactionId: string;
    accountId: string;
    organizationId: string;
    text: string;
    profileOwner: string;
  }): Promise<Comment> => {
    const response = await this.api.post('/comment', comment).response;
    return (await response.body.json()) as unknown as Comment;
  };

  /**
   * Update an existing comment
   * PUT /comment/:commentId
   */
  public update = async (commentId: string, text: string): Promise<Comment> => {
    const response = await this.api.put(`/comment/${commentId}`, { text }).response;
    return (await response.body.json()) as unknown as Comment;
  };

  /**
   * Delete a comment
   * DELETE /comment/:commentId
   */
  public delete = async (commentId: string): Promise<void> => {
    await this.api.del(`/comment/${commentId}`).response;
  };

  /**
   * Get all comments by an account
   * GET /comment/account/:accountId
   */
  public listByAccount = async (accountId: string): Promise<Comment[]> => {
    const response = await this.api.get(`/comment/account/${accountId}`).response;
    return (await response.body.json()) as unknown as Comment[];
  };

  /**
   * Get all comments for an organization (paginated)
   * GET /comment/organization/:organizationId?limit=10&cursor=xyz
   */
  public listByOrganization = async (
    organizationId: string,
    limit?: number,
    cursor?: string
  ): Promise<{
    items: Comment[];
    nextCursor?: string;
    hasMore: boolean;
  }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const queryString = params.toString();
    const path = `/comment/organization/${organizationId}${queryString ? `?${queryString}` : ''}`;

    const response = await this.api.get(path).response;
    return (await response.body.json()) as unknown as {
      items: Comment[];
      nextCursor?: string;
      hasMore: boolean;
    };
  };
}
