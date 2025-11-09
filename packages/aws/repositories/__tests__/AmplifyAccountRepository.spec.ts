import { AmplifyAccountRepository } from '../AmplifyAccountRepository';
import { AccountEntity } from '../../models';
import { createMockDbClient, createMockResponse, createMockListResponse } from './test-utils';

describe('AmplifyAccountRepository', () => {
  let repository: AmplifyAccountRepository;
  let mockDbClient: ReturnType<typeof createMockDbClient>;

  beforeEach(() => {
    mockDbClient = createMockDbClient();
    repository = new AmplifyAccountRepository(mockDbClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return account when found', async () => {
      const mockData = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        middleName: 'M',
        lastName: 'User',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Account.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('acc-1');

      expect(mockDbClient.models.Account.get).toHaveBeenCalledWith({
        accountId: 'acc-1',
      });
      expect(result).toEqual({
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        middleName: 'M',
        lastName: 'User',
        provider: 'cognito',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        status: 'active',
        profileOwner: 'user-1',
      });
    });

    it('should return null when account not found', async () => {
      mockDbClient.models.Account.get.mockResolvedValue(
        createMockResponse(null)
      );

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle optional fields being undefined', async () => {
      const mockData = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
      };

      mockDbClient.models.Account.get.mockResolvedValue(
        createMockResponse(mockData)
      );

      const result = await repository.findById('acc-1');

      expect(result?.firstName).toBeUndefined();
      expect(result?.middleName).toBeUndefined();
      expect(result?.lastName).toBeUndefined();
      expect(result?.profileOwner).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all accounts', async () => {
      const mockData = [
        {
          accountId: 'acc-1',
          defaultOrgId: 'org-1',
          email: 'test1@example.com',
          username: 'testuser1',
          provider: 'cognito',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
        {
          accountId: 'acc-2',
          defaultOrgId: 'org-2',
          email: 'test2@example.com',
          username: 'testuser2',
          provider: 'google',
          createdAt: '2025-01-02T00:00:00.000Z',
          status: 'invited',
        },
      ];

      mockDbClient.models.Account.list.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findAll();

      expect(mockDbClient.models.Account.list).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].accountId).toBe('acc-1');
      expect(result[1].accountId).toBe('acc-2');
    });

    it('should return empty array when no accounts exist', async () => {
      mockDbClient.models.Account.list.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create new account with all fields', async () => {
      const entity: AccountEntity = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        middleName: 'M',
        lastName: 'User',
        provider: 'cognito',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        status: 'active',
        profileOwner: 'user-1',
      };

      mockDbClient.models.Account.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt.toISOString(),
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Account.create).toHaveBeenCalledWith({
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        middleName: 'M',
        lastName: 'User',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        profileOwner: 'user-1',
      });
      expect(result).toEqual(entity);
    });

    it('should create account with only required fields', async () => {
      const entity: AccountEntity = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        status: 'active',
      };

      mockDbClient.models.Account.create.mockResolvedValue(
        createMockResponse({
          ...entity,
          createdAt: entity.createdAt.toISOString(),
        })
      );

      const result = await repository.save(entity);

      expect(mockDbClient.models.Account.create).toHaveBeenCalledWith({
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
        firstName: undefined,
        middleName: undefined,
        lastName: undefined,
        profileOwner: undefined,
      });
      expect(result.accountId).toBe('acc-1');
    });
  });

  describe('update', () => {
    it('should update account with partial data', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        status: 'disabled' as const,
      };

      const mockUpdated = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'Name',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'disabled',
      };

      mockDbClient.models.Account.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      const result = await repository.update('acc-1', updates);

      expect(mockDbClient.models.Account.update).toHaveBeenCalledWith({
        accountId: 'acc-1',
        firstName: 'Updated',
        lastName: 'Name',
        status: 'disabled',
      });
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.status).toBe('disabled');
    });

    it('should only include defined fields in update', async () => {
      const updates = {
        firstName: 'Updated',
      };

      const mockUpdated = {
        accountId: 'acc-1',
        defaultOrgId: 'org-1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        provider: 'cognito',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'active',
      };

      mockDbClient.models.Account.update.mockResolvedValue(
        createMockResponse(mockUpdated)
      );

      await repository.update('acc-1', updates);

      expect(mockDbClient.models.Account.update).toHaveBeenCalledWith({
        accountId: 'acc-1',
        firstName: 'Updated',
      });
    });
  });

  describe('delete', () => {
    it('should delete account by id', async () => {
      mockDbClient.models.Account.delete.mockResolvedValue(
        createMockResponse(null)
      );

      await repository.delete('acc-1');

      expect(mockDbClient.models.Account.delete).toHaveBeenCalledWith({
        accountId: 'acc-1',
      });
    });
  });

  describe('findByEmail', () => {
    it('should return account when found by email', async () => {
      const mockData = [
        {
          accountId: 'acc-1',
          defaultOrgId: 'org-1',
          email: 'test@example.com',
          username: 'testuser',
          provider: 'cognito',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
      ];

      mockDbClient.models.Account.listAccountByEmail.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByEmail('test@example.com');

      expect(mockDbClient.models.Account.listAccountByEmail).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when email not found', async () => {
      mockDbClient.models.Account.listAccountByEmail.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return account when found by username', async () => {
      const mockData = [
        {
          accountId: 'acc-1',
          defaultOrgId: 'org-1',
          email: 'test@example.com',
          username: 'testuser',
          provider: 'cognito',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'active',
        },
      ];

      mockDbClient.models.Account.listAccountByUsername.mockResolvedValue(
        createMockListResponse(mockData)
      );

      const result = await repository.findByUsername('testuser');

      expect(mockDbClient.models.Account.listAccountByUsername).toHaveBeenCalledWith({
        username: 'testuser',
      });
      expect(result).not.toBeNull();
      expect(result?.username).toBe('testuser');
    });

    it('should return null when username not found', async () => {
      mockDbClient.models.Account.listAccountByUsername.mockResolvedValue(
        createMockListResponse([])
      );

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });
});
