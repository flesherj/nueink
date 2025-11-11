import { BudgetConverter } from '../BudgetConverter';
import { Budget } from '../../models';
import { BudgetEntity } from '@nueink/aws';

describe('BudgetConverter', () => {
  let converter: BudgetConverter;

  beforeEach(() => {
    converter = new BudgetConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Budget to entity Budget', () => {
      const domain: Budget = {
        budgetId: 'bdg-123',
        organizationId: 'org-456',
        category: 'groceries',
        amount: 500,
        period: 'monthly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        budgetId: 'bdg-123',
        organizationId: 'org-456',
        category: 'groceries',
        amount: 500,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-101',
      });
    });

    it('should convert dates to date-only strings for startDate and endDate', () => {
      const domain: Budget = {
        budgetId: 'bdg-123',
        organizationId: 'org-456',
        category: 'dining',
        amount: 300,
        period: 'monthly',
        startDate: new Date('2024-01-01T10:30:00Z'),
        endDate: new Date('2024-12-31T23:59:59Z'),
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.startDate).toBe('2024-01-01');
      expect(entity.endDate).toBe('2024-12-31');
    });
  });

  describe('toDomain', () => {
    it('should convert entity Budget to domain Budget', () => {
      const entity: BudgetEntity = {
        budgetId: 'bdg-456',
        organizationId: 'org-789',
        category: 'entertainment',
        amount: 200,
        period: 'weekly',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        status: 'active',
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.budgetId).toBe('bdg-456');
      expect(domain.amount).toBe(200);
      expect(domain.startDate).toBeInstanceOf(Date);
      expect(domain.endDate).toBeInstanceOf(Date);
    });

    it('should convert all date fields correctly', () => {
      const entity: BudgetEntity = {
        budgetId: 'bdg-456',
        organizationId: 'org-789',
        category: 'other',
        amount: 100,
        period: 'monthly',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        status: 'active',
        createdAt: '2024-02-01T10:00:00.000Z',
        updatedAt: '2024-02-01T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.startDate).toBeInstanceOf(Date);
      expect(domain.endDate).toBeInstanceOf(Date);
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Budget = {
        budgetId: 'bdg-789',
        organizationId: 'org-101',
        category: 'travel',
        amount: 2000,
        period: 'yearly',
        startDate: new Date('2024-01-01T00:00:00Z'),
        endDate: new Date('2024-12-31T00:00:00Z'),
        status: 'active',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T11:00:00Z'),
        profileOwner: 'user-303',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      // Note: date-only fields lose time portion (intentional)
      expect(roundTrip.budgetId).toBe(original.budgetId);
      expect(roundTrip.amount).toBe(original.amount);
      expect(roundTrip.startDate.toISOString().split('T')[0]).toBe(
        original.startDate.toISOString().split('T')[0]
      );
      expect(roundTrip.endDate?.toISOString().split('T')[0]).toBe(
        original.endDate?.toISOString().split('T')[0]
      );
    });
  });
});
