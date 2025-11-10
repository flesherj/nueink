import { AmplifyOrganizationRepository } from '../AmplifyOrganizationRepository';
import { OrganizationEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyOrganizationRepository', () => {
  let repository: AmplifyOrganizationRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyOrganizationRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return organization when found', async () => {
      const mockData = {
        orgId: 'org-1',
        name: 'Test Org',
        type: 'family',
        parentOrgId: 'parent-1',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Organization.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('org-1');

      expect(mockDbClient.models.Organization.get).toHaveBeenCalledWith({
        orgId: 'org-1',
      });
      expect(result).toEqual({
        orgId: 'org-1',
        name: 'Test Org',
        type: 'family',
        parentOrgId: 'parent-1',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      });
    });

    it('should return null when organization not found', async () => {
      mockDbClient.models.Organization.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        orgId: 'org-1',
        name: 'Test Org',
        type: 'individual',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
      };

      mockDbClient.models.Organization.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('org-1');

      expect(result?.parentOrgId).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all organizations', async () => {
      const mockData = [
        {
          orgId: 'org-1',
          name: 'Test Org 1',
          type: 'family',
          createdByAccountId: 'acc-1',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
        {
          orgId: 'org-2',
          name: 'Test Org 2',
          type: 'company',
          createdByAccountId: 'acc-2',
          createdAt: '2025-01-02T00:00:00.000Z',
          status: 'active',
        },
      ];

      mockDbClient.models.Organization.list.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findAll();

      expect(mockDbClient.models.Organization.list).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].orgId).toBe('org-1');
      expect(result[1].orgId).toBe('org-2');
    });

    it('should return empty array when no organizations exist', async () => {
      mockDbClient.models.Organization.list.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create new organization with all fields', async () => {
      const entity: OrganizationEntity = {
        orgId: 'org-1',
        name: 'Test Org',
        type: 'family',
        parentOrgId: 'parent-1',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Organization.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Organization.create).toHaveBeenCalledWith({
        orgId: 'org-1',
        name: 'Test Org',
        type: 'family',
        parentOrgId: 'parent-1',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create organization with only required fields', async () => {
      const entity: OrganizationEntity = {
        orgId: 'org-1',
        name: 'Test Org',
        type: 'individual',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
      };

      mockDbClient.models.Organization.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Organization.create).toHaveBeenCalledWith({
        orgId: 'org-1',
        name: 'Test Org',
        type: 'individual',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        parentOrgId: undefined,
        profileOwner: undefined,
      });
      expect(result.orgId).toBe('org-1');
    });
  });

  describe('update', () => {
    it('should update organization with partial data', async () => {
      const updates = {
        name: 'Updated Org',
        status: 'inactive' as const,
      };

      const mockUpdated = {
        orgId: 'org-1',
        name: 'Updated Org',
        type: 'family',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'inactive',
      };

      mockDbClient.models.Organization.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('org-1', updates);

      expect(mockDbClient.models.Organization.update).toHaveBeenCalledWith({
        orgId: 'org-1',
        name: 'Updated Org',
        status: 'inactive',
      });
      expect(result.name).toBe('Updated Org');
      expect(result.status).toBe('inactive');
    });

    it('should only include defined fields in update', async () => {
      const updates = {
        name: 'Updated Org',
      };

      const mockUpdated = {
        orgId: 'org-1',
        name: 'Updated Org',
        type: 'family',
        createdByAccountId: 'acc-1',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
      };

      mockDbClient.models.Organization.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      await repository.update('org-1', updates);

      expect(mockDbClient.models.Organization.update).toHaveBeenCalledWith({
        orgId: 'org-1',
        name: 'Updated Org',
      });
    });
  });

  describe('delete', () => {
    it('should delete organization by id', async () => {
      mockDbClient.models.Organization.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('org-1');

      expect(mockDbClient.models.Organization.delete).toHaveBeenCalledWith({
        orgId: 'org-1',
      });
    });
  });

  describe('findByParentOrgId', () => {
    it('should return child organizations', async () => {
      const mockData = [
        {
          orgId: 'org-child-1',
          name: 'Child Org 1',
          type: 'team',
          parentOrgId: 'parent-1',
          createdByAccountId: 'acc-1',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
        {
          orgId: 'org-child-2',
          name: 'Child Org 2',
          type: 'team',
          parentOrgId: 'parent-1',
          createdByAccountId: 'acc-1',
          createdAt: '2025-01-02T00:00:00.000Z',
          status: 'active',
        },
      ];

      mockDbClient.models.Organization.listOrganizationByParentOrgId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByParentOrgId('parent-1');

      expect(mockDbClient.models.Organization.listOrganizationByParentOrgId).toHaveBeenCalledWith({
        parentOrgId: 'parent-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].parentOrgId).toBe('parent-1');
      expect(result[1].parentOrgId).toBe('parent-1');
    });

    it('should return empty array when no children exist', async () => {
      mockDbClient.models.Organization.listOrganizationByParentOrgId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByParentOrgId('parent-1');

      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return organizations when found by name', async () => {
      const mockData = [
        {
          orgId: 'org-1',
          name: 'Test Org',
          type: 'family',
          createdByAccountId: 'acc-1',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
      ];

      mockDbClient.models.Organization.listOrganizationByName.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByName('Test Org');

      expect(mockDbClient.models.Organization.listOrganizationByName).toHaveBeenCalledWith({
        name: 'Test Org',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Org');
    });

    it('should return empty array when name not found', async () => {
      mockDbClient.models.Organization.listOrganizationByName.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByName('Nonexistent Org');

      expect(result).toEqual([]);
    });
  });
});
