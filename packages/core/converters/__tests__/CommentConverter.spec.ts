import { CommentConverter } from '../CommentConverter';
import { Comment } from '../../models';
import { CommentEntity } from '@nueink/aws';

describe('CommentConverter', () => {
  let converter: CommentConverter;

  beforeEach(() => {
    converter = new CommentConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Comment to entity Comment', () => {
      const domain: Comment = {
        commentId: 'cmt-123',
        transactionId: 'txn-456',
        accountId: 'acc-789',
        organizationId: 'org-123',
        text: 'This is a test comment',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        commentId: 'cmt-123',
        transactionId: 'txn-456',
        accountId: 'acc-789',
        organizationId: 'org-123',
        text: 'This is a test comment',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-101',
      });
    });
  });

  describe('toDomain', () => {
    it('should convert entity Comment to domain Comment', () => {
      const entity: CommentEntity = {
        commentId: 'cmt-456',
        transactionId: 'txn-789',
        accountId: 'acc-101',
        organizationId: 'org-456',
        text: 'Another comment',
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        commentId: 'cmt-456',
        transactionId: 'txn-789',
        accountId: 'acc-101',
        organizationId: 'org-456',
        text: 'Another comment',
        createdAt: new Date('2024-01-20T10:00:00.000Z'),
        updatedAt: new Date('2024-01-20T12:00:00.000Z'),
        profileOwner: 'user-202',
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Comment = {
        commentId: 'cmt-789',
        transactionId: 'txn-101',
        accountId: 'acc-202',
        organizationId: 'org-789',
        text: 'Important note about this transaction',
        createdAt: new Date('2024-01-25T10:00:00Z'),
        updatedAt: new Date('2024-01-25T11:00:00Z'),
        profileOwner: 'user-303',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
