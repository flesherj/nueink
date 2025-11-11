import { AccountService } from '../AccountService';
import { Account } from '../../models';
import { AccountRepository } from '../../repositories';
import { AccountEntity } from '@nueink/aws';

describe('AccountService', () => {
  let service: AccountService;
  let mockRepository: jest.Mocked<AccountRepository<AccountEntity>>;

  const mockAccountEntity: AccountEntity = {
    accountId: 'acc-123',
    defaultOrgId: 'org-456',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    provider: 'cognito',
    createdAt: '2024-01-15T10:00:00.000Z',
    status: 'active',
    profileOwner: 'user-789',
  };

  const mockAccount: Account = {
    accountId: 'acc-123',
    defaultOrgId: 'org-456',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    provider: 'cognito',
    createdAt: new Date('2024-01-15T10:00:00.000Z'),
    status: 'active',
    profileOwner: 'user-789',
  };

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new AccountService(mockRepository);
  });

  describe('findById', () => {
    it('should return domain Account when entity exists', async () => {
      mockRepository.findById.mockResolvedValue(mockAccountEntity);

      const result = await service.findById('acc-123');

      expect(mockRepository.findById).toHaveBeenCalledWith('acc-123');
      expect(result).toEqual(mockAccount);
    });

    it('should return null when entity does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return array of domain Accounts', async () => {
      mockRepository.findAll.mockResolvedValue([mockAccountEntity]);

      const result = await service.findAll();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAccount);
    });

    it('should return empty array when no entities exist', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByEmail', () => {
    it('should return domain Account when found', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockAccountEntity);

      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockAccount);
    });

    it('should return null when not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should return domain Account when found', async () => {
      mockRepository.findByUsername.mockResolvedValue(mockAccountEntity);

      const result = await service.findByUsername('testuser');

      expect(mockRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual(mockAccount);
    });

    it('should return null when not found', async () => {
      mockRepository.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return domain Account', async () => {
      mockRepository.save.mockResolvedValue(mockAccountEntity);

      const result = await service.create(mockAccount);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: mockAccount.accountId,
          email: mockAccount.email,
          createdAt: mockAccount.createdAt.toISOString(),
        })
      );
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should update and return domain Account', async () => {
      const updates = { firstName: 'Jane', lastName: 'Smith' };
      const updatedEntity = { ...mockAccountEntity, ...updates };
      const updatedDomain = { ...mockAccount, ...updates };

      mockRepository.update.mockResolvedValue(updatedEntity);

      const result = await service.update('acc-123', updates);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'acc-123',
        expect.objectContaining(updates)
      );
      expect(result).toEqual(updatedDomain);
    });
  });

  describe('delete', () => {
    it('should call repository delete', async () => {
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('acc-123');

      expect(mockRepository.delete).toHaveBeenCalledWith('acc-123');
    });
  });
});
