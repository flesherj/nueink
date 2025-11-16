import { AmplifyTransactionRepository } from '../AmplifyTransactionRepository';
import { TransactionEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyTransactionRepository', () => {
  let repository: AmplifyTransactionRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyTransactionRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return transaction when found', async () => {
      const mockData = {
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalTransactionId: 'ext-1',
        amount: -50.25,
        currency: 'USD',
        date: '2025-01-15T10:30:00.000Z',
        authorizedDate: '2025-01-14T09:00:00.000Z',
        merchantName: 'Coffee Shop',
        name: 'Coffee Shop Purchase',
        status: 'posted',
        pending: false,
        personId: 'person-1',
        receiptUrls: ['s3://bucket/receipt.pdf'],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Transaction.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('txn-1');

      expect(mockDbClient.models.Transaction.get).toHaveBeenCalledWith({
        transactionId: 'txn-1',
      });
      expect(result).toEqual({
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalTransactionId: 'ext-1',
        amount: -50.25,
        currency: 'USD',
        date: '2025-01-15T10:30:00.000Z',
        authorizedDate: '2025-01-14T09:00:00.000Z',
        merchantName: 'Coffee Shop',
        name: 'Coffee Shop Purchase',
        status: 'posted',
        pending: false,
        personId: 'person-1',
        receiptUrls: ['s3://bucket/receipt.pdf'],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when transaction not found', async () => {
      mockDbClient.models.Transaction.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'manual',
        amount: 100.0,
        currency: 'USD',
        date: '2025-01-15T00:00:00.000Z',
        name: 'Manual Transaction',
        status: 'posted',
        pending: false,
        receiptUrls: [],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
      };

      mockDbClient.models.Transaction.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('txn-1');

      expect(result?.externalTransactionId).toBeUndefined();
      expect(result?.authorizedDate).toBeUndefined();
      expect(result?.merchantName).toBeUndefined();
      expect(result?.personId).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all transactions', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.25,
          currency: 'USD',
          date: '2025-01-15T10:30:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
        {
          transactionId: 'txn-2',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -25.0,
          currency: 'USD',
          date: '2025-01-14T15:00:00.000Z',
          name: 'Transaction 2',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-14T16:00:00.000Z',
          updatedAt: '2025-01-14T16:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.list.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findAll();

      expect(mockDbClient.models.Transaction.list).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].transactionId).toBe('txn-1');
      expect(result[1].transactionId).toBe('txn-2');
    });
  });

  describe('save', () => {
    it('should create new transaction with all fields', async () => {
      const entity: TransactionEntity = {
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalTransactionId: 'ext-1',
        amount: -50.25,
        currency: 'USD',
        date: '2025-01-15T10:30:00.000Z',
        authorizedDate: '2025-01-14T09:00:00.000Z',
        merchantName: 'Coffee Shop',
        name: 'Coffee Shop Purchase',
        status: 'posted',
        pending: false,
        personId: 'person-1',
        receiptUrls: ['s3://bucket/receipt.pdf'],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Transaction.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          date: entity.date,
          authorizedDate: entity.authorizedDate,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Transaction.create).toHaveBeenCalledWith({
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalTransactionId: 'ext-1',
        amount: -50.25,
        currency: 'USD',
        date: '2025-01-15T10:30:00.000Z',
        authorizedDate: '2025-01-14T09:00:00.000Z',
        merchantName: 'Coffee Shop',
        name: 'Coffee Shop Purchase',
        status: 'posted',
        pending: false,
        personId: 'person-1',
        receiptUrls: ['s3://bucket/receipt.pdf'],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update transaction with partial data', async () => {
      const updates = {
        personId: 'person-2',
      };

      const mockUpdated = {
        transactionId: 'txn-1',
        financialAccountId: 'acc-1',
        organizationId: 'org-1',
        provider: 'plaid',
        amount: -50.25,
        currency: 'USD',
        date: '2025-01-15T10:30:00.000Z',
        name: 'Transaction',
        status: 'posted',
        pending: false,
        personId: 'person-2',
        receiptUrls: [],
        createdAt: '2025-01-15T12:00:00.000Z',
        updatedAt: '2025-01-15T13:00:00.000Z',
      };

      mockDbClient.models.Transaction.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('txn-1', updates);

      expect(mockDbClient.models.Transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'txn-1',
          personId: 'person-2',
        })
      );
      expect(result.personId).toBe('person-2');
    });
  });

  describe('delete', () => {
    it('should delete transaction by id', async () => {
      mockDbClient.models.Transaction.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('txn-1');

      expect(mockDbClient.models.Transaction.delete).toHaveBeenCalledWith({
        transactionId: 'txn-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return paginated transactions for organization', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate.mockResolvedValue(
        { ...createMockListResponse(mockData), nextToken: 'next-cursor' }
      );

      const result = await repository.findByOrganization('org-1', 50, undefined);

      expect(mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate).toHaveBeenCalledWith(
        { organizationId: 'org-1' },
        { limit: 50, nextToken: undefined }
      );
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('next-cursor');
      expect(result.hasMore).toBe(true);
    });

    it('should handle last page of results', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(result.nextCursor).toBeUndefined();
      expect(result.hasMore).toBe(false);
    });
  });

  describe('findByFinancialAccount', () => {
    it('should return paginated transactions for financial account', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByFinancialAccountIdAndDate.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByFinancialAccount('acc-1');

      expect(mockDbClient.models.Transaction.listTransactionByFinancialAccountIdAndDate).toHaveBeenCalledWith(
        { financialAccountId: 'acc-1' },
        { limit: 50, nextToken: undefined }
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findByPerson', () => {
    it('should return paginated transactions for person', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          personId: 'person-1',
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByPersonIdAndDate.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByPerson('person-1');

      expect(mockDbClient.models.Transaction.listTransactionByPersonIdAndDate).toHaveBeenCalledWith(
        { personId: 'person-1' },
        { limit: 50, nextToken: undefined }
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].personId).toBe('person-1');
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T10:00:00.000Z',
          name: 'Transaction 1',
          category: [],
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
        {
          transactionId: 'txn-2',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -25.0,
          currency: 'USD',
          date: '2025-01-20T10:00:00.000Z',
          name: 'Transaction 2',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-20T12:00:00.000Z',
          updatedAt: '2025-01-20T12:00:00.000Z',
        },
        {
          transactionId: 'txn-3',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -10.0,
          currency: 'USD',
          date: '2025-02-01T10:00:00.000Z',
          name: 'Transaction 3',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-02-01T12:00:00.000Z',
          updatedAt: '2025-02-01T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const startDate = '2025-01-10T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.999Z';

      const result = await repository.findByDateRange('org-1', startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result.find((t) => t.transactionId === 'txn-1')).toBeDefined();
      expect(result.find((t) => t.transactionId === 'txn-2')).toBeDefined();
      expect(result.find((t) => t.transactionId === 'txn-3')).toBeUndefined();
    });
  });

  describe('findByExternalTransactionId', () => {
    it('should return transaction by external ID', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          externalTransactionId: 'ext-123',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByExternalTransactionId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByExternalTransactionId('ext-123');

      expect(mockDbClient.models.Transaction.listTransactionByExternalTransactionId).toHaveBeenCalledWith({
        externalTransactionId: 'ext-123',
      });
      expect(result).not.toBeNull();
      expect(result?.externalTransactionId).toBe('ext-123');
    });

    it('should return null when external ID not found', async () => {
      mockDbClient.models.Transaction.listTransactionByExternalTransactionId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByExternalTransactionId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findRecent', () => {
    it('should return recent transactions with limit', async () => {
      const mockData = [
        {
          transactionId: 'txn-1',
          financialAccountId: 'acc-1',
          organizationId: 'org-1',
          provider: 'plaid',
          amount: -50.0,
          currency: 'USD',
          date: '2025-01-15T00:00:00.000Z',
          name: 'Transaction 1',
          status: 'posted',
          pending: false,
          receiptUrls: [],
          createdAt: '2025-01-15T12:00:00.000Z',
          updatedAt: '2025-01-15T12:00:00.000Z',
        },
      ];

      mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findRecent('org-1', 10);

      expect(mockDbClient.models.Transaction.listTransactionByOrganizationIdAndDate).toHaveBeenCalledWith(
        { organizationId: 'org-1' },
        { limit: 10 }
      );
      expect(result).toHaveLength(1);
    });
  });
});
