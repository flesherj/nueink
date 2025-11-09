import { PersonConverter } from '../PersonConverter';
import { Person } from '../../models';
import { PersonEntity } from '@nueink/aws';

describe('PersonConverter', () => {
  let converter: PersonConverter;

  beforeEach(() => {
    converter = new PersonConverter();
  });

  describe('toEntity', () => {
    it('should convert domain Person to entity Person', () => {
      const domain: Person = {
        personId: 'person-123',
        organizationId: 'org-456',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 'https://example.com/avatar.png',
        sortOrder: 1,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity).toEqual({
        personId: 'person-123',
        organizationId: 'org-456',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 'https://example.com/avatar.png',
        sortOrder: 1,
        createdAt: '2024-01-15T10:00:00.000Z',
        profileOwner: 'user-101',
      });
    });

    it('should handle optional fields', () => {
      const domain: Person = {
        personId: 'person-123',
        organizationId: 'org-456',
        name: 'James',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        profileOwner: 'user-101',
      };

      const entity = converter.toEntity(domain);

      expect(entity.color).toBeUndefined();
      expect(entity.avatarUrl).toBeUndefined();
      expect(entity.sortOrder).toBeUndefined();
    });
  });

  describe('toDomain', () => {
    it('should convert entity Person to domain Person', () => {
      const entity: PersonEntity = {
        personId: 'person-456',
        organizationId: 'org-789',
        name: 'Shared',
        color: '#00AA00',
        avatarUrl: 'https://example.com/shared.png',
        sortOrder: 3,
        createdAt: '2024-01-20T10:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain).toEqual({
        personId: 'person-456',
        organizationId: 'org-789',
        name: 'Shared',
        color: '#00AA00',
        avatarUrl: 'https://example.com/shared.png',
        sortOrder: 3,
        createdAt: new Date('2024-01-20T10:00:00.000Z'),
        profileOwner: 'user-202',
      });
    });

    it('should handle optional fields', () => {
      const entity: PersonEntity = {
        personId: 'person-456',
        organizationId: 'org-789',
        name: 'John',
        createdAt: '2024-01-20T10:00:00.000Z',
        profileOwner: 'user-202',
      };

      const domain = converter.toDomain(entity);

      expect(domain.color).toBeUndefined();
      expect(domain.avatarUrl).toBeUndefined();
      expect(domain.sortOrder).toBeUndefined();
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const original: Person = {
        personId: 'person-789',
        organizationId: 'org-101',
        name: 'Michael',
        color: '#0000FF',
        avatarUrl: 'https://example.com/michael.png',
        sortOrder: 2,
        createdAt: new Date('2024-01-25T10:00:00Z'),
        profileOwner: 'user-303',
      };

      const entity = converter.toEntity(original);
      const roundTrip = converter.toDomain(entity);

      expect(roundTrip).toEqual(original);
    });
  });
});
