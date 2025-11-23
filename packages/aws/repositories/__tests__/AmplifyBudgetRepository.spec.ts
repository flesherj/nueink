import { AmplifyBudgetRepository } from '../AmplifyBudgetRepository';
import { BudgetEntity, CategoryBudgetEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyBudgetRepository', () => {
  let repository: AmplifyBudgetRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  const mockCategoryBudgets: CategoryBudgetEntity[] = [
    {
      category: 'Groceries',
      budgetAmount: 50000,
      currentSpending: 48000,
      percentage: 33.3,
      trend: 'stable',
    },
    {
      category: 'Dining',
      budgetAmount: 30000,
      currentSpending: 32000,
      percentage: 20.0,
      trend: 'up',
    },
  ];

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyBudgetRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return budget when found', async () => {
      const mockData = {
        budgetId: 'budget-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        name: 'January 2024 Budget',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        categoryBudgets: mockCategoryBudgets,
        totalBudget: 150000,
        status: 'baseline',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
        sourceAnalysisId: 'analysis-123',
      };

      mockDbClient.models.Budget.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('budget-1');

      expect(mockDbClient.models.Budget.get).toHaveBeenCalledWith({
        budgetId: 'budget-1',
      });
      expect(result).toEqual(mockData);
    });

    it('should return null when budget not found', async () => {
      mockDbClient.models.Budget.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        budgetId: 'budget-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        name: 'Test Budget',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Budget.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('budget-1');

      expect(result?.profileOwner).toBeUndefined();
      expect(result?.sourceAnalysisId).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new budget with all fields', async () => {
      const entity: BudgetEntity = {
        budgetId: 'budget-new',
        accountId: 'acc-1',
        organizationId: 'org-1',
        name: 'February 2024 Budget',
        periodStart: '2024-02-01T00:00:00.000Z',
        periodEnd: '2024-02-29T23:59:59.999Z',
        categoryBudgets: mockCategoryBudgets,
        totalBudget: 150000,
        status: 'baseline',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        profileOwner: 'user-1',
        sourceAnalysisId: 'analysis-456',
      };

      mockDbClient.models.Budget.create.mockResolvedValue(
        createMockResponse(entity)
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Budget.create).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });

    it('should throw error when creation fails', async () => {
      const entity: BudgetEntity = {
        budgetId: 'budget-fail',
        accountId: 'acc-1',
        organizationId: 'org-1',
        name: 'Test Budget',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'baseline',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Budget.create.mockResolvedValue(
        createMockResponse(null)
      );

      await expect(repository.save(entity)).rejects.toThrow(
        'Failed to create Budget: response.data is null'
      );
    });
  });

  describe('update', () => {
    it('should update budget fields', async () => {
      const updates = {
        budgetId: 'budget-1',
        name: 'Updated Budget Name',
        status: 'active' as const,
        updatedAt: '2024-01-20T00:00:00.000Z',
      };

      const mockUpdated = {
        budgetId: 'budget-1',
        accountId: 'acc-1',
        organizationId: 'org-1',
        name: 'Updated Budget Name',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.999Z',
        categoryBudgets: mockCategoryBudgets,
        totalBudget: 150000,
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Budget.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('budget-1', updates);

      expect(mockDbClient.models.Budget.update).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        name: 'Updated Budget Name',
        status: 'active',
        updatedAt: '2024-01-20T00:00:00.000Z',
      });
      expect(result).toEqual(mockUpdated);
    });

    it('should throw error when update fails', async () => {
      mockDbClient.models.Budget.update.mockResolvedValue(
        createMockResponse(null)
      );

      await expect(
        repository.update('budget-1', { status: 'archived' })
      ).rejects.toThrow('Failed to update Budget: response.data is null');
    });
  });

  describe('delete', () => {
    it('should delete budget by ID', async () => {
      await repository.delete('budget-1');

      expect(mockDbClient.models.Budget.delete).toHaveBeenCalledWith({
        budgetId: 'budget-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return all budgets for organization', async () => {
      const mockBudgets = [
        {
          budgetId: 'budget-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'January Budget',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          categoryBudgets: mockCategoryBudgets,
          totalBudget: 150000,
          status: 'baseline',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
        {
          budgetId: 'budget-2',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'February Budget',
          periodStart: '2024-02-01T00:00:00.000Z',
          periodEnd: '2024-02-29T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 120000,
          status: 'active',
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockBudgets)
      );

      const result = await repository.findByOrganization('org-1');

      expect(
        mockDbClient.models.Budget.listBudgetByOrganizationId
      ).toHaveBeenCalledWith({
        organizationId: 'org-1',
      });
      expect(result).toEqual(mockBudgets);
      expect(result).toHaveLength(2);
    });
  });

  describe('findActiveByOrganization', () => {
    it('should return active budget for organization', async () => {
      const mockBudgets = [
        {
          budgetId: 'budget-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Baseline Budget',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 150000,
          status: 'baseline',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
        {
          budgetId: 'budget-2',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Active Budget',
          periodStart: '2024-02-01T00:00:00.000Z',
          periodEnd: '2024-02-29T23:59:59.999Z',
          categoryBudgets: mockCategoryBudgets,
          totalBudget: 120000,
          status: 'active',
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockBudgets)
      );

      const result = await repository.findActiveByOrganization('org-1');

      expect(result).toBeDefined();
      expect(result?.budgetId).toBe('budget-2');
      expect(result?.status).toBe('active');
    });

    it('should return null when no active budget exists', async () => {
      const mockBudgets = [
        {
          budgetId: 'budget-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Baseline Budget',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 150000,
          status: 'baseline',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockBudgets)
      );

      const result = await repository.findActiveByOrganization('org-1');

      expect(result).toBeNull();
    });
  });

  describe('findByAccount', () => {
    it('should return all budgets for account', async () => {
      const mockBudgets = [
        {
          budgetId: 'budget-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Budget 1',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 100000,
          status: 'baseline',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
      ];

      mockDbClient.models.Budget.listBudgetByAccountId.mockResolvedValue(
        createMockListResponse(mockBudgets)
      );

      const result = await repository.findByAccount('acc-1');

      expect(
        mockDbClient.models.Budget.listBudgetByAccountId
      ).toHaveBeenCalledWith({
        accountId: 'acc-1',
      });
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('findByStatus', () => {
    it('should return budgets filtered by status', async () => {
      const mockBudgets = [
        {
          budgetId: 'budget-1',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Baseline 1',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 100000,
          status: 'baseline',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
        {
          budgetId: 'budget-2',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Active Budget',
          periodStart: '2024-02-01T00:00:00.000Z',
          periodEnd: '2024-02-29T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 120000,
          status: 'active',
          createdAt: '2024-02-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
        {
          budgetId: 'budget-3',
          accountId: 'acc-1',
          organizationId: 'org-1',
          name: 'Baseline 2',
          periodStart: '2024-03-01T00:00:00.000Z',
          periodEnd: '2024-03-31T23:59:59.999Z',
          categoryBudgets: [],
          totalBudget: 110000,
          status: 'baseline',
          createdAt: '2024-03-01T00:00:00.000Z',
          updatedAt: '2024-03-01T00:00:00.000Z',
          profileOwner: 'user-1',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockBudgets)
      );

      const result = await repository.findByStatus('org-1', 'baseline');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('baseline');
      expect(result[1].status).toBe('baseline');
    });
  });
});
