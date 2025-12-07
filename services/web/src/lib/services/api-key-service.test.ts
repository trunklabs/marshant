import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectNotFoundError } from '@marcurry/core';

const mockApiKeyRepo = {
  findById: vi.fn(),
  findByProjectId: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateLastUsedAt: vi.fn(),
  delete: vi.fn(),
};

const mockProjectRepo = {
  findById: vi.fn(),
};

const mockEnvironmentRepo = {
  findById: vi.fn(),
  findByProjectId: vi.fn(),
  findByKey: vi.fn(),
};

vi.mock('@/lib/repositories/api-key-repository', () => ({
  ApiKeyRepository: class {
    findById = mockApiKeyRepo.findById;
    findByProjectId = mockApiKeyRepo.findByProjectId;
    findAll = mockApiKeyRepo.findAll;
    create = mockApiKeyRepo.create;
    update = mockApiKeyRepo.update;
    updateLastUsedAt = mockApiKeyRepo.updateLastUsedAt;
    delete = mockApiKeyRepo.delete;
  },
}));

vi.mock('@/lib/repositories/project-repository', () => ({
  ProjectRepository: class {
    findById = mockProjectRepo.findById;
  },
}));

vi.mock('@/lib/repositories/environment-repository', () => ({
  EnvironmentRepository: class {
    findById = mockEnvironmentRepo.findById;
    findByProjectId = mockEnvironmentRepo.findByProjectId;
    findByKey = mockEnvironmentRepo.findByKey;
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hashSync: vi.fn((value: string) => `hashed_${value}`),
    compareSync: vi.fn((value: string, hash: string) => hash === `hashed_${value}`),
  },
}));

