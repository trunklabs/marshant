import { ProjectRepository } from '@/lib/repositories/project-repository';
import { EnvironmentRepository } from '@/lib/repositories/environment-repository';
import { db } from '@/db';
import {
  ProjectNotFoundError,
  ProjectMustHaveEnvironmentError,
  validateProject,
  validateEnvironment,
} from '@marcurry/core';
import type { Project, ProjectId } from '@marcurry/core';

export class ProjectService {
  private projectRepo: ProjectRepository;
  private environmentRepo: EnvironmentRepository;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.environmentRepo = new EnvironmentRepository();
  }

  async getProject(id: ProjectId): Promise<Project> {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new ProjectNotFoundError(id);
    }
    return project;
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
  async createProject(data: { name: string; environments: Array<{ name: string; key: string }> }): Promise<Project> {
    if (!data.environments || data.environments.length === 0) {
      throw new ProjectMustHaveEnvironmentError();
    }

    validateProject({ name: data.name });

    for (const env of data.environments) {
      validateEnvironment(env);
    }

    return db.transaction(async (tx) => {
      const project = await this.projectRepo.create({ name: data.name }, tx);

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

  async updateProject(id: ProjectId, data: { name?: string }): Promise<Project> {
    return this.projectRepo.update(id, data);
  }

  async deleteProject(id: ProjectId): Promise<void> {
    await this.getProject(id);
    await this.projectRepo.delete(id);
  }
}
