import { FinancialAccountConverter } from '../FinancialAccountConverter';
import { FinancialAccount } from '../../models';
import { FinancialAccountEntity } from '@nueink/aws';

describe('FinancialAccountConverter', () => {
  let converter: FinancialAccountConverter;

  beforeEach(() => {
    converter = new FinancialAccountConverter();
  });

  describe('toEntity', () => {
    it('should convert domain FinancialAccount to entity FinancialAccount', () => {
      const domain: FinancialAccount = {
        financialAccountId: 'facc-123',
        institutionId: 'inst-456',
        organizationId: 'org-789',
        provider: 'plaid',
        externalAccountId: 'plaid-acc-123',
        name: 'Chase Checking',
        officialName: 'Chase Bank Checking Account',
        mask: '1234',
        type: 'checking',
        currentBalance: 5000.50,
        availableBalance: 4500.25,
        currency: 'USD',
        personId: 'person-101',
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        financialAccountId: 'facc-123',
        institutionId: 'inst-456',
        organizationId: 'org-789',
        provider: 'plaid',
        externalAccountId: 'plaid-acc-123',
        name: 'Chase Checking',
        officialName: 'Chase Bank Checking Account',
        mask: '1234',
        type: 'checking',
        currentBalance: 5000.50,
        availableBalance: 4500.25,
        currency: 'USD',
        personId: 'person-101',
        status: 'active',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T10:00:00.000Z',
        profileOwner: 'user-101',
      });
    });

    it('should handle optional fields', () => {
      const domain: FinancialAccount = {
        financialAccountId: 'facc-123',
        institutionId: 'inst-456',
        organizationId: 'org-789',
        provider: 'manual',
        name: 'Cash Account',
        type: 'cash',
        currency: 'USD',
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.externalAccountId).toBeUndefined();
      expect(entity.officialName).toBeUndefined();
      expect(entity.mask).toBeUndefined();
      expect(entity.currentBalance).toBeUndefined();
      expect(entity.availableBalance).toBeUndefined();
      expect(entity.personId).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity FinancialAccount to domain FinancialAccount', () => {
      const entity: FinancialAccountEntity = {
        financialAccountId: 'facc-456',
        institutionId: 'inst-789',
        organizationId: 'org-101',
        provider: 'plaid',
        externalAccountId: 'plaid-acc-456',
        name: 'Amex Gold Card',
        officialName: 'American Express Gold Card',
        mask: '5678',
        type: 'credit_card',
        currentBalance: -2500.75,
        availableBalance: 7500.00,
        currency: 'USD',
        personId: 'person-202',
        status: 'active',
        createdAt: '2024-01-20T10:00:00.000Z',
        updatedAt: '2024-01-20T12:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        financialAccountId: 'facc-456',
        institutionId: 'inst-789',
        organizationId: 'org-101',
        provider: 'plaid',
        externalAccountId: 'plaid-acc-456',
        name: 'Amex Gold Card',
        officialName: 'American Express Gold Card',
        mask: '5678',
        type: 'credit_card',
        currentBalance: -2500.75,
        availableBalance: 7500.00,
        currency: 'USD',
        personId: 'person-202',
        status: 'active',
        createdAt: new Date('2024-01-20T10:00:00.000Z'),
        updatedAt: new Date('2024-01-20T12:00:00.000Z'),
        profileOwner: 'user-202',
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: FinancialAccount = {
        financialAccountId: 'facc-789',
        institutionId: 'inst-101',
        organizationId: 'org-202',
        provider: 'plaid',
        externalAccountId: 'plaid-acc-789',
        name: 'Investment Account',
        officialName: 'Vanguard Brokerage Account',
        mask: '9012',
        type: 'brokerage',
        currentBalance: 50000,
        availableBalance: 48000,
        currency: 'USD',
        personId: 'person-303',
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
