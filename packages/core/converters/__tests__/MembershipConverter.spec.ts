import { MembershipConverter } from '../MembershipConverter';
import { Membership } from '../../models';
import { MembershipEntity } from '@nueink/aws';

describe('MembershipConverter', () => {
  let converter: MembershipConverter;

  beforeEach(() => {
    converter = new MembershipConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Membership to entity Membership', () => {
      const domain: Membership = {
        accountId: 'acc-123',
        orgId: 'org-456',
        role: 'admin',
        status: 'active',
        joinedAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        accountId: 'acc-123',
        orgId: 'org-456',
        role: 'admin',
        status: 'active',
        joinedAt: '2024-01-15T10:00:00.000Z',
        profileOwner: 'user-789',
      });
    });
  });

  describe('toDomain', () => {
    it('should convert entity Membership to domain Membership', () => {
      const entity: MembershipEntity = {
        accountId: 'acc-123',
        orgId: 'org-456',
        role: 'member',
        status: 'pending',
        joinedAt: '2024-01-15T10:00:00.000Z',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        accountId: 'acc-123',
        orgId: 'org-456',
        role: 'member',
        status: 'pending',
        joinedAt: new Date('2024-01-15T10:00:00.000Z'),
        profileOwner: 'user-789',
      });
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Membership = {
        accountId: 'acc-123',
        orgId: 'org-456',
        role: 'owner',
        status: 'active',
        joinedAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
