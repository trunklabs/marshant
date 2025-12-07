import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProjectNotFoundError,
  ProjectMustHaveEnvironmentError,
  ProjectValidationError,
  EnvironmentValidationError,
} from '@marcurry/core';

const mockProjectRepo = {
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockEnvironmentRepo = {
  create: vi.fn(),
};

vi.mock('@/lib/repositories/project-repository', () => ({
  ProjectRepository: class {
    findById = mockProjectRepo.findById;
    findAll = mockProjectRepo.findAll;
    create = mockProjectRepo.create;
    update = mockProjectRepo.update;
    delete = mockProjectRepo.delete;
  },
}));

vi.mock('@/lib/repositories/environment-repository', () => ({
  EnvironmentRepository: class {
    create = mockEnvironmentRepo.create;
  },
}));

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn((callback) => callback({})),
  },
}));

describe('ProjectService', () => {
  let service: InstanceType<typeof import('./project-service').ProjectService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { ProjectService } = await import('./project-service');
    service = new ProjectService();
  });

  describe('getProject', () => {
    it('returns project when found', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      mockProjectRepo.findById.mockResolvedValue(mockProject);

      const result = await service.getProject('proj-1');

      expect(result).toEqual(mockProject);
      expect(mockProjectRepo.findById).toHaveBeenCalledWith('proj-1');
    });

    it('throws ProjectNotFoundError when project does not exist', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(service.getProject('non-existent')).rejects.toThrow(ProjectNotFoundError);
      await expect(service.getProject('non-existent')).rejects.toThrow('Project not found: non-existent');
    });
  });

  describe('listProjects', () => {
    it('returns all projects', async () => {
      const mockProjects = [
        { id: 'proj-1', name: 'Project 1' },
        { id: 'proj-2', name: 'Project 2' },
      ];
      mockProjectRepo.findAll.mockResolvedValue(mockProjects);

      const result = await service.listProjects();

      expect(result).toEqual(mockProjects);
      expect(mockProjectRepo.findAll).toHaveBeenCalled();
    });

    it('returns empty array when no projects exist', async () => {
      mockProjectRepo.findAll.mockResolvedValue([]);

      const result = await service.listProjects();

      expect(result).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('creates project with environments', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      mockProjectRepo.create.mockResolvedValue(mockProject);
      mockEnvironmentRepo.create.mockResolvedValue({});

      const result = await service.createProject({
        name: 'Test Project',
        environments: [
          { name: 'Production', key: 'production' },
          { name: 'Staging', key: 'staging' },
        ],
      });

      expect(result).toEqual(mockProject);
      expect(mockProjectRepo.create).toHaveBeenCalledWith({ name: 'Test Project' }, expect.anything());
      expect(mockEnvironmentRepo.create).toHaveBeenCalledTimes(2);
    });

    it('throws ProjectMustHaveEnvironmentError when environments array is empty', async () => {
      await expect(
        service.createProject({
          name: 'Test Project',
          environments: [],
        })
      ).rejects.toThrow(ProjectMustHaveEnvironmentError);

      expect(mockProjectRepo.create).not.toHaveBeenCalled();
    });

    it('throws ProjectMustHaveEnvironmentError when environments is undefined', async () => {
      await expect(
        service.createProject({
          name: 'Test Project',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          environments: undefined as any,
        })
      ).rejects.toThrow(ProjectMustHaveEnvironmentError);
    });

    it('throws ProjectValidationError when project name is empty', async () => {
      await expect(
        service.createProject({
          name: '',
          environments: [{ name: 'Production', key: 'production' }],
        })
      ).rejects.toThrow(ProjectValidationError);
    });

    it('throws ProjectValidationError when project name is too long', async () => {
      await expect(
        service.createProject({
          name: 'a'.repeat(201),
          environments: [{ name: 'Production', key: 'production' }],
        })
      ).rejects.toThrow(ProjectValidationError);
    });

    it('throws EnvironmentValidationError when environment key is invalid', async () => {
      await expect(
        service.createProject({
          name: 'Test Project',
          environments: [{ name: 'Production', key: 'INVALID-KEY' }],
        })
      ).rejects.toThrow(EnvironmentValidationError);
    });

    it('throws EnvironmentValidationError when environment name is empty', async () => {
      await expect(
        service.createProject({
          name: 'Test Project',
          environments: [{ name: '', key: 'production' }],
        })
      ).rejects.toThrow(EnvironmentValidationError);
    });

    it('validates all environments before creating any', async () => {
      await expect(
        service.createProject({
          name: 'Test Project',
          environments: [
            { name: 'Production', key: 'production' },
            { name: '', key: 'staging' },
          ],
        })
      ).rejects.toThrow(EnvironmentValidationError);

      expect(mockProjectRepo.create).not.toHaveBeenCalled();
      expect(mockEnvironmentRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    it('updates project name', async () => {
      const mockProject = { id: 'proj-1', name: 'Updated Name' };
      mockProjectRepo.update.mockResolvedValue(mockProject);

      const result = await service.updateProject('proj-1', { name: 'Updated Name' });

      expect(result).toEqual(mockProject);
      expect(mockProjectRepo.update).toHaveBeenCalledWith('proj-1', { name: 'Updated Name' });
    });
  });

  describe('deleteProject', () => {
    it('deletes existing project', async () => {
      const mockProject = { id: 'proj-1', name: 'Test Project' };
      mockProjectRepo.findById.mockResolvedValue(mockProject);
      mockProjectRepo.delete.mockResolvedValue(undefined);

      await service.deleteProject('proj-1');

      expect(mockProjectRepo.findById).toHaveBeenCalledWith('proj-1');
      expect(mockProjectRepo.delete).toHaveBeenCalledWith('proj-1');
    });

    it('throws ProjectNotFoundError when trying to delete non-existent project', async () => {
      mockProjectRepo.findById.mockResolvedValue(null);

      await expect(service.deleteProject('non-existent')).rejects.toThrow(ProjectNotFoundError);
      expect(mockProjectRepo.delete).not.toHaveBeenCalled();
    });
  });
});
