import { DebtConverter } from '../DebtConverter';
import { Debt } from '../../models';
import { DebtEntity } from '@nueink/aws';

describe('DebtConverter', () => {
  let converter: DebtConverter;

  beforeEach(() => {
    converter = new DebtConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Debt to entity Debt', () => {
      const domain: Debt = {
        debtId: 'debt-123',
        organizationId: 'org-456',
        financialAccountId: 'facc-789',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000,
        currentBalance: 35000,
        interestRate: 0.0499,
        minimumPayment: 500,
        dueDate: 15,
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        debtId: 'debt-123',
        organizationId: 'org-456',
        financialAccountId: 'facc-789',
        name: 'Student Loan',
        type: 'loan',
        originalBalance: 50000,
        currentBalance: 35000,
        interestRate: 0.0499,
        minimumPayment: 500,
        dueDate: 15,
        status: 'active',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-101',
      });
    });

    it('should handle optional fields', () => {
      const domain: Debt = {
        debtId: 'debt-123',
        organizationId: 'org-456',
        name: 'Credit Card Debt',
        type: 'credit_card',
        originalBalance: 10000,
        currentBalance: 7500,
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.financialAccountId).toBeUndefined();
      expect(entity.interestRate).toBeUndefined();
      expect(entity.minimumPayment).toBeUndefined();
      expect(entity.dueDate).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity Debt to domain Debt', () => {
      const entity: DebtEntity = {
        debtId: 'debt-456',
        organizationId: 'org-789',
        financialAccountId: 'facc-101',
        name: 'Mortgage',
        type: 'mortgage',
        originalBalance: 300000,
        currentBalance: 275000,
        interestRate: 0.035,
        minimumPayment: 2000,
        dueDate: 1,
        status: 'active',
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        debtId: 'debt-456',
        organizationId: 'org-789',
        financialAccountId: 'facc-101',
        name: 'Mortgage',
        type: 'mortgage',
        originalBalance: 300000,
        currentBalance: 275000,
        interestRate: 0.035,
        minimumPayment: 2000,
        dueDate: 1,
        status: 'active',
        createdAt: new Date('2024-01-20T10:00:00.000Z'),
        updatedAt: new Date('2024-01-20T12:00:00.000Z'),
        profileOwner: 'user-202',
      });
    });

    it('should handle optional dueDate', () => {
      const entity: DebtEntity = {
        debtId: 'debt-456',
        organizationId: 'org-789',
        name: 'Personal Loan',
        type: 'loan',
        originalBalance: 5000,
        currentBalance: 3000,
        status: 'active',
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.dueDate).toBeUndefined();
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Debt = {
        debtId: 'debt-789',
        organizationId: 'org-101',
        financialAccountId: 'facc-202',
        name: 'Car Loan',
        type: 'loan',
        originalBalance: 25000,
        currentBalance: 18000,
        interestRate: 0.055,
        minimumPayment: 450,
        dueDate: 20,
        status: 'active',
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