describe('ApiKeyService', () => {
  let service: InstanceType<typeof import('./api-key-service').ApiKeyService>;
  let ApiKeyNotFoundError: typeof import('./api-key-service').ApiKeyNotFoundError;
  let InvalidApiKeyError: typeof import('./api-key-service').InvalidApiKeyError;
  let EnvironmentNotAllowedError: typeof import('./api-key-service').EnvironmentNotAllowedError;

  beforeEach(async () => {
    vi.clearAllMocks();

    const apiKeyModule = await import('./api-key-service');
    service = new apiKeyModule.ApiKeyService();
    ApiKeyNotFoundError = apiKeyModule.ApiKeyNotFoundError;
    InvalidApiKeyError = apiKeyModule.InvalidApiKeyError;
    EnvironmentNotAllowedError = apiKeyModule.EnvironmentNotAllowedError;
  });

  describe('createApiKey', () => {
    it('creates API key when project exists', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      const mockEnvs = [{ id: 'env-1', projectId: 'proj-1', name: 'Production' }];
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockEnvironmentRepo.findByProjectId.mockResolvedValue(mockEnvs);
      mockApiKeyRepo.create.mockImplementation((data) => ({
        id: 'key-1',
        ...data,
        createdAt: new Date(),
        lastUsedAt: null,
      }));

      const result = await service.createApiKey({
        projectId: 'proj-1',
        name: 'Production Key',
        allowedEnvironmentIds: ['env-1'],
      });

      expect(result.id).toBe('key-1');
      expect(result.name).toBe('Production Key');
      expect(result.secretKey).toMatch(/^mc_/);
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.createApiKey({
          projectId: 'non-existent',
          name: 'Test Key',
          allowedEnvironmentIds: [],
        })
      ).rejects.toThrow(ProjectNotFoundError);
    });

    it('throws error when environment does not belong to project', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockEnvironmentRepo.findByProjectId.mockResolvedValue([{ id: 'env-1', projectId: 'proj-1' }]);

      await expect(
        service.createApiKey({
          projectId: 'proj-1',
          name: 'Test Key',
          allowedEnvironmentIds: ['env-other'],
        })
      ).rejects.toThrow('does not belong to project');
    });
  });

  describe('listApiKeys', () => {
    it('returns API keys without secret hashes', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          projectId: 'proj-1',
          name: 'Key 1',
          secretKeyHash: 'hash1',
          allowedEnvironmentIds: [],
          createdAt: new Date(),
          lastUsedAt: null,
        },
      ];
      mockApiKeyRepo.findByProjectId.mockResolvedValue(mockKeys);

      const result = await service.listApiKeys('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('secretKeyHash');
      expect(result[0].name).toBe('Key 1');
    });
  });

  describe('getApiKey', () => {
    it('returns API key without secret hash', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        name: 'Test Key',
        secretKeyHash: 'hash',
        allowedEnvironmentIds: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };
      mockApiKeyRepo.findById.mockResolvedValue(mockKey);

      const result = await service.getApiKey('key-1');

      expect(result).not.toHaveProperty('secretKeyHash');
      expect(result.name).toBe('Test Key');
    });

    it('throws ApiKeyNotFoundError when key does not exist', async () => {
      mockApiKeyRepo.findById.mockResolvedValue(null);

      await expect(service.getApiKey('non-existent')).rejects.toThrow(ApiKeyNotFoundError);
    });
  });

  describe('updateApiKey', () => {
    it('updates API key name', async () => {
      const existingKey = {
        id: 'key-1',
        projectId: 'proj-1',
        name: 'Old Name',
        secretKeyHash: 'hash',
        allowedEnvironmentIds: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };
      mockApiKeyRepo.findById.mockResolvedValue(existingKey);
      mockApiKeyRepo.update.mockResolvedValue({ ...existingKey, name: 'New Name' });

      const result = await service.updateApiKey('key-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('validates environment IDs belong to project when updating', async () => {
      const existingKey = {
        id: 'key-1',
        projectId: 'proj-1',
        name: 'Test Key',
        secretKeyHash: 'hash',
        allowedEnvironmentIds: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };
      mockApiKeyRepo.findById.mockResolvedValue(existingKey);
      mockEnvironmentRepo.findByProjectId.mockResolvedValue([{ id: 'env-1', projectId: 'proj-1' }]);

      await expect(service.updateApiKey('key-1', { allowedEnvironmentIds: ['env-other'] })).rejects.toThrow(
        'does not belong to project'
      );
    });

    it('throws ApiKeyNotFoundError when key does not exist', async () => {
      mockApiKeyRepo.findById.mockResolvedValue(null);

      await expect(service.updateApiKey('non-existent', { name: 'New' })).rejects.toThrow(ApiKeyNotFoundError);
    });
  });

  describe('rotateApiKey', () => {
    it('generates new secret key', async () => {
      const existingKey = {
        id: 'key-1',
        projectId: 'proj-1',
        name: 'Test Key',
        secretKeyHash: 'old_hash',
        allowedEnvironmentIds: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };
      mockApiKeyRepo.findById.mockResolvedValue(existingKey);
      mockApiKeyRepo.update.mockImplementation((id, data) => ({
        ...existingKey,
        ...data,
      }));

      const result = await service.rotateApiKey('key-1');

      expect(result.secretKey).toMatch(/^mc_/);
      expect(mockApiKeyRepo.update).toHaveBeenCalledWith(
        'key-1',
        expect.objectContaining({ secretKeyHash: expect.any(String) })
      );
    });

    it('throws ApiKeyNotFoundError when key does not exist', async () => {
      mockApiKeyRepo.findById.mockResolvedValue(null);

      await expect(service.rotateApiKey('non-existent')).rejects.toThrow(ApiKeyNotFoundError);
    });
  });

  describe('deleteApiKey', () => {
    it('deletes existing API key', async () => {
      mockApiKeyRepo.findById.mockResolvedValue({ id: 'key-1' });
      mockApiKeyRepo.delete.mockResolvedValue(undefined);

      await service.deleteApiKey('key-1');

      expect(mockApiKeyRepo.delete).toHaveBeenCalledWith('key-1');
    });

    it('throws ApiKeyNotFoundError when key does not exist', async () => {
      mockApiKeyRepo.findById.mockResolvedValue(null);

      await expect(service.deleteApiKey('non-existent')).rejects.toThrow(ApiKeyNotFoundError);
    });
  });

  describe('validateApiKey', () => {
    it('validates correct API key and returns project info', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        name: 'Test Key',
        secretKeyHash: 'hashed_mc_secret123',
        allowedEnvironmentIds: ['env-1'],
        createdAt: new Date(),
        lastUsedAt: null,
      };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);
      mockApiKeyRepo.updateLastUsedAt.mockResolvedValue(undefined);

      const result = await service.validateApiKey('mc_secret123');

      expect(result.projectId).toBe('proj-1');
      expect(result.allowedEnvironmentIds).toEqual(['env-1']);
    });

    it('throws InvalidApiKeyError for invalid key', async () => {
      mockApiKeyRepo.findAll.mockResolvedValue([]);

      await expect(service.validateApiKey('invalid_key')).rejects.toThrow(InvalidApiKeyError);
    });

    it('throws InvalidApiKeyError when key does not match any hash', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        secretKeyHash: 'hashed_mc_different',
        allowedEnvironmentIds: [],
      };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);

      await expect(service.validateApiKey('mc_wrong_key')).rejects.toThrow(InvalidApiKeyError);
    });
  });

  describe('validateApiKeyForEnvironment', () => {
    it('validates API key has access to environment', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        secretKeyHash: 'hashed_mc_secret123',
        allowedEnvironmentIds: ['env-1'],
      };
      const mockEnv = { id: 'env-1', projectId: 'proj-1', key: 'production' };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);
      mockApiKeyRepo.updateLastUsedAt.mockResolvedValue(undefined);
      mockEnvironmentRepo.findByKey.mockResolvedValue(mockEnv);

      const result = await service.validateApiKeyForEnvironment('mc_secret123', 'production');

      expect(result.projectId).toBe('proj-1');
    });

    it('throws EnvironmentNotAllowedError when no environments configured', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        secretKeyHash: 'hashed_mc_secret123',
        allowedEnvironmentIds: [],
      };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);
      mockApiKeyRepo.updateLastUsedAt.mockResolvedValue(undefined);

      await expect(service.validateApiKeyForEnvironment('mc_secret123', 'production')).rejects.toThrow(
        EnvironmentNotAllowedError
      );
    });

    it('throws EnvironmentNotAllowedError when environment not in allowed list', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        secretKeyHash: 'hashed_mc_secret123',
        allowedEnvironmentIds: ['env-1'],
      };
      const mockEnv = { id: 'env-2', projectId: 'proj-1', key: 'staging' };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);
      mockApiKeyRepo.updateLastUsedAt.mockResolvedValue(undefined);
      mockEnvironmentRepo.findByKey.mockResolvedValue(mockEnv);

      await expect(service.validateApiKeyForEnvironment('mc_secret123', 'staging')).rejects.toThrow(
        EnvironmentNotAllowedError
      );
    });

    it('throws EnvironmentNotAllowedError when environment does not exist', async () => {
      const mockKey = {
        id: 'key-1',
        projectId: 'proj-1',
        secretKeyHash: 'hashed_mc_secret123',
        allowedEnvironmentIds: ['env-1'],
      };
      mockApiKeyRepo.findAll.mockResolvedValue([mockKey]);
      mockApiKeyRepo.updateLastUsedAt.mockResolvedValue(undefined);
      mockEnvironmentRepo.findByKey.mockResolvedValue(null);

      await expect(service.validateApiKeyForEnvironment('mc_secret123', 'non-existent')).rejects.toThrow(
        EnvironmentNotAllowedError
      );
    });
  });
});
