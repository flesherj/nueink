import { AmplifyBudgetRepository } from '../AmplifyBudgetRepository';
import { BudgetEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyBudgetRepository', () => {
  let repository: AmplifyBudgetRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

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
        organizationId: 'org-1',
        category: 'Food and Drink',
        amount: 500.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        spent: 234.56,
        remaining: 265.44,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Budget.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('budget-1');

      expect(mockDbClient.models.Budget.get).toHaveBeenCalledWith({
        budgetId: 'budget-1',
      });
      expect(result).toEqual({
        budgetId: 'budget-1',
        organizationId: 'org-1',
        category: 'Food and Drink',
        amount: 500.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        spent: 234.56,
        remaining: 265.44,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
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
        organizationId: 'org-1',
        category: 'Entertainment',
        amount: 200.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Budget.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('budget-1');

      expect(result?.spent).toBeUndefined();
      expect(result?.remaining).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new budget with all fields', async () => {
      const entity: BudgetEntity = {
        budgetId: 'budget-1',
        organizationId: 'org-1',
        category: 'Food and Drink',
        amount: 500.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        spent: 234.56,
        remaining: 265.44,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Budget.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          startDate: entity.startDate,
          endDate: entity.endDate,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Budget.create).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        organizationId: 'org-1',
        category: 'Food and Drink',
        amount: 500.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        spent: 234.56,
        remaining: 265.44,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create budget with only required fields', async () => {
      const entity: BudgetEntity = {
        budgetId: 'budget-1',
        organizationId: 'org-1',
        category: 'Transportation',
        amount: 300.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Budget.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          startDate: entity.startDate,
          endDate: entity.endDate,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
      );

      const result = await repository.save(entity);

      expect(result.category).toBe('Transportation');
    });
  });

  describe('update', () => {
    it('should update budget spent and remaining', async () => {
      const updates = {
        spent: 350.0,
        remaining: 150.0,
        updatedAt: '2025-01-20T12:00:00.000Z',
      };

      const mockUpdated = {
        budgetId: 'budget-1',
        organizationId: 'org-1',
        category: 'Food and Drink',
        amount: 500.0,
        period: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-31T23:59:59.999Z',
        spent: 350.0,
        remaining: 150.0,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-20T12:00:00.000Z',
      };

      mockDbClient.models.Budget.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('budget-1', updates);

      expect(mockDbClient.models.Budget.update).toHaveBeenCalledWith({
        budgetId: 'budget-1',
        spent: 350.0,
        remaining: 150.0,
        updatedAt: '2025-01-20T12:00:00.000Z',
      });
      expect(result.spent).toBe(350.0);
      expect(result.remaining).toBe(150.0);
    });
  });

  describe('delete', () => {
    it('should delete budget by id', async () => {
      mockDbClient.models.Budget.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('budget-1');

      expect(mockDbClient.models.Budget.delete).toHaveBeenCalledWith({
        budgetId: 'budget-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return all budgets for an organization', async () => {
      const mockData = [
        {
          budgetId: 'budget-1',
          organizationId: 'org-1',
          category: 'Food and Drink',
          amount: 500.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          budgetId: 'budget-2',
          organizationId: 'org-1',
          category: 'Transportation',
          amount: 300.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(mockDbClient.models.Budget.listBudgetByOrganizationId).toHaveBeenCalledWith({
        organizationId: 'org-1',
      });
      expect(result).toHaveLength(2);
      expect(result.every((b) => b.organizationId === 'org-1')).toBe(true);
    });
  });

  describe('findActiveByOrganization', () => {
    it('should return only active budgets', async () => {
      const mockData = [
        {
          budgetId: 'budget-1',
          organizationId: 'org-1',
          category: 'Food and Drink',
          amount: 500.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          budgetId: 'budget-2',
          organizationId: 'org-1',
          category: 'Transportation',
          amount: 300.0,
          period: 'monthly',
          startDate: '2024-12-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
          status: 'inactive',
          createdAt: '2024-12-01T00:00:00.000Z',
          updatedAt: '2024-12-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findActiveByOrganization('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(result.find((b) => b.budgetId === 'budget-2')).toBeUndefined();
    });
  });

  describe('findByCategory', () => {
    it('should return budget by category', async () => {
      const mockData = [
        {
          budgetId: 'budget-1',
          organizationId: 'org-1',
          category: 'Food and Drink',
          amount: 500.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          budgetId: 'budget-2',
          organizationId: 'org-1',
          category: 'Transportation',
          amount: 300.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByCategory('org-1', 'Food and Drink');

      expect(result).not.toBeNull();
      expect(result?.category).toBe('Food and Drink');
    });

    it('should return null when category not found', async () => {
      const mockData = [
        {
          budgetId: 'budget-1',
          organizationId: 'org-1',
          category: 'Food and Drink',
          amount: 500.0,
          period: 'monthly',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-01-31T23:59:59.999Z',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Budget.listBudgetByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByCategory('org-1', 'Nonexistent Category');

      expect(result).toBeNull();
    });
  });
});
