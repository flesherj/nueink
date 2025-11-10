import { AmplifyCommentRepository } from '../AmplifyCommentRepository';
import { CommentEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyCommentRepository', () => {
  let repository: AmplifyCommentRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyCommentRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return comment when found', async () => {
      const mockData = {
        commentId: 'cmt-1',
        transactionId: 'txn-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        text: 'This is a test comment',
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Comment.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('cmt-1');

      expect(mockDbClient.models.Comment.get).toHaveBeenCalledWith({
        commentId: 'cmt-1',
      });
      expect(result).toEqual({
        commentId: 'cmt-1',
        transactionId: 'txn-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        text: 'This is a test comment',
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when comment not found', async () => {
      mockDbClient.models.Comment.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should create new comment', async () => {
      const entity: CommentEntity = {
        commentId: 'cmt-1',
        transactionId: 'txn-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        text: 'This is a test comment',
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Comment.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Comment.create).toHaveBeenCalledWith({
        commentId: 'cmt-1',
        transactionId: 'txn-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        text: 'This is a test comment',
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update comment text', async () => {
      const updates = {
        text: 'Updated comment',
        updatedAt: '2025-01-15T13:00:00.000Z',
      };

      const mockUpdated = {
        commentId: 'cmt-1',
        transactionId: 'txn-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        text: 'Updated comment',
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T13:00:00.000Z',
      };

      mockDbClient.models.Comment.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('cmt-1', updates);

      expect(mockDbClient.models.Comment.update).toHaveBeenCalledWith({
        commentId: 'cmt-1',
        text: 'Updated comment',
        updatedAt: '2025-01-15T13:00:00.000Z',
      });
      expect(result.text).toBe('Updated comment');
    });
  });

  describe('delete', () => {
    it('should delete comment by id', async () => {
      mockDbClient.models.Comment.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('cmt-1');

      expect(mockDbClient.models.Comment.delete).toHaveBeenCalledWith({
        commentId: 'cmt-1',
      });
    });
  });

  describe('findByTransaction', () => {
    it('should return all comments for a transaction', async () => {
      const mockData = [
        {
          commentId: 'cmt-1',
          transactionId: 'txn-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          text: 'First comment',
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
        {
          commentId: 'cmt-2',
          transactionId: 'txn-1',
          accountId: 'acc-2',
          organizationId: 'org-1',
          text: 'Second comment',
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T13:00:00.000Z',
        },
      ];

      mockDbClient.models.Comment.listCommentByTransactionIdAndCreatedAt.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByTransaction('txn-1');

      expect(mockDbClient.models.Comment.listCommentByTransactionIdAndCreatedAt).toHaveBeenCalledWith({
        transactionId: 'txn-1',
      });
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.transactionId === 'txn-1')).toBe(true);
    });
  });

  describe('findByOrganization', () => {
    it('should return paginated comments for organization', async () => {
      const mockData = [
        {
          commentId: 'cmt-1',
          transactionId: 'txn-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          text: 'Comment',
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Comment.listCommentByOrganizationIdAndCreatedAt.mockResolvedValue(
        { ...createMockListResponse(mockData), nextToken: 'cursor-123' }
      );

      const result = await repository.findByOrganization('org-1', 50);

      expect(mockDbClient.models.Comment.listCommentByOrganizationIdAndCreatedAt).toHaveBeenCalledWith(
        { organizationId: 'org-1' },
        { limit: 50, nextToken: undefined }
      );
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('cursor-123');
      expect(result.hasMore).toBe(true);
    });
  });

  describe('findByAccount', () => {
    it('should return comments by account', async () => {
      const mockData = [
        {
          commentId: 'cmt-1',
          transactionId: 'txn-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          text: 'My comment',
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
        {
          commentId: 'cmt-2',
          transactionId: 'txn-2',
          accountId: 'acc-2',
          organizationId: 'org-1',
          text: 'Other comment',
          createdAt: '2025-01-15T13:00:00.000Z',
          updatedAt: '2025-01-15T13:00:00.000Z',
        },
      ];

      mockDbClient.models.Comment.list.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByAccount('acc-1');

      expect(result).toHaveLength(1);
      expect(result[0].accountId).toBe('acc-1');
      expect(result.find((c) => c.accountId === 'acc-2')).toBeUndefined();
    });
  });
});
