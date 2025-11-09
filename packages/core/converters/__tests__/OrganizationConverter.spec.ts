import { OrganizationConverter } from '../OrganizationConverter';
import { Organization } from '../../models';
import { OrganizationEntity } from '@nueink/aws';

describe('OrganizationConverter', () => {
  let converter: OrganizationConverter;

  beforeEach(() => {
    converter = new OrganizationConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Organization to entity Organization', () => {
      const domain: Organization = {
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        parentOrgId: 'org-parent',
        createdByAccountId: 'acc-456',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        parentOrgId: 'org-parent',
        createdByAccountId: 'acc-456',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        profileOwner: 'user-789',
      });
    });

    it('should handle optional parentOrgId', () => {
      const domain: Organization = {
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        createdByAccountId: 'acc-456',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity.parentOrgId).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity Organization to domain Organization', () => {
      const entity: OrganizationEntity = {
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        parentOrgId: 'org-parent',
        createdByAccountId: 'acc-456',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        parentOrgId: 'org-parent',
        createdByAccountId: 'acc-456',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        status: 'active',
        profileOwner: 'user-789',
      });
    });

    it('should handle optional parentOrgId', () => {
      const entity: OrganizationEntity = {
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'company',
        createdByAccountId: 'acc-456',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain.parentOrgId).toBeUndefined();
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Organization = {
        orgId: 'org-123',
        name: 'Test Organization',
        type: 'family',
        parentOrgId: 'org-parent',
        createdByAccountId: 'acc-456',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
