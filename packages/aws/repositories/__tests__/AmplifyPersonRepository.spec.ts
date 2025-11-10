import { AmplifyPersonRepository } from '../AmplifyPersonRepository';
import { PersonEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyPersonRepository', () => {
  let repository: AmplifyPersonRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyPersonRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return person when found', async () => {
      const mockData = {
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 's3://bucket/avatar.png',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Person.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('person-1');

      expect(mockDbClient.models.Person.get).toHaveBeenCalledWith({
        personId: 'person-1',
      });
      expect(result).toEqual({
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 's3://bucket/avatar.png',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when person not found', async () => {
      mockDbClient.models.Person.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'James',
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Person.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('person-1');

      expect(result?.color).toBeUndefined();
      expect(result?.avatarUrl).toBeUndefined();
      expect(result?.sortOrder).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new person with all fields', async () => {
      const entity: PersonEntity = {
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 's3://bucket/avatar.png',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Person.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Person.create).toHaveBeenCalledWith({
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'Sarah',
        color: '#FF5733',
        avatarUrl: 's3://bucket/avatar.png',
        sortOrder: 1,
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create person with only required fields', async () => {
      const entity: PersonEntity = {
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'James',
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Person.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Person.create).toHaveBeenCalledWith({
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'James',
        createdAt: '2025-01-01T00:00:00.000Z',
        color: undefined,
        avatarUrl: undefined,
        sortOrder: undefined,
        profileOwner: undefined,
      });
      expect(result.name).toBe('James');
    });
  });

  describe('update', () => {
    it('should update person details', async () => {
      const updates = {
        color: '#00FF00',
        sortOrder: 2,
      };

      const mockUpdated = {
        personId: 'person-1',
        organizationId: 'org-1',
        name: 'Sarah',
        color: '#00FF00',
        sortOrder: 2,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Person.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('person-1', updates);

      expect(mockDbClient.models.Person.update).toHaveBeenCalledWith({
        personId: 'person-1',
        color: '#00FF00',
        sortOrder: 2,
      });
      expect(result.color).toBe('#00FF00');
      expect(result.sortOrder).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete person by id', async () => {
      mockDbClient.models.Person.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('person-1');

      expect(mockDbClient.models.Person.delete).toHaveBeenCalledWith({
        personId: 'person-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return all people for an organization', async () => {
      const mockData = [
        {
          personId: 'person-1',
          organizationId: 'org-1',
          name: 'Sarah',
          color: '#FF5733',
          sortOrder: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          personId: 'person-2',
          organizationId: 'org-1',
          name: 'James',
          color: '#3357FF',
          sortOrder: 2,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          personId: 'person-3',
          organizationId: 'org-1',
          name: 'Shared',
          color: '#888888',
          sortOrder: 3,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Person.listPersonByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(mockDbClient.models.Person.listPersonByOrganizationId).toHaveBeenCalledWith({
        organizationId: 'org-1',
      });
      expect(result).toHaveLength(3);
      expect(result.every((p) => p.organizationId === 'org-1')).toBe(true);
    });

    it('should return empty array when no people exist', async () => {
      mockDbClient.models.Person.listPersonByOrganizationId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByOrganization('org-1');

      expect(result).toEqual([]);
    });
  });
});
