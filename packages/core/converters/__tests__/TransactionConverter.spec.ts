import { TransactionConverter } from '../TransactionConverter';
import { Transaction } from '../../models';
import { TransactionEntity } from '@nueink/aws';

describe('TransactionConverter', () => {
  let converter: TransactionConverter;

  beforeEach(() => {
    converter = new TransactionConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Transaction to entity Transaction', () => {
      const domain: Transaction = {
        transactionId: 'txn-123',
        financialAccountId: 'facc-456',
        organizationId: 'org-789',
        provider: 'plaid',
        externalTransactionId: 'plaid-ext-123',
        amount: -85.50,
        currency: 'USD',
        date: new Date('2024-01-15T00:00:00Z'),
        authorizedDate: new Date('2024-01-14T10:00:00Z'),
        merchantName: 'Whole Foods',
        name: 'Whole Foods Market',
        category: ['Food and Drink', 'Groceries'],
        primaryCategory: 'Food and Drink',
        pending: false,
        personId: 'person-101',
        receiptUrls: ['receipts/2024/receipt-123.pdf'],
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-202',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        transactionId: 'txn-123',
        financialAccountId: 'facc-456',
        organizationId: 'org-789',
        provider: 'plaid',
        externalTransactionId: 'plaid-ext-123',
        amount: -85.50,
        currency: 'USD',
        date: '2024-01-15T00:00:00.000Z',
        authorizedDate: '2024-01-14T10:00:00.000Z',
        merchantName: 'Whole Foods',
        name: 'Whole Foods Market',
        category: ['Food and Drink', 'Groceries'],
        primaryCategory: 'Food and Drink',
        pending: false,
        personId: 'person-101',
        receiptUrls: ['receipts/2024/receipt-123.pdf'],
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-202',
      });
    });

    it('should handle optional fields', () => {
      const domain: Transaction = {
        transactionId: 'txn-123',
        financialAccountId: 'facc-456',
        organizationId: 'org-789',
        provider: 'manual',
        amount: 1000,
        currency: 'USD',
        date: new Date('2024-01-15T00:00:00Z'),
        name: 'Cash Deposit',
        pending: true,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-202',
      };

      const entity = converter.toEntity(domain);

      expect(entity.externalTransactionId).toBeUndefined();
      expect(entity.authorizedDate).toBeUndefined();
      expect(entity.merchantName).toBeUndefined();
      expect(entity.category).toBeUndefined();
      expect(entity.primaryCategory).toBeUndefined();
      expect(entity.personId).toBeUndefined();
      expect(entity.receiptUrls).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity Transaction to domain Transaction', () => {
      const entity: TransactionEntity = {
        transactionId: 'txn-456',
        financialAccountId: 'facc-789',
        organizationId: 'org-101',
        provider: 'plaid',
        externalTransactionId: 'plaid-ext-456',
        amount: -45.25,
        currency: 'USD',
        date: '2024-01-20T00:00:00.000Z',
        authorizedDate: '2024-01-19T14:00:00.000Z',
        merchantName: 'Starbucks',
        name: 'Starbucks Coffee',
        category: ['Food and Drink', 'Coffee'],
        primaryCategory: 'Food and Drink',
        pending: false,
        personId: 'person-202',
        receiptUrls: ['receipts/2024/receipt-456.pdf'],
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T12:00:00.000Z',
        profileOwner: 'user-303',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        transactionId: 'txn-456',
        financialAccountId: 'facc-789',
        organizationId: 'org-101',
        provider: 'plaid',
        externalTransactionId: 'plaid-ext-456',
        amount: -45.25,
        currency: 'USD',
        date: new Date('2024-01-20T00:00:00.000Z'),
        authorizedDate: new Date('2024-01-19T14:00:00.000Z'),
        merchantName: 'Starbucks',
        name: 'Starbucks Coffee',
        category: ['Food and Drink', 'Coffee'],
        primaryCategory: 'Food and Drink',
        pending: false,
        personId: 'person-202',
        receiptUrls: ['receipts/2024/receipt-456.pdf'],
        createdAt: new Date('2024-01-20T10:00:00.000Z'),
        updatedAt: new Date('2024-01-20T12:00:00.000Z'),
        profileOwner: 'user-303',
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Transaction = {
        transactionId: 'txn-789',
        financialAccountId: 'facc-101',
        organizationId: 'org-202',
        provider: 'plaid',
        externalTransactionId: 'plaid-ext-789',
        amount: -125.99,
        currency: 'USD',
        date: new Date('2024-01-25T00:00:00Z'),
        authorizedDate: new Date('2024-01-24T15:30:00Z'),
        merchantName: 'Amazon',
        name: 'Amazon.com Purchase',
        category: ['Shops', 'Online'],
        primaryCategory: 'Shops',
        pending: false,
        personId: 'person-303',
        receiptUrls: ['receipts/2024/receipt-789.pdf'],
        createdAt: new Date('2024-01-25T10:00:00Z'),
        updatedAt: new Date('2024-01-25T11:00:00Z'),
        profileOwner: 'user-404',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
