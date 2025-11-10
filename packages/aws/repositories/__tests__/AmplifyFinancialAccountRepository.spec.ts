import { AmplifyFinancialAccountRepository } from '../AmplifyFinancialAccountRepository';
import { FinancialAccountEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyFinancialAccountRepository', () => {
  let repository: AmplifyFinancialAccountRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyFinancialAccountRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return financial account when found', async () => {
      const mockData = {
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalAccountId: 'ext_acc_123',
        name: 'Chase Freedom',
        officialName: 'Chase Freedom Unlimited',
        mask: '1234',
        type: 'credit',
        subtype: 'credit_card',
        currentBalance: 1500.75,
        availableBalance: 8499.25,
        currency: 'USD',
        personId: 'person-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.FinancialAccount.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('facc-1');

      expect(mockDbClient.models.FinancialAccount.get).toHaveBeenCalledWith({
        financialAccountId: 'facc-1',
      });
      expect(result).toEqual({
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalAccountId: 'ext_acc_123',
        name: 'Chase Freedom',
        officialName: 'Chase Freedom Unlimited',
        mask: '1234',
        type: 'credit',
        subtype: 'credit_card',
        currentBalance: 1500.75,
        availableBalance: 8499.25,
        currency: 'USD',
        personId: 'person-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when financial account not found', async () => {
      mockDbClient.models.FinancialAccount.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'manual',
        name: 'Savings Account',
        type: 'depository',
        currency: 'USD',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.FinancialAccount.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('facc-1');

      expect(result?.externalAccountId).toBeUndefined();
      expect(result?.officialName).toBeUndefined();
      expect(result?.mask).toBeUndefined();
      expect(result?.subtype).toBeUndefined();
      expect(result?.currentBalance).toBeUndefined();
      expect(result?.availableBalance).toBeUndefined();
      expect(result?.personId).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new financial account with all fields', async () => {
      const entity: FinancialAccountEntity = {
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalAccountId: 'ext_acc_123',
        name: 'Chase Freedom',
        officialName: 'Chase Freedom Unlimited',
        mask: '1234',
        type: 'credit',
        subtype: 'credit_card',
        currentBalance: 1500.75,
        availableBalance: 8499.25,
        currency: 'USD',
        personId: 'person-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.FinancialAccount.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.FinancialAccount.create).toHaveBeenCalledWith({
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalAccountId: 'ext_acc_123',
        name: 'Chase Freedom',
        officialName: 'Chase Freedom Unlimited',
        mask: '1234',
        type: 'credit',
        subtype: 'credit_card',
        currentBalance: 1500.75,
        availableBalance: 8499.25,
        currency: 'USD',
        personId: 'person-1',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update financial account balances', async () => {
      const updates = {
        currentBalance: 1600.0,
        availableBalance: 8400.0,
        updatedAt: '2025-01-16T10:00:00.000Z',
      };

      const mockUpdated = {
        financialAccountId: 'facc-1',
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        name: 'Chase Freedom',
        type: 'credit',
        currency: 'USD',
        currentBalance: 1600.0,
        availableBalance: 8400.0,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-16T10:00:00.000Z',
      };

      mockDbClient.models.FinancialAccount.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('facc-1', updates);

      expect(mockDbClient.models.FinancialAccount.update).toHaveBeenCalledWith({
        financialAccountId: 'facc-1',
        currentBalance: 1600.0,
        availableBalance: 8400.0,
        updatedAt: '2025-01-16T10:00:00.000Z',
      });
      expect(result.currentBalance).toBe(1600.0);
      expect(result.availableBalance).toBe(8400.0);
    });
  });

  describe('findByOrganization', () => {
    it('should return paginated financial accounts for organization', async () => {
      const mockData = [
        {
          financialAccountId: 'facc-1',
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          name: 'Checking',
          type: 'depository',
          currency: 'USD',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.FinancialAccount.listFinancialAccountByOrganizationId.mockResolvedValue(
        { ...createMockListResponse(mockData), nextToken: 'cursor-123' }
      );

      const result = await repository.findByOrganization('org-1', 50);

      expect(mockDbClient.models.FinancialAccount.listFinancialAccountByOrganizationId).toHaveBeenCalledWith(
        { organizationId: 'org-1' },
        { limit: 50, nextToken: undefined }
      );
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('cursor-123');
      expect(result.hasMore).toBe(true);
    });
  });

  describe('findByInstitution', () => {
    it('should return all financial accounts for an institution', async () => {
      const mockData = [
        {
          financialAccountId: 'facc-1',
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          name: 'Checking',
          type: 'depository',
          currency: 'USD',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          financialAccountId: 'facc-2',
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          name: 'Savings',
          type: 'depository',
          currency: 'USD',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.FinancialAccount.listFinancialAccountByInstitutionId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByInstitution('inst-1');

      expect(mockDbClient.models.FinancialAccount.listFinancialAccountByInstitutionId).toHaveBeenCalledWith({
        institutionId: 'inst-1',
      });
      expect(result).toHaveLength(2);
      expect(result.every((acc) => acc.institutionId === 'inst-1')).toBe(true);
    });
  });

  describe('findByExternalAccountId', () => {
    it('should return financial account by external account ID', async () => {
      const mockData = [
        {
          financialAccountId: 'facc-1',
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          externalAccountId: 'ext_acc_123',
          name: 'Checking',
          type: 'depository',
          currency: 'USD',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.FinancialAccount.listFinancialAccountByExternalAccountId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByExternalAccountId('ext_acc_123');

      expect(mockDbClient.models.FinancialAccount.listFinancialAccountByExternalAccountId).toHaveBeenCalledWith({
        externalAccountId: 'ext_acc_123',
      });
      expect(result).not.toBeNull();
      expect(result?.externalAccountId).toBe('ext_acc_123');
    });

    it('should return null when external account ID not found', async () => {
      mockDbClient.models.FinancialAccount.listFinancialAccountByExternalAccountId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByExternalAccountId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
