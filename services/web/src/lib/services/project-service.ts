import { ProjectRepository } from '@/lib/repositories/project-repository';
import { EnvironmentRepository } from '@/lib/repositories/environment-repository';
import { db, projectOwners } from '@/db';
import { eq, and } from 'drizzle-orm';
import {
  ProjectNotFoundError,
  ProjectMustHaveEnvironmentError,
  validateProject,
  validateEnvironment,
} from '@marshant/core';
import type { Project, ProjectId } from '@marshant/core';

export class ProjectAccessDeniedError extends Error {
  constructor(projectId: string, ownerId: string, ownerType: 'organization' | 'user') {
    super(`Access denied: Project ${projectId} does not belong to ${ownerType} ${ownerId}`);
    this.name = 'ProjectAccessDeniedError';
  }
}

export class ProjectService {
  private projectRepo: ProjectRepository;
  private environmentRepo: EnvironmentRepository;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.environmentRepo = new EnvironmentRepository();
  }

  /**
   * Verify that a project belongs to the specified owner (organization or user).
   * @throws {ProjectAccessDeniedError} If project doesn't belong to owner
   */
  private async verifyProjectAccess(
    projectId: ProjectId,
    ownerId: string,
    ownerType: 'organization' | 'user'
  ): Promise<void> {
    const whereClause =
      ownerType === 'organization'
        ? and(eq(projectOwners.projectId, projectId), eq(projectOwners.organizationId, ownerId))
        : and(eq(projectOwners.projectId, projectId), eq(projectOwners.userId, ownerId));

    const relation = await db.select().from(projectOwners).where(whereClause).limit(1);

    if (relation.length === 0) {
      throw new ProjectAccessDeniedError(projectId, ownerId, ownerType);
    }
  }

  /**
   * Get a project by ID, optionally verifying owner access.
   */
  async getProject(id: ProjectId, ownerId?: string, ownerType?: 'organization' | 'user'): Promise<Project> {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new ProjectNotFoundError(id);
    }

    if (ownerId && ownerType) {
      await this.verifyProjectAccess(id, ownerId, ownerType);
    }

    return project;
  }

  /**
   * List all projects belonging to an owner (organization or user).
   */
  async listProjectsByOwner(ownerId: string, ownerType: 'organization' | 'user'): Promise<Project[]> {
    return this.projectRepo.findByOwner(ownerId, ownerType);
  }

  async listProjects(): Promise<Project[]> {
    return this.projectRepo.findAll();
  }

  /**
   * Creates a new project with its initial environments.
   * Project and environments are created atomically - if any environment
   * fails validation or creation, the entire operation is rolled back.
   * @throws {ProjectMustHaveEnvironmentError} When no environments provided
   * @throws {ProjectValidationError} When project name is invalid
   * @throws {EnvironmentValidationError} When any environment has invalid key/name
   */
  async createProject(data: {
    name: string;
    key: string;
    environments: Array<{ name: string; key: string }>;
    ownerId: string;
    ownerType: 'organization' | 'user';
    createdBy: string;
  }): Promise<Project> {
    if (!data.environments || data.environments.length === 0) {
      throw new ProjectMustHaveEnvironmentError();
    }

    validateProject({ name: data.name, key: data.key });

    for (const env of data.environments) {
      validateEnvironment(env);
    }

    return db.transaction(async (tx) => {
      const project = await this.projectRepo.create({ name: data.name, key: data.key }, tx);

      const ownershipData =
        data.ownerType === 'organization'
          ? {
              organizationId: data.ownerId,
              userId: null,
              projectId: project.id,
              key: data.key,
              createdBy: data.createdBy,
            }
          : {
              organizationId: null,
              userId: data.ownerId,
              projectId: project.id,
              key: data.key,
              createdBy: data.createdBy,
            };

      await tx.insert(projectOwners).values(ownershipData);

      for (const env of data.environments) {
        await this.environmentRepo.create(
          {
            projectId: project.id,
            name: env.name,
            key: env.key,
          },
          tx
        );
      }

      return project;
    });
  }

  async updateProject(
    id: ProjectId,
    data: { name?: string },
    ownerId?: string,
    ownerType?: 'organization' | 'user'
  ): Promise<Project> {
    if (ownerId && ownerType) {
      await this.verifyProjectAccess(id, ownerId, ownerType);
    }
    return this.projectRepo.update(id, data);
  }

  async deleteProject(id: ProjectId, ownerId?: string, ownerType?: 'organization' | 'user'): Promise<void> {
    await this.getProject(id, ownerId, ownerType);
    await this.projectRepo.delete(id);
  }
}
