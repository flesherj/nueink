import { AmplifyMembershipRepository } from '../AmplifyMembershipRepository';
import { MembershipEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyMembershipRepository', () => {
  let repository: AmplifyMembershipRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyMembershipRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByAccountAndOrganization', () => {
    it('should return membership when found', async () => {
      const mockData = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'owner',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Membership.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findByAccountAndOrganization('acc-1', 'org-1');

      expect(mockDbClient.models.Membership.get).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
      });
      expect(result).toEqual({
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'owner',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
    });

    it('should return null when membership not found', async () => {
      mockDbClient.models.Membership.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findByAccountAndOrganization('acc-1', 'org-1');

      expect(result).toBeNull();
    });

    it('should handle optional profileOwner being undefined', async () => {
      const mockData = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'member',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Membership.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findByAccountAndOrganization('acc-1', 'org-1');

      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all memberships', async () => {
      const mockData = [
        {
          accountId: 'acc-1',
          orgId: 'org-1',
          role: 'owner',
          status: 'active',
          joinedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          accountId: 'acc-2',
          orgId: 'org-1',
          role: 'member',
          status: 'active',
          joinedAt: '2025-01-02T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Membership.list.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findAll();

      expect(mockDbClient.models.Membership.list).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].accountId).toBe('acc-1');
      expect(result[1].accountId).toBe('acc-2');
    });

    it('should return empty array when no memberships exist', async () => {
      mockDbClient.models.Membership.list.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create new membership with all fields', async () => {
      const entity: MembershipEntity = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'owner',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Membership.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          joinedAt: entity.joinedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Membership.create).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'owner',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create membership with only required fields', async () => {
      const entity: MembershipEntity = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'member',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Membership.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          joinedAt: entity.joinedAt,
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Membership.create).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'member',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
        profileOwner: undefined,
      });
      expect(result.accountId).toBe('acc-1');
    });
  });

  describe('updateByCompositeKey', () => {
    it('should update membership with partial data', async () => {
      const updates: Partial<MembershipEntity> = {
        role: 'admin' as const,
        status: 'pending' as const,
      };

      const mockUpdated = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'admin',
        status: 'pending',
        joinedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Membership.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.updateByCompositeKey('acc-1', 'org-1', updates);

      expect(mockDbClient.models.Membership.update).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'admin',
        status: 'pending',
      });
      expect(result.role).toBe('admin');
      expect(result.status).toBe('pending');
    });

    it('should only include defined fields in update', async () => {
      const updates: Partial<MembershipEntity> = {
        role: 'admin' as const,
      };

      const mockUpdated = {
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'admin',
        status: 'active',
        joinedAt: '2025-01-01T00:00:00.000Z',
      };

      mockDbClient.models.Membership.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      await repository.updateByCompositeKey('acc-1', 'org-1', updates);

      expect(mockDbClient.models.Membership.update).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
        role: 'admin',
      });
    });
  });

  describe('deleteByCompositeKey', () => {
    it('should delete membership by composite id', async () => {
      mockDbClient.models.Membership.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.deleteByCompositeKey('acc-1', 'org-1');

      expect(mockDbClient.models.Membership.delete).toHaveBeenCalledWith({
        accountId: 'acc-1',
        orgId: 'org-1',
      });
    });
  });

  describe('findByOrganization', () => {
    it('should return all memberships for an organization', async () => {
      const mockData = [
        {
          accountId: 'acc-1',
          orgId: 'org-1',
          role: 'owner',
          status: 'active',
          joinedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          accountId: 'acc-2',
          orgId: 'org-1',
          role: 'member',
          status: 'active',
          joinedAt: '2025-01-02T00:00:00.000Z',
        },
      ];

      mockDbClient.models.Membership.listMembershipByOrgId.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByOrganization('org-1');

      expect(mockDbClient.models.Membership.listMembershipByOrgId).toHaveBeenCalledWith({
        orgId: 'org-1',
      });
      expect(result).toHaveLength(2);
      expect(result[0].orgId).toBe('org-1');
      expect(result[1].orgId).toBe('org-1');
    });

    it('should return empty array when no memberships exist', async () => {
      mockDbClient.models.Membership.listMembershipByOrgId.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByOrganization('org-1');

      expect(result).toEqual([]);
    });
  });

});
