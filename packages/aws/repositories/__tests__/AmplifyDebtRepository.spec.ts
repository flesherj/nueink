import { AmplifyDebtRepository } from '../AmplifyDebtRepository';
import { DebtEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyDebtRepository', () => {
  let repository: AmplifyDebtRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyDebtRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return debt when found', async () => {
      const mockData = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        financialAccountId: 'facc-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 35000.0,
        interestRate: 0.0499,
        minimumPayment: 350.0,
        dueDate: 15,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Debt.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('debt-1');

      expect(mockDbClient.models.Debt.get).toHaveBeenCalledWith({
        debtId: 'debt-1',
      });
      expect(result).toEqual({
        debtId: 'debt-1',
        organizationId: 'org-1',
        financialAccountId: 'facc-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 35000.0,
        interestRate: 0.0499,
        minimumPayment: 350.0,
        dueDate: 15,
        status: 'active',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-15T12:00:00.000Z'),
        profileOwner: 'user-1',
      });
    });

    it('should return null when debt not found', async () => {
      mockDbClient.models.Debt.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        name: 'Personal Loan',
        type: 'other',
        originalBalance: 10000.0,
        currentBalance: 7500.0,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Debt.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('debt-1');

      expect(result?.financialAccountId).toBeUndefined();
      expect(result?.interestRate).toBeUndefined();
      expect(result?.minimumPayment).toBeUndefined();
      expect(result?.dueDate).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new debt with all fields', async () => {
      const entity: DebtEntity = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        financialAccountId: 'facc-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 35000.0,
        interestRate: 0.0499,
        minimumPayment: 350.0,
        dueDate: 15,
        status: 'active',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-15T12:00:00.000Z'),
        profileOwner: 'user-1',
      };

      mockDbClient.models.Debt.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Debt.create).toHaveBeenCalledWith({
        debtId: 'debt-1',
        organizationId: 'org-1',
        financialAccountId: 'facc-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 35000.0,
        interestRate: 0.0499,
        minimumPayment: 350.0,
        dueDate: 15,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-15T12:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create debt with only required fields', async () => {
      const entity: DebtEntity = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        name: 'Personal Loan',
        type: 'other',
        originalBalance: 10000.0,
        currentBalance: 7500.0,
        status: 'active',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      };

      mockDbClient.models.Debt.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt.toISOString(),
          updatedAt: entity.updatedAt.toISOString(),
        })
      );

      const result = await repository.save(entity);

      expect(result.name).toBe('Personal Loan');
    });
  });

  describe('update', () => {
    it('should update debt balance and payment info', async () => {
      const updates = {
        currentBalance: 34500.0,
        minimumPayment: 360.0,
        updatedAt: new Date('2025-02-01T12:00:00.000Z'),
      };

      const mockUpdated = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 34500.0,
        minimumPayment: 360.0,
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-02-01T12:00:00.000Z',
      };

      mockDbClient.models.Debt.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('debt-1', updates);

      expect(mockDbClient.models.Debt.update).toHaveBeenCalledWith({
        debtId: 'debt-1',
        currentBalance: 34500.0,
        minimumPayment: 360.0,
        updatedAt: '2025-02-01T12:00:00.000Z',
      });
      expect(result.currentBalance).toBe(34500.0);
      expect(result.minimumPayment).toBe(360.0);
    });

    it('should update debt status to paid_off', async () => {
      const updates = {
        currentBalance: 0.0,
        status: 'paid_off' as const,
        updatedAt: new Date('2025-06-01T12:00:00.000Z'),
      };

      const mockUpdated = {
        debtId: 'debt-1',
        organizationId: 'org-1',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000.0,
        currentBalance: 0.0,
        status: 'paid_off',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T12:00:00.000Z',
      };

      mockDbClient.models.Debt.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('debt-1', updates);

      expect(result.status).toBe('paid_off');
      expect(result.currentBalance).toBe(0.0);
    });
  });

  describe('delete', () => {
    it('should delete debt by id', async () => {
      mockDbClient.models.Debt.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('debt-1');

      expect(mockDbClient.models.Debt.delete).toHaveBeenCalledWith({
        debtId: 'debt-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return all debts for an organization', async () => {
      const mockData = [
        {
          debtId: 'debt-1',
          organizationId: 'org-1',
          name: 'Student Loan',
          type: 'loan',
          originalBalance: 50000.0,
          currentBalance: 35000.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          debtId: 'debt-2',
          organizationId: 'org-1',
          name: 'Credit Card',
          type: 'credit_card',
          originalBalance: 5000.0,
          currentBalance: 2500.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Debt.listDebtByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(mockDbClient.models.Debt.listDebtByOrganizationId).toHaveBeenCalledWith({
        organizationId: 'org-1',
      });
      expect(result).toHaveLength(2);
      expect(result.every((d) => d.organizationId === 'org-1')).toBe(true);
    });
  });

  describe('findActiveByOrganization', () => {
    it('should return only active debts', async () => {
      const mockData = [
        {
          debtId: 'debt-1',
          organizationId: 'org-1',
          name: 'Student Loan',
          type: 'loan',
          originalBalance: 50000.0,
          currentBalance: 35000.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          debtId: 'debt-2',
          organizationId: 'org-1',
          name: 'Old Loan',
          type: 'loan',
          originalBalance: 10000.0,
          currentBalance: 0.0,
          status: 'paid_off',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-12-15T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Debt.listDebtByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findActiveByOrganization('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(result.find((d) => d.debtId === 'debt-2')).toBeUndefined();
    });
  });

  describe('findByFinancialAccount', () => {
    it('should return debt linked to financial account', async () => {
      const mockData = [
        {
          debtId: 'debt-1',
          organizationId: 'org-1',
          financialAccountId: 'facc-1',
          name: 'Chase Credit Card',
          type: 'credit_card',
          originalBalance: 10000.0,
          currentBalance: 3000.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          debtId: 'debt-2',
          organizationId: 'org-1',
          financialAccountId: 'facc-2',
          name: 'Another Card',
          type: 'credit_card',
          originalBalance: 5000.0,
          currentBalance: 1000.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Debt.listDebtByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByFinancialAccount('org-1', 'facc-1');

      expect(result).not.toBeNull();
      expect(result?.financialAccountId).toBe('facc-1');
    });

    it('should return null when no debt linked to financial account', async () => {
      const mockData = [
        {
          debtId: 'debt-1',
          organizationId: 'org-1',
          financialAccountId: 'facc-2',
          name: 'Card',
          type: 'credit_card',
          originalBalance: 5000.0,
          currentBalance: 1000.0,
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Debt.listDebtByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByFinancialAccount('org-1', 'facc-1');

      expect(result).toBeNull();
    });
  });
});
