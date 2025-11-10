import { AmplifyInstitutionRepository } from '../AmplifyInstitutionRepository';
import { InstitutionEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyInstitutionRepository', () => {
  let repository: AmplifyInstitutionRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyInstitutionRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return institution when found', async () => {
      const mockData = {
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalId: 'ins_123',
        externalItemId: 'item_456',
        name: 'Chase Bank',
        logo: 'https://plaid.com/logos/chase.png',
        status: 'active',
        lastSyncedAt: '2025-01-15T12:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Institution.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('inst-1');

      expect(mockDbClient.models.Institution.get).toHaveBeenCalledWith({
        institutionId: 'inst-1',
      });
      expect(result).toEqual({
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalId: 'ins_123',
        externalItemId: 'item_456',
        name: 'Chase Bank',
        logo: 'https://plaid.com/logos/chase.png',
        status: 'active',
        lastSyncedAt: '2025-01-15T12:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when institution not found', async () => {
      mockDbClient.models.Institution.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'manual',
        name: 'Manual Bank',
        status: 'active',
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Institution.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('inst-1');

      expect(result?.externalId).toBeUndefined();
      expect(result?.externalItemId).toBeUndefined();
      expect(result?.logo).toBeUndefined();
      expect(result?.lastSyncedAt).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('save', () => {
    it('should create new institution with all fields', async () => {
      const entity: InstitutionEntity = {
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalId: 'ins_123',
        externalItemId: 'item_456',
        name: 'Chase Bank',
        logo: 'https://plaid.com/logos/chase.png',
        status: 'active',
        lastSyncedAt: '2025-01-15T12:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Institution.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          lastSyncedAt: entity.lastSyncedAt,
          createdAt: entity.createdAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Institution.create).toHaveBeenCalledWith({
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        externalId: 'ins_123',
        externalItemId: 'item_456',
        name: 'Chase Bank',
        logo: 'https://plaid.com/logos/chase.png',
        status: 'active',
        lastSyncedAt: '2025-01-15T12:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update institution with partial data', async () => {
      const updates = {
        status: 'error' as const,
        lastSyncedAt: '2025-01-16T10:00:00.000Z',
      };

      const mockUpdated = {
        institutionId: 'inst-1',
        organizationId: 'org-1',
        provider: 'plaid',
        name: 'Chase Bank',
        status: 'error',
        lastSyncedAt: '2025-01-16T10:00:00.000Z',
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Institution.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('inst-1', updates);

      expect(mockDbClient.models.Institution.update).toHaveBeenCalledWith({
        institutionId: 'inst-1',
        status: 'error',
        lastSyncedAt: '2025-01-16T10:00:00.000Z',
      });
      expect(result.status).toBe('error');
    });
  });

  describe('findByOrganization', () => {
    it('should return all institutions for an organization', async () => {
      const mockData = [
        {
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          name: 'Chase Bank',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
        {
          institutionId: 'inst-2',
          organizationId: 'org-1',
          provider: 'plaid',
          name: 'Bank of America',
          status: 'active',
          createdAt: '2025-01-02T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Institution.listInstitutionByOrganizationId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(mockDbClient.models.Institution.listInstitutionByOrganizationId).toHaveBeenCalledWith({
        organizationId: 'org-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].organizationId).toBe('org-1');
    });
  });

  describe('findByExternalItemId', () => {
    it('should return institution by external item ID', async () => {
      const mockData = [
        {
          institutionId: 'inst-1',
          organizationId: 'org-1',
          provider: 'plaid',
          externalItemId: 'item_456',
          name: 'Chase Bank',
          status: 'active',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Institution.listInstitutionByExternalItemId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByExternalItemId('item_456');

      expect(mockDbClient.models.Institution.listInstitutionByExternalItemId).toHaveBeenCalledWith({
        externalItemId: 'item_456',
      });
      expect(result).not.toBeNull();
      expect(result?.externalItemId).toBe('item_456');
    });

    it('should return null when external item ID not found', async () => {
      mockDbClient.models.Institution.listInstitutionByExternalItemId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByExternalItemId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
