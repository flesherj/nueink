import { BudgetConverter } from '../BudgetConverter';
import { Budget, CategoryBudget } from '../../models';
import { BudgetEntity, CategoryBudgetEntity } from '@nueink/aws';

describe('BudgetConverter', () => {
  let converter: BudgetConverter;

  beforeEach(() => {
    converter = new BudgetConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Budget to entity Budget', () => {
      const categoryBudgets: CategoryBudget[] = [
        {
          category: 'Groceries',
          budgetAmount: 50000,
          currentSpending: 48000,
          percentage: 33.3,
          trend: 'stable',
          notes: 'Food and household items',
        },
        {
          category: 'Dining',
          budgetAmount: 30000,
          currentSpending: 35000,
          percentage: 20.0,
          trend: 'up',
        },
      ];

      const domain: Budget = {
        budgetId: 'bdg-123',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'January 2024 Budget',
        periodStart: new Date('2024-01-01T00:00:00Z'),
        periodEnd: new Date('2024-01-31T23:59:59Z'),
        categoryBudgets,
        totalBudget: 150000,
        status: 'baseline',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
        sourceAnalysisId: 'analysis-abc',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        budgetId: 'bdg-123',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'January 2024 Budget',
        periodStart: '2024-01-01T00:00:00.000Z',
        periodEnd: '2024-01-31T23:59:59.000Z',
        categoryBudgets,
        totalBudget: 150000,
        status: 'baseline',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-101',
        sourceAnalysisId: 'analysis-abc',
      });
    });

    it('should convert dates to ISO strings', () => {
      const domain: Budget = {
        budgetId: 'bdg-123',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'Test Budget',
        periodStart: new Date('2024-02-01T10:30:00Z'),
        periodEnd: new Date('2024-02-29T23:59:59Z'),
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.periodStart).toBe('2024-02-01T10:30:00.000Z');
      expect(entity.periodEnd).toBe('2024-02-29T23:59:59.000Z');
      expect(entity.createdAt).toBe('2024-01-15T10:00:00.000Z');
      expect(entity.updatedAt).toBe('2024-01-16T10:00:00.000Z');
    });

    it('should handle budget without sourceAnalysisId', () => {
      const domain: Budget = {
        budgetId: 'bdg-123',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'Manual Budget',
        periodStart: new Date('2024-01-01T00:00:00Z'),
        periodEnd: new Date('2024-01-31T23:59:59Z'),
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'optimized',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.sourceAnalysisId).toBeUndefined();
    });

    it('should convert categoryBudgets array to entity format', () => {
      const categoryBudgets: CategoryBudget[] = [
        {
          category: 'Transportation',
          budgetAmount: 20000,
          percentage: 15.0,
        },
        {
          category: 'Entertainment',
          budgetAmount: 10000,
          currentSpending: 12000,
          percentage: 7.5,
          trend: 'up',
          notes: 'Over budget',
        },
      ];

      const domain: Budget = {
        budgetId: 'bdg-123',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'Test Budget',
        periodStart: new Date('2024-01-01T00:00:00Z'),
        periodEnd: new Date('2024-01-31T23:59:59Z'),
        categoryBudgets,
        totalBudget: 130000,
        status: 'baseline',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.categoryBudgets).toEqual(categoryBudgets);
      expect(entity.categoryBudgets.length).toBe(2);
      expect(entity.categoryBudgets[0].category).toBe('Transportation');
      expect(entity.categoryBudgets[1].notes).toBe('Over budget');
    });
  });

  describe('toDomain', () => {
    it('should convert entity Budget to domain Budget', () => {
      const categoryBudgets: CategoryBudgetEntity[] = [
        {
          category: 'Housing',
          budgetAmount: 100000,
          currentSpending: 98000,
          percentage: 50.0,
          trend: 'stable',
        },
        {
          category: 'Utilities',
          budgetAmount: 20000,
          percentage: 10.0,
        },
      ];

      const entity: BudgetEntity = {
        budgetId: 'bdg-456',
        accountId: 'acc-789',
        organizationId: 'org-101',
        name: 'February 2024 Budget',
        periodStart: '2024-02-01T00:00:00.000Z',
        periodEnd: '2024-02-29T23:59:59.000Z',
        categoryBudgets,
        totalBudget: 200000,
        status: 'active',
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T12:00:00.000Z',
        profileOwner: 'user-202',
        sourceAnalysisId: 'analysis-xyz',
      };

      const domain = converter.toDomain(entity);

      expect(domain.budgetId).toBe('bdg-456');
      expect(domain.accountId).toBe('acc-789');
      expect(domain.organizationId).toBe('org-101');
      expect(domain.name).toBe('February 2024 Budget');
      expect(domain.totalBudget).toBe(200000);
      expect(domain.status).toBe('active');
      expect(domain.profileOwner).toBe('user-202');
      expect(domain.sourceAnalysisId).toBe('analysis-xyz');
      expect(domain.categoryBudgets).toEqual(categoryBudgets);
      expect(domain.periodStart).toBeInstanceOf(Date);
      expect(domain.periodEnd).toBeInstanceOf(Date);
      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
    });

    it('should convert all date fields correctly', () => {
      const entity: BudgetEntity = {
        budgetId: 'bdg-456',
        accountId: 'acc-789',
        organizationId: 'org-101',
        name: 'Test Budget',
        periodStart: '2024-02-01T00:00:00.000Z',
        periodEnd: '2024-02-29T23:59:59.000Z',
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'archived',
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.periodStart).toBeInstanceOf(Date);
      expect(domain.periodEnd).toBeInstanceOf(Date);
      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.updatedAt).toBeInstanceOf(Date);
      expect(domain.periodStart.toISOString()).toBe('2024-02-01T00:00:00.000Z');
      expect(domain.periodEnd.toISOString()).toBe('2024-02-29T23:59:59.000Z');
    });

    it('should handle budget without sourceAnalysisId', () => {
      const entity: BudgetEntity = {
        budgetId: 'bdg-456',
        accountId: 'acc-789',
        organizationId: 'org-101',
        name: 'Manual Budget',
        periodStart: '2024-02-01T00:00:00.000Z',
        periodEnd: '2024-02-29T23:59:59.000Z',
        categoryBudgets: [],
        totalBudget: 100000,
        status: 'baseline',
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.sourceAnalysisId).toBeUndefined();
    });

    it('should handle all budget status values', () => {
      const statuses: Array<'baseline' | 'optimized' | 'active' | 'archived'> = [
        'baseline',
        'optimized',
        'active',
        'archived',
      ];

      statuses.forEach(status => {
        const entity: BudgetEntity = {
          budgetId: 'bdg-123',
          accountId: 'acc-456',
          organizationId: 'org-789',
          name: 'Test Budget',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-01-31T23:59:59.000Z',
          categoryBudgets: [],
          totalBudget: 100000,
          status,
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-16T10:00:00.000Z',
          profileOwner: 'user-101',
        };

        const domain = converter.toDomain(entity);
        expect(domain.status).toBe(status);
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const categoryBudgets: CategoryBudget[] = [
        {
          category: 'Travel',
          budgetAmount: 150000,
          currentSpending: 140000,
          percentage: 40.0,
          trend: 'down',
          notes: 'Planning vacation',
        },
        {
          category: 'Healthcare',
          budgetAmount: 50000,
          percentage: 13.3,
        },
      ];

      const original: Budget = {
        budgetId: 'bdg-789',
        accountId: 'acc-101',
        organizationId: 'org-202',
        name: 'Annual Budget 2024',
        periodStart: new Date('2024-01-01T00:00:00Z'),
        periodEnd: new Date('2024-12-31T23:59:59Z'),
        categoryBudgets,
        totalBudget: 375000,
        status: 'optimized',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        profileOwner: 'user-303',
        sourceAnalysisId: 'analysis-123',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip.budgetId).toBe(original.budgetId);
      expect(roundTrip.accountId).toBe(original.accountId);
      expect(roundTrip.organizationId).toBe(original.organizationId);
      expect(roundTrip.name).toBe(original.name);
      expect(roundTrip.totalBudget).toBe(original.totalBudget);
      expect(roundTrip.status).toBe(original.status);
      expect(roundTrip.profileOwner).toBe(original.profileOwner);
      expect(roundTrip.sourceAnalysisId).toBe(original.sourceAnalysisId);
      expect(roundTrip.categoryBudgets).toEqual(original.categoryBudgets);
      expect(roundTrip.periodStart.toISOString()).toBe(original.periodStart.toISOString());
      expect(roundTrip.periodEnd.toISOString()).toBe(original.periodEnd.toISOString());
      expect(roundTrip.createdAt.toISOString()).toBe(original.createdAt.toISOString());
      expect(roundTrip.updatedAt.toISOString()).toBe(original.updatedAt.toISOString());
    });

    it('should handle empty categoryBudgets array', () => {
      const original: Budget = {
        budgetId: 'bdg-empty',
        accountId: 'acc-456',
        organizationId: 'org-789',
        name: 'Empty Budget',
        periodStart: new Date('2024-01-01T00:00:00Z'),
        periodEnd: new Date('2024-01-31T23:59:59Z'),
        categoryBudgets: [],
        totalBudget: 0,
        status: 'baseline',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        profileOwner: 'user-303',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip.categoryBudgets).toEqual([]);
      expect(roundTrip.totalBudget).toBe(0);
    });
  });
});
