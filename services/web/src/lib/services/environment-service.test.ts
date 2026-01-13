import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EnvironmentNotFoundError,
  ProjectNotFoundError,
  CannotDeleteLastEnvironmentError,
  EnvironmentValidationError,
} from '@marshant/core';

const mockEnvironmentRepo = {
  findById: vi.fn(),
  findByKey: vi.fn(),
  findByProjectId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockProjectRepo = {
  findById: vi.fn(),
};

vi.mock('@/lib/repositories/environment-repository', () => ({
  EnvironmentRepository: class {
    findById = mockEnvironmentRepo.findById;
    findByKey = mockEnvironmentRepo.findByKey;
    findByProjectId = mockEnvironmentRepo.findByProjectId;
    create = mockEnvironmentRepo.create;
    update = mockEnvironmentRepo.update;
    delete = mockEnvironmentRepo.delete;
  },
}));

vi.mock('@/lib/repositories/project-repository', () => ({
  ProjectRepository: class {
    findById = mockProjectRepo.findById;
  },
}));

describe('EnvironmentService', () => {
  let service: InstanceType<typeof import('./environment-service').EnvironmentService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { EnvironmentService } = await import('./environment-service');
    service = new EnvironmentService();
  });

  describe('getEnvironment', () => {
    it('returns environment when found', async () => {
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockEnvironmentRepo.findById.mockResolvedValue(mockEnv);

      const result = await service.getEnvironment('env-1');

      expect(result).toEqual(mockEnv);
      expect(mockEnvironmentRepo.findById).toHaveBeenCalledWith('env-1');
    });

    it('throws EnvironmentNotFoundError when environment does not exist', async () => {
      mockEnvironmentRepo.findById.mockResolvedValue(null);

      await expect(service.getEnvironment('non-existent')).rejects.toThrow(EnvironmentNotFoundError);
    });
  });

  describe('getEnvironmentByKey', () => {
    it('returns environment when found by key', async () => {
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockEnvironmentRepo.findByKey.mockResolvedValue(mockEnv);

      const result = await service.getEnvironmentByKey('proj-1', 'production');

      expect(result).toEqual(mockEnv);
      expect(mockEnvironmentRepo.findByKey).toHaveBeenCalledWith('proj-1', 'production');
    });

    it('throws EnvironmentNotFoundError when environment key does not exist', async () => {
      mockEnvironmentRepo.findByKey.mockResolvedValue(null);

      await expect(service.getEnvironmentByKey('proj-1', 'non-existent')).rejects.toThrow(EnvironmentNotFoundError);
    });
  });

  describe('listEnvironments', () => {
    it('returns all environments for a project', async () => {
      const mockEnvs = [
        { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' },
        { id: 'env-2', projectId: 'proj-1', name: 'Staging', key: 'staging' },
      ];
      mockEnvironmentRepo.findByProjectId.mockResolvedValue(mockEnvs);

      const result = await service.listEnvironments('proj-1');

      expect(result).toEqual(mockEnvs);
      expect(mockEnvironmentRepo.findByProjectId).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('createEnvironment', () => {
    it('creates environment when project exists and data is valid', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockEnvironmentRepo.create.mockResolvedValue(mockEnv);

      const result = await service.createEnvironment({
        projectId: 'proj-1',
        name: 'Production',
        key: 'production',
      });

      expect(result).toEqual(mockEnv);
      expect(mockProjectRepo.findById).toHaveBeenCalledWith('proj-1');
      expect(mockEnvironmentRepo.create).toHaveBeenCalledWith({
        projectId: 'proj-1',
        name: 'Production',
        key: 'production',
      });
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(
        service.createEnvironment({
          projectId: 'non-existent',
          name: 'Production',
          key: 'production',
        })
      ).rejects.toThrow(ProjectNotFoundError);

      expect(mockEnvironmentRepo.create).not.toHaveBeenCalled();
    });

    it('throws EnvironmentValidationError when key is invalid', async () => {
      await expect(
        service.createEnvironment({
          projectId: 'proj-1',
          name: 'Production',
          key: 'INVALID-KEY',
        })
      ).rejects.toThrow(EnvironmentValidationError);

      expect(mockProjectRepo.findById).not.toHaveBeenCalled();
    });

    it('throws EnvironmentValidationError when name is empty', async () => {
      await expect(
        service.createEnvironment({
          projectId: 'proj-1',
          name: '',
          key: 'production',
        })
      ).rejects.toThrow(EnvironmentValidationError);
    });
  });

  describe('updateEnvironment', () => {
    it('updates environment with valid data', async () => {
      const existingEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      const updatedEnv = { id: 'env-1', projectId: 'proj-1', name: 'Prod', key: 'production' };
      mockEnvironmentRepo.findById.mockResolvedValue(existingEnv);
      mockEnvironmentRepo.update.mockResolvedValue(updatedEnv);

      const result = await service.updateEnvironment('env-1', { name: 'Prod' });

      expect(result).toEqual(updatedEnv);
      expect(mockEnvironmentRepo.update).toHaveBeenCalledWith('env-1', { name: 'Prod' });
    });

    it('throws EnvironmentNotFoundError when environment does not exist', async () => {
      mockEnvironmentRepo.findById.mockResolvedValue(null);

      await expect(service.updateEnvironment('non-existent', { name: 'New Name' })).rejects.toThrow(
        EnvironmentNotFoundError
      );
    });

    it('throws EnvironmentValidationError when updated key is invalid', async () => {
      const existingEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockEnvironmentRepo.findById.mockResolvedValue(existingEnv);

      await expect(service.updateEnvironment('env-1', { key: 'INVALID' })).rejects.toThrow(EnvironmentValidationError);

      expect(mockEnvironmentRepo.update).not.toHaveBeenCalled();
    });

    it('validates merged data, not just the update', async () => {
      const existingEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockEnvironmentRepo.findById.mockResolvedValue(existingEnv);

      await expect(service.updateEnvironment('env-1', { name: '' })).rejects.toThrow(EnvironmentValidationError);
    });
  });

  describe('deleteEnvironment', () => {
    it('deletes environment when more than one exists', async () => {
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      const allEnvs = [
        { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' },
        { id: 'env-2', projectId: 'proj-1', name: 'Staging', key: 'staging' },
      ];
      mockEnvironmentRepo.findById.mockResolvedValue(mockEnv);
      mockEnvironmentRepo.findByProjectId.mockResolvedValue(allEnvs);
      mockEnvironmentRepo.delete.mockResolvedValue(undefined);

      await service.deleteEnvironment('env-1');

      expect(mockEnvironmentRepo.delete).toHaveBeenCalledWith('env-1');
    });

    it('throws CannotDeleteLastEnvironmentError when trying to delete the last environment', async () => {
      const mockEnv = { id: 'env-1', projectId: 'proj-1', name: 'Production', key: 'production' };
      mockEnvironmentRepo.findById.mockResolvedValue(mockEnv);
      mockEnvironmentRepo.findByProjectId.mockResolvedValue([mockEnv]);

      await expect(service.deleteEnvironment('env-1')).rejects.toThrow(CannotDeleteLastEnvironmentError);
      await expect(service.deleteEnvironment('env-1')).rejects.toThrow('Cannot delete the last environment in project');

      expect(mockEnvironmentRepo.delete).not.toHaveBeenCalled();
    });

    it('throws EnvironmentNotFoundError when environment does not exist', async () => {
      mockEnvironmentRepo.findById.mockResolvedValue(null);

      await expect(service.deleteEnvironment('non-existent')).rejects.toThrow(EnvironmentNotFoundError);
    });
  });
});
