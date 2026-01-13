import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FlagNotFoundError,
  ProjectNotFoundError,
  EnvironmentNotFoundError,
  FlagEnvironmentConfigNotFoundError,
  FlagValidationError,
  GateValidationError,
} from '@marshant/core';

const mockFlagRepo = {
  findById: vi.fn(),
  findByKey: vi.fn(),
  findByProjectId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockConfigRepo = {
  findById: vi.fn(),
  findByFlagAndEnvironment: vi.fn(),
  findByKeys: vi.fn(),
  findByFlagId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockEnvironmentRepo = {
  findById: vi.fn(),
};

const mockProjectRepo = {
  findById: vi.fn(),
};

vi.mock('@/lib/repositories/flag-repository', () => ({
  FlagRepository: class {
    findById = mockFlagRepo.findById;
    findByKey = mockFlagRepo.findByKey;
    findByProjectId = mockFlagRepo.findByProjectId;
    create = mockFlagRepo.create;
    update = mockFlagRepo.update;
    delete = mockFlagRepo.delete;
  },
}));

vi.mock('@/lib/repositories/flag-config-repository', () => ({
  FlagConfigRepository: class {
    findById = mockConfigRepo.findById;
    findByFlagAndEnvironment = mockConfigRepo.findByFlagAndEnvironment;
    findByKeys = mockConfigRepo.findByKeys;
    findByFlagId = mockConfigRepo.findByFlagId;
    create = mockConfigRepo.create;
    update = mockConfigRepo.update;
    delete = mockConfigRepo.delete;
  },
}));

vi.mock('@/lib/repositories/environment-repository', () => ({
  EnvironmentRepository: class {
    findById = mockEnvironmentRepo.findById;
  },
}));

vi.mock('@/lib/repositories/project-repository', () => ({
  ProjectRepository: class {
    findById = mockProjectRepo.findById;
  },
}));

describe('FlagService', () => {
  let service: InstanceType<typeof import('./flag-service').FlagService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { FlagService } = await import('./flag-service');
    service = new FlagService();
  });

  describe('getFlag', () => {
    it('returns flag when found', async () => {
      const mockFlag = {
        id: 'flag-1',
        projectId: 'proj-1',
        key: 'my-flag',
        name: 'My Flag',
        valueType: 'boolean',
        defaultValue: false,
      };
      mockFlagRepo.findById.mockResolvedValue(mockFlag);

      const result = await service.getFlag('flag-1');

      expect(result).toEqual(mockFlag);
    });

    it('throws FlagNotFoundError when flag does not exist', async () => {
      mockFlagRepo.findById.mockResolvedValue(null);

      await expect(service.getFlag('non-existent')).rejects.toThrow(FlagNotFoundError);
    });
  });

  describe('getFlagByKey', () => {
    it('returns flag when found by key', async () => {
      const mockFlag = {
        id: 'flag-1',
        projectId: 'proj-1',
        key: 'my-flag',
        name: 'My Flag',
        valueType: 'boolean',
        defaultValue: false,
      };
      mockFlagRepo.findByKey.mockResolvedValue(mockFlag);

      const result = await service.getFlagByKey('proj-1', 'my-flag');

      expect(result).toEqual(mockFlag);
      expect(mockFlagRepo.findByKey).toHaveBeenCalledWith('proj-1', 'my-flag');
    });

    it('throws FlagNotFoundError when flag key does not exist', async () => {
      mockFlagRepo.findByKey.mockResolvedValue(null);

      await expect(service.getFlagByKey('proj-1', 'non-existent')).rejects.toThrow(FlagNotFoundError);
    });
  });

  describe('createFlag', () => {
    it('creates flag when project exists and data is valid', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      const mockFlag = {
        id: 'flag-1',
        projectId: 'proj-1',
        key: 'my-flag',
        name: 'My Flag',
        valueType: 'boolean',
        defaultValue: false,
      };
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockFlagRepo.create.mockResolvedValue(mockFlag);

      const result = await service.createFlag({
        projectId: 'proj-1',
        key: 'my-flag',
        name: 'My Flag',
        valueType: 'boolean',
        defaultValue: false,
      });

      expect(result).toEqual(mockFlag);
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.createFlag({
          projectId: 'non-existent',
          key: 'my-flag',
          name: 'My Flag',
          valueType: 'boolean',
          defaultValue: false,
        })
      ).rejects.toThrow(ProjectNotFoundError);

      expect(mockFlagRepo.create).not.toHaveBeenCalled();
    });

    it('throws FlagValidationError when key is invalid', async () => {
      await expect(
        service.createFlag({
          projectId: 'proj-1',
          key: 'INVALID-KEY',
          name: 'My Flag',
          valueType: 'boolean',
          defaultValue: false,
        })
      ).rejects.toThrow(FlagValidationError);
    });

    it('throws FlagValidationError when name is empty', async () => {
      await expect(
        service.createFlag({
          projectId: 'proj-1',
          key: 'my-flag',
          name: '',
          valueType: 'boolean',
          defaultValue: false,
        })
      ).rejects.toThrow(FlagValidationError);
    });
  });

  describe('updateFlag', () => {
    it('updates flag when it exists', async () => {
      const existingFlag = {
        id: 'flag-1',
        projectId: 'proj-1',
        key: 'my-flag',
        name: 'My Flag',
        valueType: 'boolean',
        defaultValue: false,
      };
      const updatedFlag = { ...existingFlag, name: 'Updated Flag' };
      mockFlagRepo.findById.mockResolvedValue(existingFlag);
      mockFlagRepo.update.mockResolvedValue(updatedFlag);

      const result = await service.updateFlag('flag-1', { name: 'Updated Flag' });

      expect(result).toEqual(updatedFlag);
    });

    it('throws FlagNotFoundError when flag does not exist', async () => {
      mockFlagRepo.findById.mockResolvedValue(null);

      await expect(service.updateFlag('non-existent', { name: 'New Name' })).rejects.toThrow(FlagNotFoundError);
    });
  });

  describe('deleteFlag', () => {
    it('deletes flag when it exists', async () => {
      const mockFlag = { id: 'flag-1', projectId: 'proj-1', key: 'my-flag', name: 'My Flag' };
      mockFlagRepo.findById.mockResolvedValue(mockFlag);
      mockFlagRepo.delete.mockResolvedValue(undefined);

      await service.deleteFlag('flag-1');

      expect(mockFlagRepo.delete).toHaveBeenCalledWith('flag-1');
    });

    it('throws FlagNotFoundError when flag does not exist', async () => {
      mockFlagRepo.findById.mockResolvedValue(null);

      await expect(service.deleteFlag('non-existent')).rejects.toThrow(FlagNotFoundError);
    });
  });

  describe('getFlagConfig', () => {
    it('returns config when found', async () => {
      const mockConfig = {
        id: 'config-1',
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: true,
        defaultValue: true,
        gates: [],
      };
      mockConfigRepo.findByFlagAndEnvironment.mockResolvedValue(mockConfig);

      const result = await service.getFlagConfig('flag-1', 'env-1');

      expect(result).toEqual(mockConfig);
    });

    it('throws FlagEnvironmentConfigNotFoundError when config does not exist', async () => {
      mockConfigRepo.findByFlagAndEnvironment.mockResolvedValue(null);

      await expect(service.getFlagConfig('flag-1', 'env-1')).rejects.toThrow(FlagEnvironmentConfigNotFoundError);
    });
  });

  describe('createFlagConfig', () => {
    it('creates config when flag and environment exist', async () => {
      const mockFlag = { id: 'flag-1', projectId: 'proj-1', key: 'my-flag' };
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production' };
      const mockConfig = {
        id: 'config-1',
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: true,
        defaultValue: true,
        gates: [],
      };
      mockFlagRepo.findById.mockResolvedValue(mockFlag);
      mockEnvironmentRepo.findById.mockResolvedValue(mockEnv);
      mockConfigRepo.create.mockResolvedValue(mockConfig);

      const result = await service.createFlagConfig({
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: true,
        defaultValue: true,
      });

      expect(result).toEqual(mockConfig);
    });

    it('throws FlagNotFoundError when flag does not exist', async () => {
      mockFlagRepo.findById.mockResolvedValue(null);

      await expect(
        service.createFlagConfig({
          flagId: 'non-existent',
          environmentId: 'env-1',
          enabled: true,
          defaultValue: true,
        })
      ).rejects.toThrow(FlagNotFoundError);
    });

    it('throws EnvironmentNotFoundError when environment does not exist', async () => {
      mockFlagRepo.findById.mockResolvedValue({ id: 'flag-1' });
      mockEnvironmentRepo.findById.mockResolvedValue(null);

      await expect(
        service.createFlagConfig({
          flagId: 'flag-1',
          environmentId: 'non-existent',
          enabled: true,
          defaultValue: true,
        })
      ).rejects.toThrow(EnvironmentNotFoundError);
    });

    it('validates gates when provided', async () => {
      mockFlagRepo.findById.mockResolvedValue({ id: 'flag-1' });
      mockEnvironmentRepo.findById.mockResolvedValue({ id: 'env-1' });

      await expect(
        service.createFlagConfig({
          flagId: 'flag-1',
          environmentId: 'env-1',
          enabled: true,
          defaultValue: true,
          gates: [{ id: 'gate-1', type: 'actors', enabled: true, actorIds: [], value: true }],
        })
      ).rejects.toThrow(GateValidationError);
    });
  });

  describe('updateFlagConfig', () => {
    it('updates config when it exists', async () => {
      const existingConfig = {
        id: 'config-1',
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: false,
        defaultValue: false,
        gates: [],
      };
      const updatedConfig = { ...existingConfig, enabled: true };
      mockConfigRepo.findById.mockResolvedValue(existingConfig);
      mockConfigRepo.update.mockResolvedValue(updatedConfig);

      const result = await service.updateFlagConfig('config-1', { enabled: true });

      expect(result).toEqual(updatedConfig);
    });

    it('throws FlagEnvironmentConfigNotFoundError when config does not exist', async () => {
      mockConfigRepo.findById.mockResolvedValue(null);

      await expect(service.updateFlagConfig('non-existent', { enabled: true })).rejects.toThrow(
        FlagEnvironmentConfigNotFoundError
      );
    });

    it('validates gates when provided in update', async () => {
      mockConfigRepo.findById.mockResolvedValue({ id: 'config-1' });

      await expect(
        service.updateFlagConfig('config-1', {
          gates: [{ id: 'gate-1', type: 'actors', enabled: true, actorIds: [], value: true }],
        })
      ).rejects.toThrow(GateValidationError);
    });
  });

  describe('deleteFlagConfig', () => {
    it('deletes config when it exists', async () => {
      mockConfigRepo.findById.mockResolvedValue({ id: 'config-1' });
      mockConfigRepo.delete.mockResolvedValue(undefined);

      await service.deleteFlagConfig('config-1');

      expect(mockConfigRepo.delete).toHaveBeenCalledWith('config-1');
    });

    it('throws FlagEnvironmentConfigNotFoundError when config does not exist', async () => {
      mockConfigRepo.findById.mockResolvedValue(null);

      await expect(service.deleteFlagConfig('non-existent')).rejects.toThrow(FlagEnvironmentConfigNotFoundError);
    });
  });

  describe('evaluateFlag', () => {
    it('evaluates flag for actor', async () => {
      const mockConfig = {
        id: 'config-1',
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: true,
        defaultValue: true,
        gates: [],
      };
      mockConfigRepo.findByKeys.mockResolvedValue(mockConfig);

      const result = await service.evaluateFlag('proj-1', 'production', 'my-flag', { id: 'user-123' });

      expect(result).toEqual({
        flagKey: 'my-flag',
        enabled: true,
        value: true,
        reason: 'default value',
      });
    });

    it('returns disabled result when flag is disabled', async () => {
      const mockConfig = {
        id: 'config-1',
        flagId: 'flag-1',
        environmentId: 'env-1',
        enabled: false,
        defaultValue: false,
        gates: [],
      };
      mockConfigRepo.findByKeys.mockResolvedValue(mockConfig);

      const result = await service.evaluateFlag('proj-1', 'production', 'my-flag', { id: 'user-123' });

      expect(result.enabled).toBe(false);
      expect(result.reason).toBe('flag disabled');
    });

    it('throws FlagEnvironmentConfigNotFoundError when config does not exist', async () => {
      mockConfigRepo.findByKeys.mockResolvedValue(null);

      await expect(service.evaluateFlag('proj-1', 'production', 'non-existent', { id: 'user-123' })).rejects.toThrow(
        FlagEnvironmentConfigNotFoundError
      );
    });
  });
});
