import { InstitutionConverter } from '../InstitutionConverter';
import { Institution } from '../../models';
import { InstitutionEntity } from '@nueink/aws';

describe('InstitutionConverter', () => {
  let converter: InstitutionConverter;

  beforeEach(() => {
    converter = new InstitutionConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Institution to entity Institution', () => {
      const domain: Institution = {
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'plaid',
        externalId: 'plaid-123',
        externalItemId: 'item-456',
        name: 'Bank of America',
        logo: 'https://example.com/logo.png',
        status: 'active',
        lastSyncedAt: new Date('2024-01-16T10:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'plaid',
        externalId: 'plaid-123',
        externalItemId: 'item-456',
        name: 'Bank of America',
        logo: 'https://example.com/logo.png',
        status: 'active',
        lastSyncedAt: '2024-01-16T10:00:00.000Z',
        createdAt: '2024-01-15T10:00:00.000Z',
        profileOwner: 'user-789',
      });
    });

    it('should handle optional fields', () => {
      const domain: Institution = {
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'manual',
        name: 'Custom Institution',
        status: 'active',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity.externalId).toBeUndefined();
      expect(entity.externalItemId).toBeUndefined();
      expect(entity.logo).toBeUndefined();
      expect(entity.lastSyncedAt).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity Institution to domain Institution', () => {
      const entity: InstitutionEntity = {
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'plaid',
        externalId: 'plaid-456',
        externalItemId: 'item-789',
        name: 'Chase',
        logo: 'https://example.com/chase.png',
        status: 'active',
        lastSyncedAt: '2024-01-16T10:00:00.000Z',
        createdAt: '2024-01-15T10:00:00.000Z',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'plaid',
        externalId: 'plaid-456',
        externalItemId: 'item-789',
        name: 'Chase',
        logo: 'https://example.com/chase.png',
        status: 'active',
        lastSyncedAt: new Date('2024-01-16T10:00:00.000Z'),
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        profileOwner: 'user-789',
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Institution = {
        institutionId: 'inst-123',
        organizationId: 'org-456',
        provider: 'plaid',
        externalId: 'plaid-789',
        externalItemId: 'item-101',
        name: 'Wells Fargo',
        logo: 'https://example.com/wf.png',
        status: 'active',
        lastSyncedAt: new Date('2024-01-16T10:00:00Z'),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
