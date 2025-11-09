import { AccountConverter } from '../AccountConverter';
import { Account } from '../../models';
import { AccountEntity } from '@nueink/aws';

describe('AccountConverter', () => {
  let converter: AccountConverter;

  beforeEach(() => {
    converter = new AccountConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Account to entity Account', () => {
      const domain: Account = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        middleName: 'Q',
        lastName: 'Doe',
        provider: 'cognito',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        meta: {
          onboardCompleted: true,
        },
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        middleName: 'Q',
        lastName: 'Doe',
        provider: 'cognito',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        meta: {
          onboardCompleted: true,
        },
        profileOwner: 'user-789',
      });
    });

    it('should handle optional fields', () => {
      const domain: Account = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity.firstName).toBeUndefined();
      expect(entity.middleName).toBeUndefined();
      expect(entity.lastName).toBeUndefined();
      expect(entity.meta).toBeUndefined();
    });

    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:45.123Z');
      const domain: Account = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: date,
        status: 'active',
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(domain);

      expect(entity.createdAt).toBe('2024-01-15T10:30:45.123Z');
    });
  });

  describe('toDomain', () => {
    it('should convert entity Account to domain Account', () => {
      const entity: AccountEntity = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        middleName: 'Q',
        lastName: 'Doe',
        provider: 'cognito',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        meta: {
          onboardCompleted: true,
        },
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        middleName: 'Q',
        lastName: 'Doe',
        provider: 'cognito',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        status: 'active',
        meta: {
          onboardCompleted: true,
        },
        profileOwner: 'user-789',
      });
    });

    it('should handle optional fields', () => {
      const entity: AccountEntity = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: '2024-01-15T10:00:00.000Z',
        status: 'active',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain.firstName).toBeUndefined();
      expect(domain.middleName).toBeUndefined();
      expect(domain.lastName).toBeUndefined();
      expect(domain.meta).toBeUndefined();
    });

    it('should convert ISO string to Date', () => {
      const entity: AccountEntity = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: '2024-01-15T10:30:45.123Z',
        status: 'active',
        profileOwner: 'user-789',
      };

      const domain = converter.toDomain(entity);

      expect(domain.createdAt).toBeInstanceOf(Date);
      expect(domain.createdAt.toISOString()).toBe('2024-01-15T10:30:45.123Z');
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Account = {
        accountId: 'acc-123',
        defaultOrgId: 'org-456',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        provider: 'cognito',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        status: 'active',
        meta: {
          onboardCompleted: true,
        },
        profileOwner: 'user-789',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
